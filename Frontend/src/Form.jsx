import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axios from "axios";

gsap.registerPlugin(ScrollTrigger);

function Form() {
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const buttonRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 80, scale: 0.9, rotateY: 15 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateY: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: formRef.current,
          start: "top 85%",
          end: "top 50%",
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      inputRef.current,
      { opacity: 0, x: -80 },
      { opacity: 1, x: 0, duration: 1, ease: "power2.out", delay: 0.3 }
    );

    gsap.fromTo(
      fileRef.current,
      { opacity: 0, x: 80 },
      { opacity: 1, x: 0, duration: 1, ease: "power2.out", delay: 0.5 }
    );

    gsap.to(buttonRef.current, {
      boxShadow: "0 0 20px rgba(0, 200, 255, 0.6)",
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      duration: 1,
    });
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validExtensions = [".dcm", ".ima", ".nii", ".nii.gz"];
    const isValid = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      setFile(null);
      setFileName("");
      setError("Please upload a valid CT scan file (.dcm, .ima, .nii, .nii.gz).");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputRef.current.value.trim()) {
      setError("Patient name is required.");
      return;
    }
    if (!file) {
      setError("Please select a CT scan file.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);
    setResult(null);

    // Start a "fake" progress incrementer
    let fakeProgress = 0;
    const fakeInterval = setInterval(() => {
      fakeProgress += Math.random() * 5; // increment randomly 1–5%
      if (fakeProgress > 95) fakeProgress = 95; // never reach 100% until response
      setProgress(Math.floor(fakeProgress));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("patient_name", inputRef.current.value.trim());
      formData.append("file", file);

      const res = await axios.post("http://localhost:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(fakeInterval);
      setProgress(100); // complete progress
      setResult(res.data);
      setShowModal(true);
    } catch (err) {
      clearInterval(fakeInterval);
      setProgress(0);
      console.error(err);
      setError(err.response?.data?.error || "Prediction failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500); // reset progress bar after short delay
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-100 to-blue-300">
      <div
        ref={formRef}
        className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl w-80 text-center border border-blue-200"
      >
        <h2 className="text-2xl font-bold mb-4 tracking-wide text-blue-700 drop-shadow-sm">
          CT Scan Submission
        </h2>

        <input
          ref={inputRef}
          type="text"
          placeholder="Patient name"
          className="w-full p-3 mb-3 text-blue-900 bg-white/40 border-b-2 border-blue-300 rounded-md focus:border-blue-500 focus:outline-none transition duration-300 placeholder-blue-200"
        />

        <label
          ref={fileRef}
          className="block bg-white/40 p-3 rounded-lg cursor-pointer hover:bg-white/50 transition duration-300 border border-blue-300 shadow-sm mb-2"
        >
          Upload CT Scan
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        {fileName && <p className="text-sm mt-1 text-green-600 font-medium">{fileName}</p>}
        {error && <p className="text-sm mt-1 text-red-600 font-medium">{error}</p>}

        {loading && (
          <div className="w-full bg-gray-300 h-3 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <button
          ref={buttonRef}
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full font-semibold tracking-wide hover:bg-blue-600 transition duration-300 shadow-md"
        >
          {loading ? `Processing ${progress}%` : "Submit"}
        </button>
      </div>

      {/* Small Modal */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-80 relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-lg font-bold"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-2">{result.patient_name}</h3>
            <p>
              <strong>Stage:</strong>{" "}
              <span style={{ color: result.report.color }}>{result.report.stage}</span>
            </p>
            <p>
              <strong>Severity:</strong> {result.report.severity}
            </p>
            <p>
              <strong>Liver Volume:</strong> {result.report.liver_volume_cm3} cm³
            </p>
            <p>
              <strong>Tumor Volume:</strong> {result.report.tumor_volume_cm3} cm³
            </p>
            <p>
              <strong>Tumor/Liver Ratio:</strong> {result.report.tlr_percent} %
            </p>
            <p>
              <strong>Best Slice:</strong> {result.report.best_slice}
            </p>
            {result.report.overlay_image_url && (
              <img
                src={result.report.overlay_image_url}
                alt="Overlay"
                className="mt-2 rounded-md w-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Form;
