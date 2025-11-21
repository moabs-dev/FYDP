import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Results() {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [show3DModal, setShow3DModal] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:5000/results");
        setResults(res.data);
        setFilteredResults(res.data); // Initially show all results
      } catch (err) {
        console.error(err);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Filter results whenever searchQuery changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResults(results);
    } else {
      const filtered = results.filter((patient) =>
        patient.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [searchQuery, results]);

  const totalPatients = filteredResults.length;
  const totalTumorVolume = filteredResults.reduce(
    (sum, p) => sum + (p.report.tumor_volume_cm3 || 0),
    0
  );
  const totalLiverVolume = filteredResults.reduce(
    (sum, p) => sum + (p.report.liver_volume_cm3 || 0),
    0
  );

  const view3DImages = (patient) => {
    setSelectedPatient(patient);
    setShow3DModal(true);
  };
const generatePDF = async (patient) => {
  let overlayBase64 = "";
  let threeDViewsBase64 = [];

  // Load images (same as before)
  if (patient.report.overlay_image_url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = patient.report.overlay_image_url;
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const maxWidth = 400;
        let scale = 1;
        if (img.width > maxWidth) scale = maxWidth / img.width;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        overlayBase64 = canvas.toDataURL("image/png");
        resolve();
      };
      img.onerror = () => reject("Failed to load overlay image");
    });
  }

  if (patient.report.three_d_views && patient.report.three_d_views.length > 0) {
    for (const view of patient.report.three_d_views) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = view.image;
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const maxWidth = 200;
          let scale = 1;
          if (img.width > maxWidth) scale = maxWidth / img.width;
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          threeDViewsBase64.push({
            angle: view.angle,
            image: canvas.toDataURL("image/png")
          });
          resolve();
        };
        img.onerror = () => resolve();
      });
    }
  }

  // Create separate HTML sections for better page control
  const headerSection = `
    <div style="width: 780px; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #fdfdfd;">
      <div style="text-align: center; border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; color: #1e3a8a;">AI Hospital</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Liver Tumor Analysis Report</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px; background-color: #f3f4f6; padding: 20px; border-radius: 15px; border: 1px solid #d1d5db;">
        <h2 style="color: #1e40af; margin-bottom: 15px;">Patient Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; font-weight: bold; width: 25%;">Name:</td>
            <td style="padding: 10px; width: 25%;">${patient.patient_name}</td>
            <td style="padding: 10px; font-weight: bold; width: 25%;">Stage:</td>
            <td style="padding: 10px; width: 25%; color: ${patient.report.color};">${patient.report.stage}</td>
          </tr>
          <tr style="background-color: #e5e7eb;">
            <td style="padding: 10px; font-weight: bold;">Severity:</td>
            <td style="padding: 10px;">${patient.report.severity}</td>
            <td style="padding: 10px; font-weight: bold;">T/L Ratio:</td>
            <td style="padding: 10px;">${patient.report.tlr_percent}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Liver Volume:</td>
            <td style="padding: 10px;">${patient.report.liver_volume_cm3} cm³</td>
            <td style="padding: 10px; font-weight: bold;">Tumor Volume:</td>
            <td style="padding: 10px;">${patient.report.tumor_volume_cm3} cm³</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const overlaySection = overlayBase64 ? `
    <div style="width: 780px; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #fdfdfd;">
      <div style="margin-top: 10px; margin-bottom: 15px; padding: 12px; border-radius: 10px; border: 1px solid #d1d5db; background-color: #f3f4f6; text-align: center;">
        <h2 style="color: #1e40af; margin-bottom: 15px;">2D Segmentation Overlay</h2>
        <img src="${overlayBase64}" style="display: block; margin: 0 auto; width: 400px; max-width: 100%; height: auto; border-radius: 12px; border: 2px solid #cbd5e1;" />
        <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
          <span style="color: #00ff00;">■</span> Liver &nbsp;
          <span style="color: #ff0000ff;">■</span> Tumor
        </div>
      </div>
    </div>
  ` : '';

  const threeDSection = threeDViewsBase64.length > 0 ? `
    <div style="width: 780px; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #fdfdfd;">
      <div style="margin-bottom: 25px; padding: 15px; border-radius: 15px; border: 1px solid #d1d5db; background-color: #f3f4f6;">
        <h2 style="color: #1e40af; margin-bottom: 15px; text-align: center;">3D Visualization</h2>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
          ${threeDViewsBase64.map(view => `
            <div style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 8px; text-transform: capitalize; color: #374151;">${view.angle} View</div>
              <img src="${view.image}" style="width: 200px; height: auto; border-radius: 8px; border: 2px solid #cbd5e1;" />
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  ` : '';

  const footerSection = `
    <div style="width: 780px; font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #fdfdfd;">
      <div style="display: flex; justify-content: space-between; color: #6b7280; font-size: 13px; margin-top: 35px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <div>Report Generated: ${new Date().toLocaleDateString()}</div>
        <div>Doctor's Signature: ____________________</div>
      </div>
    </div>
  `;

  const pdf = new jsPDF("p", "mm", "a4");

  // Combine header and overlay into one section for first page
  const firstPageContent = `
    ${headerSection}
    ${overlaySection}
  `;

  // Combine 3D views and footer into one section for second page
  const secondPageContent = `
    ${threeDSection}
    ${footerSection}
  `;

  // Create pages array - first page has header + overlay, second page has 3D views + footer
  const pages = [firstPageContent, secondPageContent];

  for (let i = 0; i < pages.length; i++) {
    if (pages[i].trim()) {
      const container = document.createElement("div");
      container.innerHTML = pages[i];
      container.style.position = "fixed";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      document.body.removeChild(container);

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add new page if not the first page
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }
  }

  pdf.save(`${patient.patient_name}_liver_report.pdf`);
};

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-100 to-blue-300">
      {/* 3D Views Modal */}
      {show3DModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-700">
                  3D Visualization - {selectedPatient.patient_name}
                </h3>
                <button
                  onClick={() => setShow3DModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {selectedPatient.report.three_d_views && selectedPatient.report.three_d_views.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedPatient.report.three_d_views.map((view, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3 capitalize text-blue-600">
                          {view.angle} View
                        </h4>
                        <img
                          src={view.image}
                          alt={`3D ${view.angle} view`}
                          className="w-full h-48 object-contain rounded-md border-2 border-blue-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No 3D views available for this patient.</p>
                </div>
              )}
              
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShow3DModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-blue-200 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-3xl font-bold text-blue-700">Patient Results</h2>
          <p className="text-blue-600 mt-1">Overview of all submitted CT scans</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-800">{totalPatients}</p>
            <p className="text-blue-600">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-800">{totalLiverVolume.toFixed(2)}</p>
            <p className="text-blue-600">Total Liver Volume</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-800">{totalTumorVolume.toFixed(2)}</p>
            <p className="text-blue-600">Total Tumor Volume</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/3 p-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p className="text-blue-700 font-medium">Loading...</p>}
      {error && <p className="text-red-600 font-medium">{error}</p>}

      {!loading && !error && filteredResults.length > 0 && (
        <div className="overflow-x-auto bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-blue-200">
          <table className="min-w-full table-auto">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Liver Volume (cm³)</th>
                <th className="px-4 py-3">Tumor Volume (cm³)</th>
                <th className="px-4 py-3">T/L Ratio (%)</th>
                <th className="px-4 py-3">2D Image</th>
                <th className="px-4 py-3">3D Views</th>
                <th className="px-4 py-3">Download Report</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((patient, index) => (
                <tr
                  key={index}
                  className={`text-center ${index % 2 === 0 ? "bg-white/50" : "bg-blue-50"}`}
                >
                  <td className="px-4 py-2 font-medium">{patient.patient_name}</td>
                  <td className="px-4 py-2 font-semibold" style={{ color: patient.report.color }}>
                    {patient.report.stage}
                  </td>
                  <td className="px-4 py-2">{patient.report.severity}</td>
                  <td className="px-4 py-2">{patient.report.liver_volume_cm3}</td>
                  <td className="px-4 py-2">{patient.report.tumor_volume_cm3}</td>
                  <td className="px-4 py-2">{patient.report.tlr_percent}</td>
                  <td className="px-4 py-2">
                    {patient.report.overlay_image_url ? (
                      <img
                        src={patient.report.overlay_image_url}
                        alt="Overlay"
                        className="w-16 h-16 object-cover rounded-md mx-auto border border-blue-300"
                      />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {patient.report.three_d_views && patient.report.three_d_views.length > 0 ? (
                      <button
                        onClick={() => view3DImages(patient)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 text-sm"
                      >
                        View 3D ({patient.report.three_d_views.length})
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">No 3D</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => generatePDF(patient)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-200"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filteredResults.length === 0 && (
        <p className="text-blue-700 font-medium">No results match your search.</p>
      )}
    </div>
  );
}

export default Results;