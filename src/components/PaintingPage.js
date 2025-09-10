// src/pages/PaintingPage.js (or wherever your PaintingPage component is located)

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import slugify from 'slugify'; // Ensure slugify is imported here
import "../styles/PaintingPage.css"; // Ensure this CSS file exists

function PaintingPage() {
  const { paintingSlug } = useParams();
  const [paintingData, setPaintingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- IMPORTANT: Use the SAME createSlug function as in Home.js ---
  // This function is designed to handle Georgian characters correctly.
  const createSlug = (text) => {
    if (!text) return '';
    return slugify(text, { // Ensure slugify is imported here as well!
      lower: true,
      strict: false,
      remove: /[*+~.()'"!:@„“”`']/g, // Expanded to include common Georgian quotes
      replacement: '-',
      trim: true,
      locale: 'ka' // Explicitly set for Georgian
    });
  };

  useEffect(() => {
    const fetchPaintingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all paintings, as we need to iterate to find the correct slug
        const response = await fetch("http://localhost:5001/files/paintings");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Find the painting that matches the current slug
        const foundPainting = data.files.find(file => {
          // Ensure that the slug generation here EXACTLY matches Home.js
          // if file.metadata.title exists, use it, otherwise fallback to filename.
          const titleSlug = file.metadata?.title
            ? createSlug(file.metadata.title)
            : '';
          const filenameSlug = file.filename
            ? "painting-" + file.filename.split('.')[0] // This fallback must also match Home.js
            : '';

          // Check if either the title slug or the filename slug matches the URL's paintingSlug
          return titleSlug === paintingSlug || filenameSlug === paintingSlug;
        });

        if (foundPainting) {
          setPaintingData(foundPainting);
        } else {
          // If no painting is found with a matching slug
          setError("Painting not found.");
        }

      } catch (err) {
        console.error("Error fetching painting data:", err);
        setError("Failed to load painting details.");
      } finally {
        setLoading(false);
      }
    };

    // Ensure slugify is imported in PaintingPage.js
    // If slugify is not imported at the top of PaintingPage.js, you'll get a "slugify is not defined" error.
    // So, make sure you have: import slugify from 'slugify'; at the top.
    if (typeof slugify === 'undefined') {
        console.error("slugify is not imported in PaintingPage.js. Please add 'import slugify from 'slugify';'");
        setError("Internal error: slugify not loaded.");
        setLoading(false);
        return; // Stop further execution if slugify is missing
    }


    fetchPaintingData();
  }, [paintingSlug]); // Re-run effect if paintingSlug changes

  // --- REMOVE THIS LOCAL createSlug FUNCTION ---
  // The correct one is now defined above and uses the imported slugify.
  // If you keep it here, it will be the one used, not the correct one.

  if (loading) {
    return <div className="painting-page-container">Loading painting details...</div>;
  }

  if (error) {
    return <div className="painting-page-container error-message">{error}</div>;
  }

  if (!paintingData) {
    // This case is usually covered by the error if not found, but good as a fallback.
    return <div className="painting-page-container">No painting data available.</div>;
  }

  // --- FIX: Ensure title and altText are handled correctly ---
  // These should already be fixed in the latest Home.js, but good to double check.
  const title = paintingData.metadata?.title;
  const altText = title || paintingData.filename; // Use title if available, otherwise filename

  return (
    <div className="painting-page-container">
      {/* Back to Home button */}
      <div className="back-button-container">
        <Link to="/" className="back-button">
          <span className="arrow">&larr;</span> საწყისი
        </Link>
      </div>

      {/* Main painting display */}
      <div className="painting-display-area">
        <img
          src={"http://localhost:5001" + paintingData.url}
          alt={altText} // Use the correctly determined altText
          className="painting-image-large"
        />

        {/* Painting Title and Description */}
        <div className="painting-details">
          {/* --- FIX: Render title if it exists --- */}
          <h1 className="painting-name">{title || paintingData.filename}</h1>
          {paintingData.metadata?.description ? (
            <p className="painting-description">{paintingData.metadata.description}</p>
          ) : (
            <p className="no-description-message">No description available for this painting.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaintingPage;