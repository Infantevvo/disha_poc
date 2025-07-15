import React, { useState } from "react";
import axios from "axios";

function App() {
  const [zipFile, setZipFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) return alert("Choose a file first");

    const formData = new FormData();
    formData.append("zipfile", zipFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // console.log("📥 Response from backend:");
      // console.log(response.data); // ✅ Your Excel data will appear here in browser console

      // // Optional: log only Excel data
      // response.data.files.forEach((file) => {
      //   console.log(`🗂️ File: ${file.filename}`);
      //   console.table(file.data); // shows table in console
      // });
    } catch (error) {
      console.error("❌ Upload failed:", error);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Upload ZIP with Excel</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setZipFile(e.target.files[0])}
        />
        <br /><br />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default App;
