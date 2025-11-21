
from flask import Flask, request, jsonify
from flask_cors import CORS
import nibabel as nib
import numpy as np
import torch
from dotenv import load_dotenv
load_dotenv()
import torch.nn as nn
import cv2
import io
import base64
from PIL import Image
import tempfile
import os
import requests
from datetime import datetime
import time
from pymongo import MongoClient
from vedo import Volume, Plotter, screenshot
import matplotlib
matplotlib.use('Agg') 

app = Flask(__name__)
CORS(app)


MONGODB_URI = os.getenv("DB")
client = MongoClient(MONGODB_URI)
db = client["liver_segmentation_db"]
results_collection = db["results"]


IMG_SIZE = (256, 256)
DISPLAY_SIZE = (640, 640)
WINDOW_CENTER = 60
WINDOW_WIDTH = 158
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IMGBB_API_KEY = os.getenv("API")
IMGBB_UPLOAD_URL = os.getenv("UPLOAD_URL")


# === UNet Model ===
class UNet(nn.Module):
    def __init__(self, in_channels=1, out_channels=3, init_features=32):
        super().__init__()
        feats = init_features
        self.enc1 = UNet._block(in_channels, feats)
        self.pool = nn.MaxPool2d(2, 2)
        self.enc2 = UNet._block(feats, feats*2)
        self.enc3 = UNet._block(feats*2, feats*4)
        self.enc4 = UNet._block(feats*4, feats*8)
        self.bottleneck = UNet._block(feats*8, feats*16)
        self.up4 = nn.ConvTranspose2d(feats*16, feats*8, 2, 2)
        self.dec4 = UNet._block(feats*16, feats*8)
        self.up3 = nn.ConvTranspose2d(feats*8, feats*4, 2, 2)
        self.dec3 = UNet._block(feats*8, feats*4)
        self.up2 = nn.ConvTranspose2d(feats*4, feats*2, 2, 2)
        self.dec2 = UNet._block(feats*4, feats*2)
        self.up1 = nn.ConvTranspose2d(feats*2, feats, 2, 2)
        self.dec1 = UNet._block(feats*2, feats)
        self.conv = nn.Conv2d(feats, out_channels, kernel_size=1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        b = self.bottleneck(self.pool(e4))
        d4 = self.up4(b); d4 = torch.cat([d4, e4], dim=1); d4 = self.dec4(d4)
        d3 = self.up3(d4); d3 = torch.cat([d3, e3], dim=1); d3 = self.dec3(d3)
        d2 = self.up2(d3); d2 = torch.cat([d2, e2], dim=1); d2 = self.dec2(d2)
        d1 = self.up1(d2); d1 = torch.cat([d1, e1], dim=1); d1 = self.dec1(d1)
        return self.conv(d1)

    @staticmethod
    def _block(in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

# === Load Model ===
MODEL_PATH = "best_unetplusplus2.pth"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model = UNet(in_channels=1, out_channels=3).to(DEVICE)
state = torch.load(MODEL_PATH, map_location=DEVICE)
if isinstance(state, dict) and 'state_dict' in state:
    model.load_state_dict(state['state_dict'])
else:
    model.load_state_dict(state)
model.eval()
print(f"Model loaded: {MODEL_PATH} on {DEVICE}")

# === Helper Functions ===
def window_ct_image(img, center=WINDOW_CENTER, width=WINDOW_WIDTH):
    img_min = center - width // 2
    img_max = center + width // 2
    img = np.clip(img, img_min, img_max)
    return (img - img_min) / (img_max - img_min + 1e-6)

def preprocess_ct_slice(slice_2d):
    slice_2d = np.rot90(slice_2d, k=1)
    img = cv2.resize(slice_2d, IMG_SIZE, interpolation=cv2.INTER_LINEAR)
    return np.expand_dims(img, axis=-1).astype(np.float32)

def create_overlay_image(ct_resized, pred_mask, display_size=DISPLAY_SIZE):
    ct_large = cv2.resize((ct_resized * 255).astype(np.uint8), display_size, interpolation=cv2.INTER_LINEAR)
    mask_large = cv2.resize(pred_mask.astype(np.uint8), display_size, interpolation=cv2.INTER_NEAREST)
    ct_bgr = cv2.cvtColor(ct_large, cv2.COLOR_GRAY2BGR)
    overlay = ct_bgr.copy()
    overlay[mask_large == 1] = [0, 255, 0]  # Liver
    overlay[mask_large == 2] = [0, 0, 255]  # Tumor
    blended = cv2.addWeighted(overlay, 0.6, ct_bgr, 0.4, 0)
    return cv2.cvtColor(blended, cv2.COLOR_BGR2RGB)

def image_to_webp_bytes(img_rgb):
    img_pil = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    img_pil.save(buf, format="WEBP", quality=90)
    return buf.getvalue()

def image_to_png_bytes(img_rgb):
    img_pil = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    img_pil.save(buf, format="PNG")
    return buf.getvalue()

def upload_to_imgbb(image_bytes):
    if not IMGBB_API_KEY:
        return None
    payload = {
        "key": IMGBB_API_KEY,
        "image": base64.b64encode(image_bytes).decode(),
    }
    try:
        resp = requests.post(IMGBB_UPLOAD_URL, data=payload, timeout=15)
        resp.raise_for_status()
        return resp.json().get("data", {}).get("url")
    except Exception as e:
        print(f"imgbb upload failed: {e}")
        return None

def capture_3d_views(pred_volume):
    """Capture 3D volume from different angles and return base64 images"""
    print("🧩 Creating 3D views from different angles...")
    
    # Define different camera positions for different angles
    camera_angles = [
        {"elevation": 0, "azimuth": 0, "roll": 0, "name": "front"},
        {"elevation": 45, "azimuth": 45, "roll": 0, "name": "diagonal"},
        {"elevation": 90, "azimuth": 0, "roll": 0, "name": "top"},
    ]
    
    view_images = []
    
    for i, angle in enumerate(camera_angles):
        try:
            # Create offscreen plotter
            plt = Plotter(offscreen=True, size=(800, 800))
            
            # Create volume with different colors for liver and tumor
            vol = Volume(pred_volume.astype(np.float32))
            
            # Show volume
            plt.show(vol, axes=1, bg="white", interactive=False)
            
            # Set camera position
            plt.camera.Elevation(angle["elevation"])
            plt.camera.Azimuth(angle["azimuth"])
            plt.camera.Roll(angle["roll"])
            
            # Capture screenshot to bytes
            screenshot_bytes = plt.screenshot(asarray=True, scale=1)
            
            if screenshot_bytes is not None:
                # Convert to PIL Image and then to bytes
                pil_img = Image.fromarray(screenshot_bytes)
                buf = io.BytesIO()
                pil_img.save(buf, format='PNG')
                png_bytes = buf.getvalue()
                
                # Convert to base64 for JSON response
                base64_image = f"data:image/png;base64,{base64.b64encode(png_bytes).decode()}"
                
                view_images.append({
                    "angle": angle["name"],
                    "image": base64_image
                })
            
            plt.close()
            
        except Exception as e:
            print(f"Error capturing 3D view {angle['name']}: {e}")
            # Return a placeholder if 3D capture fails
            placeholder = create_placeholder_image(f"3D View: {angle['name']}")
            png_bytes = image_to_png_bytes(placeholder)
            base64_image = f"data:image/png;base64,{base64.b64encode(png_bytes).decode()}"
            view_images.append({
                "angle": angle["name"],
                "image": base64_image
            })
    
    print(f"✅ Captured {len(view_images)} 3D views")
    return view_images

def create_placeholder_image(text):
    """Create a placeholder image when 3D rendering fails"""
    img = np.ones((400, 600, 3), dtype=np.uint8) * 255
    font = cv2.FONT_HERSHEY_SIMPLEX
    text_size = cv2.getTextSize(text, font, 1, 2)[0]
    text_x = (img.shape[1] - text_size[0]) // 2
    text_y = (img.shape[0] + text_size[1]) // 2
    cv2.putText(img, text, (text_x, text_y), font, 1, (0, 0, 0), 2)
    return img

SEVERITY_COLOR = {"MILD": "#2ECC71", "MODERATE": "#F1C40F", "SEVERE": "#E67E22", "CRITICAL": "#E74C3C"}

#  (Save to MongoDB)
@app.route('/predict', methods=['POST'])
def predict():
    patient_name = request.form.get('patient_name', '').strip()
    if not patient_name:
        return jsonify({"error": "Missing 'patient_name'"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    ext = ".nii.gz" if file.filename.lower().endswith(".nii.gz") else ".nii"
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp_path = tmp_file.name
    tmp_file.close()

    try:
        file.save(tmp_path)
        nifti_img = nib.load(tmp_path)
        ct_vol = nifti_img.get_fdata().astype(np.float32)
        voxel_spacing = np.sqrt((nifti_img.affine[:3, :3] ** 2).sum(axis=0))[:3]
        slice_thickness_mm = float(voxel_spacing[2]) if len(voxel_spacing) >= 3 else 1.0

        total_liver_voxels = 0
        total_tumor_voxels = 0
        best_slice_num = None
        max_liver_pixels = 0
        best_pred = None
        best_ct_resized = None
        pred_slices = []

        # Process all slices to create 3D volume
        for idx in range(ct_vol.shape[2]):
            raw_slice = ct_vol[:, :, idx]
            win_slice = window_ct_image(raw_slice)
            proc_slice = preprocess_ct_slice(win_slice)
            tensor = torch.from_numpy(proc_slice).permute(2,0,1).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                pred = torch.argmax(model(tensor), dim=1).squeeze(0).cpu().numpy().astype(np.uint8)
            
            pred_slices.append(pred)
            
            liver_pixels = int(np.sum(pred==1))
            tumor_pixels = int(np.sum(pred==2))
            total_liver_voxels += liver_pixels
            total_tumor_voxels += tumor_pixels

            if liver_pixels > max_liver_pixels:
                max_liver_pixels = liver_pixels
                best_slice_num = int(idx)
                best_pred = pred.copy()
                best_ct_resized = proc_slice.squeeze().copy()

        # Create 3D volume for visualization
        pred_volume = np.stack(pred_slices, axis=-1)

        liver_volume_cm3 = total_liver_voxels * slice_thickness_mm * 1.0 / 1000
        tumor_volume_cm3 = total_tumor_voxels * slice_thickness_mm * 1.0 / 1000
        tlr_percent = (tumor_volume_cm3 / liver_volume_cm3 * 100.0) if liver_volume_cm3>0 else 0.0

        if tlr_percent <= 5 and tlr_percent>0: stage,severity = "Stage I","MILD"
        elif tlr_percent <= 15: stage,severity="Stage II","MODERATE"
        elif tlr_percent <= 30: stage,severity="Stage III","SEVERE"
        else: stage,severity="Stage IV","CRITICAL"

        # Create 2D overlay image
        overlay_img = create_overlay_image(best_ct_resized, best_pred, display_size=DISPLAY_SIZE)
        webp_bytes = image_to_webp_bytes(overlay_img)
        overlay_url = upload_to_imgbb(webp_bytes) or f"data:image/webp;base64,{base64.b64encode(webp_bytes).decode()}"

        # Create 3D views
        three_d_views = capture_3d_views(pred_volume)

        report = {
            "stage": stage,
            "severity": severity,
            "liver_volume_cm3": round(liver_volume_cm3,1),
            "tumor_volume_cm3": round(tumor_volume_cm3,1),
            "tlr_percent": round(tlr_percent,2),
            "best_slice": best_slice_num if best_slice_num is not None else -1,
            "color": SEVERITY_COLOR.get(severity,"#95A5A6"),
            "timestamp": datetime.utcnow(),
            "overlay_image_url": overlay_url,
            "three_d_views": three_d_views  # Add 3D views to report
        }

        # --- Save to MongoDB ---
        results_collection.insert_one({
            "patient_name": patient_name,
            "report": report
        })

        return jsonify({
            "patient_name": patient_name, 
            "report": report,
            "message": "Analysis complete with 3D visualization"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try: 
            os.unlink(tmp_path)
        except: 
            pass

# === /results Route (Fetch from MongoDB) ===
@app.route('/results', methods=['GET'])
def results():
    docs = list(results_collection.find().sort([("report.timestamp", -1)]))
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return jsonify(docs), 200

# === Root Route ===
@app.route('/', methods=['GET'])
def greet():
    return jsonify({"message": "Liver Tumor Segmentation API with MongoDB and 3D Visualization"}), 200

# === Run App ===
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)