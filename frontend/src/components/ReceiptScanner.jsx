// src/components/ReceiptScanner.jsx
import React, { useState, useRef } from "react";
import { FiUploadCloud, FiX, FiCheck, FiAlertTriangle, FiCamera, FiRefreshCw } from "react-icons/fi";
import { scanReceipt } from "../services/api";

const ReceiptScanner = ({ onExtracted }) => {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | blurred | error | success
  const [message, setMessage] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file (JPG, PNG, etc.).");
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setStatus("idle");
    setMessage("");
    setExtractedData(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setStatus("scanning");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("receipt", imageFile);
      const { data } = await scanReceipt(formData);
      setStatus("success");
      setExtractedData(data.data);
      setMessage("Receipt scanned! Review and click 'Use in Form' to fill the transaction.");
    } catch (err) {
      const errData = err.response?.data;
      if (err.response?.status === 422) {
        setStatus("blurred");
        setMessage(errData?.message || "Image is unclear. Please upload a clearer photo of the receipt.");
      } else {
        setStatus("error");
        setMessage(errData?.message || "Something went wrong while scanning. Please try again.");
      }
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreview(null);
    setStatus("idle");
    setMessage("");
    setExtractedData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUseData = () => {
    if (extractedData && onExtracted) {
      onExtracted(extractedData);
    }
  };

  return (
    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FiCamera className="text-blue-600" size={18} />
        <h3 className="font-semibold text-blue-800 text-sm">Scan Receipt with AI</h3>
        {preview && (
          <button
            onClick={handleReset}
            className="ml-auto text-gray-400 hover:text-red-500 transition"
            title="Remove image"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Drop zone — shown when no image selected */}
      {!preview && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition select-none"
        >
          <FiUploadCloud size={36} className="text-blue-400 mb-2" />
          <p className="text-sm text-blue-700 font-medium">Drop receipt image here</p>
          <p className="text-xs text-gray-400 mt-1">or click to browse (JPG / PNG / WEBP)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview area */}
      {preview && (
        <div className="space-y-3">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full max-h-52 object-contain rounded-lg border border-gray-200 bg-white"
          />

          {/* IDLE — ready to scan */}
          {status === "idle" && (
            <button
              onClick={handleScan}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
            >
              Scan Receipt
            </button>
          )}

          {/* SCANNING */}
          {status === "scanning" && (
            <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm">AI is reading your receipt…</span>
            </div>
          )}

          {/* BLURRED */}
          {status === "blurred" && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-3 text-sm">
                <FiAlertTriangle className="shrink-0 mt-0.5" size={16} />
                <p>{message}</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 border border-blue-400 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-100 transition"
              >
                <FiRefreshCw size={14} /> Upload a clearer photo
              </button>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <FiAlertTriangle className="shrink-0 mt-0.5" size={16} />
                <p>{message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleScan}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
                >
                  Try again
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 border border-red-300 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && extractedData && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
                <FiCheck className="shrink-0 mt-0.5" size={16} />
                <p className="font-medium">{message}</p>
              </div>

              {/* Extracted data preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm space-y-1.5">
                <Row label="Title" value={extractedData.title} />
                <Row label="Amount" value={`₹${extractedData.amount}`} valueClass="text-green-700 font-semibold" />
                <Row label="Type" value={extractedData.type} valueClass="capitalize" />
                <Row label="Category" value={extractedData.suggestedCategoryName} />
                <Row label="Date" value={extractedData.date} />
                {extractedData.note && <Row label="Note" value={extractedData.note} />}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUseData}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                >
                  Use in Form
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 border border-gray-300 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
                >
                  Scan another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, valueClass = "" }) => (
  <p className="flex justify-between gap-2">
    <span className="text-gray-400 shrink-0">{label}</span>
    <span className={`text-gray-800 text-right ${valueClass}`}>{value}</span>
  </p>
);

export default ReceiptScanner;
