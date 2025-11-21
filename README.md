# 🏥 Liver Tumor Analysis System

A full-stack web application for automated liver tumor detection and 3D visualization using deep learning.

## ✨ Features

- *AI-Powered Segmentation*: U-Net model for precise liver and tumor detection
- *3D Visualization*: Interactive 3D views from multiple angles
- *Automated Staging*: BCLC-based disease staging (Stage I-IV)
- *Volume Analysis*: Accurate liver and tumor volume calculations
- *PDF Reports*: Professional clinical report generation
- *Modern Dashboard*: Responsive React interface with real-time updates

## 📁 Project Structure


liver-tumor-analysis/
├── 📁 Model/
│   ├── model.ipynb            #Main file where we trained model
│   ├── best_unetplusplus2.pth    # Pre-trained U-Net model
├── 📁 backend/
│   ├── app.py                    # Main Flask application
│   ├── best_unetplusplus2.pth    # Pre-trained U-Net model
│   ├── requirements.txt          # Python dependencies
│   ├── profile                   # Deployment configuration
│   ├── vercel.json              # Vercel deployment config
│   ├── tiny_prediction.png      # Sample output image
│   ├── package.json             # Node.js dependencies
│   ├── package-lock.json        # Lock file for Node.js
│   ├── .env                     # Environment variables
│   ├── 📁 uploads/              # Temporary file storage
│   └── 📁 node_modules/         # Node.js packages
│
└── 📁 frontend/
    ├── 📁 src/
    │   ├── App.jsx              # Main React component
    │   ├── main.jsx             # React entry point
    │   ├── Home.jsx             # Landing page
    │   ├── Form.jsx             # CT scan upload form
    │   ├── Results.jsx          # Results dashboard
    │   ├── Hero.jsx             # Hero section
    │   ├── Navbar.jsx           # Navigation component
    │   ├── Benefits.jsx         # Features section
    │   ├── Steps.jsx            # How it works
    │   ├── Footer.jsx           # Footer component
    │   ├── Notfound.jsx         # 404 page
    │   ├── App.css              # Application styles
    │   ├── index.css            # Global styles
    │   └── 📁 assets/           # Static assets
    │       ├── an.json          # Animation data
    │       └── notfound.json    # 404 animation data
    ├── index.html               # HTML template
    ├── package.json             # Frontend dependencies
    ├── package-lock.json        # Lock file
    ├── vite.config.js           # Vite configuration
    ├── eslint.config.js         # ESLint configuration
    ├── .gitignore               # Git ignore rules
    └── 📁 node_modules/         # Node.js packages
├── 📁 3d_views/
│   It contain 3 axial views of a single prediction(these are just examples)

├── overlay.webp
|   It shows predicted mask overlayed on given ct's best slice

├── README.md

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB

### Installation

1. *Backend Setup*
bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt


2. *Frontend Setup*
bash
cd frontend
npm install


3. *Environment Configuration*
Create .env file in backend:
env
DB=mongodb://localhost:27017/liver_segmentation_db


### Running the Application

1. *Start Backend*
bash
cd backend
python app.py
# Server runs on http://localhost:5000


2. *Start Frontend*
bash
cd frontend
npm run dev
# App runs on http://localhost:3000


## 📖 Usage

1. *Upload CT Scan*: Submit patient name and NIfTI file (.nii/.nii.gz)
2. *Wait for Processing*: AI analysis takes 2-3 minutes
3. *View Results*: See 2D overlays, 3D visualizations, and clinical metrics
4. *Generate Reports*: Download comprehensive PDF reports
5. *Manage Records*: Access all patient analyses in the dashboard

## 🛠 API Endpoints

- POST /predict - Analyze CT scan
- GET /results - Retrieve all analyses
- GET / - Health check

## 🏗 System Architecture


React Frontend (Vite) ↔ Flask Backend (U-Net AI) ↔ MongoDB
         ↓
    External CDN (Images)


## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check documentation in project files

## 📄 License

MIT License - see LICENSE file for details.

---

*Note*: For research and educational use. Always consult healthcare professionals for medical decisions.