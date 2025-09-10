import React, { useState, useEffect } from "react";
import "../styles/Admin.css";

function Admin() {
  const [file, setFile] = useState(null);
  const [section, setSection] = useState("authors");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [stats, setStats] = useState({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Clear previous message when new file is selected
    setMessage("");
    
    // Show file info
    if (selectedFile) {
      setMessage(`Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    // Clear form fields when section changes
    setTitle("");
    setDescription("");
  };

  const getFieldLabel = () => {
    switch (section) {
      case "authors":
        return { title: "Author Name", description: "Biography/Details" };
      case "paintings":
        return { title: "Painting Title", description: "Description/Story" };
      case "exhibitions":
        return { title: "Exhibition Name", description: "Details/Information" };
      default:
        return { title: "Title", description: "Description" };
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Please select a file first!");
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setMessage("❌ Please select an image file!");
      return;
    }

    // Basic validation for title (optional but recommended)
    if (!title.trim()) {
      const confirm = window.confirm(
        `You haven't entered a ${getFieldLabel().title.toLowerCase()}. Upload anyway?`
      );
      if (!confirm) return;
    }

    setIsUploading(true);
    setMessage("⏳ Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section", section);
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    try {
      const res = await fetch("http://localhost:5001/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Upload successful! File saved to ${section} section.`);
        setFile(null);
        setTitle("");
        setDescription("");
        // Clear the file input
        document.querySelector('input[type="file"]').value = '';
        // Refresh the file list and stats
        loadFiles();
        loadStats();
      } else {
        setMessage(`❌ Upload failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed: Network error. Make sure your backend is running!");
    } finally {
      setIsUploading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const res = await fetch(`http://localhost:5001/files/${section}`);
      const data = await res.json();
      setUploadedFiles(data.files || []);
    } catch (err) {
      console.error("Error loading files:", err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("http://localhost:5001/stats");
      const data = await res.json();
      setStats(data.stats || {});
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const deleteFile = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await fetch("http://localhost:5001/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, section }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ ${filename} deleted successfully!`);
        loadFiles();
        loadStats();
      } else {
        setMessage(`❌ Delete failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("❌ Delete failed: Network error");
    }
  };

  // Load files when section changes
  useEffect(() => {
    loadFiles();
  }, [section]);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const fieldLabels = getFieldLabel();

  return (
    <div className="admin-body">
      <h2 className="admin-title">📁 File Upload Admin</h2>
      
      {/* Stats */}
      <div className="admin-stats">
        <h3 className="stats-title">📊 Upload Statistics:</h3>
        {Object.keys(stats).length > 0 ? (
          <div className="stats-container">
            {Object.entries(stats).map(([section, count]) => (
              <div key={section} className="stat-item">
                <strong>{section}:</strong> {count} files
              </div>
            ))}
          </div>
        ) : (
          <p className="no-stats">No files uploaded yet</p>
        )}
      </div>

      {/* Upload Form */}
      <div className="upload-form">
        <h3 className="upload-title">📤 Upload New File</h3>
        
        <div className="form-group">
          <label className="form-label">Section: </label>
          <select 
            value={section} 
            onChange={handleSectionChange}
            disabled={isUploading}
            className="section-select"
          >
            <option value="authors">👤 Authors</option>
            <option value="paintings">🎨 Paintings</option>
            <option value="exhibitions">🏛️ Exhibitions</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{fieldLabels.title}: </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            className="text-input"
            placeholder={`Enter ${fieldLabels.title.toLowerCase()}`}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{fieldLabels.description}: </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            className="textarea-input"
            placeholder={`Enter ${fieldLabels.description.toLowerCase()}`}
            rows={3}
            maxLength={10000}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Select Image: </label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange} 
            disabled={isUploading}
            className="file-input"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={isUploading || !file}
          className={`upload-btn ${isUploading ? 'uploading' : ''} ${!file ? 'disabled' : ''}`}
        >
          {isUploading ? '⏳ Uploading...' : '📤 Upload'}
        </button>

        {message && (
          <p className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>

      {/* File List */}
      <div className="file-list-section">
        <h3 className="file-list-title">📋 Files in {section} section ({uploadedFiles.length})</h3>
        {uploadedFiles.length > 0 ? (
          <div className="file-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-card">
                <img 
                  src={`http://localhost:5001${file.url}`}
                  alt={file.metadata?.title || file.filename}
                  className="file-thumbnail"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                
                <div className="file-info">
                  {file.metadata?.title && (
                    <h4 className="file-title">{file.metadata.title}</h4>
                  )}
                  
                  <p className="file-name">{file.filename}</p>
                  
                  {file.metadata?.description && (
                    <p className="file-description">
    {file.metadata.description.length > 100 
      ? `${file.metadata.description.substring(0, 100)}...` 
      : file.metadata.description
    }
  </p>
                  )}
                </div>
                
                <button 
                  onClick={() => deleteFile(file.filename)}
                  className="delete-btn"
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-files">No files in this section yet.</p>
        )}
      </div>
    </div>
  );
}

export default Admin;