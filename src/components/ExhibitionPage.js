// src/components/ExhibitionPage.js (or src/pages/ExhibitionPage.js)

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/ExhibitionPage.css"; // Create this CSS file for styling

function ExhibitionPage() {
  const { exhibitionSlug } = useParams(); 
  const [exhibitionData, setExhibitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExhibitionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all exhibitions
        const response = await fetch("http://localhost:5001/files/exhibitions");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Find the exhibition by slug (using title or filename)
        const foundExhibition = data.files.find(file => {
          const titleSlug = file.metadata?.title ? createSlug(file.metadata.title) : '';
          const filenameSlug = file.filename ? "exhibition-" + file.filename.split('.')[0] : '';
          return titleSlug === exhibitionSlug || filenameSlug === exhibitionSlug;
        });

        if (foundExhibition) {
          setExhibitionData(foundExhibition);
        } else {
          setError("Exhibition not found.");
        }
        
      } catch (err) {
        console.error("Error fetching exhibition data:", err);
        setError("Failed to load exhibition details.");
      } finally {
        setLoading(false);
      }
    };

    // Helper function to create slugs (reuse from Home.js or define here)
    const createSlug = (text) => {
      if (!text) return '';
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    fetchExhibitionData();
  }, [exhibitionSlug]);

  if (loading) {
    return <div className="exhibition-page-container">Loading exhibition details...</div>;
  }

  if (error) {
    return <div className="exhibition-page-container error-message">{error}</div>;
  }

  if (!exhibitionData) {
    return <div className="exhibition-page-container">No exhibition data available.</div>;
  }

  return (
    <div className="exhibition-page-container">
      {/* Back to Home button */}
      <div className="back-button-container">
        <Link to="/" className="back-button">
          <span className="arrow">&larr;</span> საწყისი 
        </Link>
      </div>

      <div className="exhibition-content">
        <img
          src={"http://localhost:5001" + exhibitionData.url}
          alt={exhibitionData.metadata?.title || exhibitionData.filename}
          className="exhibition-image-large" // Use a distinct class name
        />
        <div className="exhibition-info-text">
          <h1 className="exhibition-name">{exhibitionData.metadata?.title || exhibitionData.filename}</h1>
          {exhibitionData.metadata?.description ? (
            <p className="exhibition-description">{exhibitionData.metadata.description}</p>
          ) : (
            <p className="no-description-message">No details available for this exhibition.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExhibitionPage;