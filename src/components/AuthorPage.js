// src/pages/AuthorPage.js (or src/components/AuthorPage.js)
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import slugify from 'slugify'; // Add this import
import "../styles/AuthorPage.css";

function AuthorPage() {
  const { authorSlug } = useParams();
  const [authorData, setAuthorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the same createSlug function as in Home.js
  const createSlug = (text) => {
    if (!text) return '';
    return slugify(text, {
      lower: true,
      strict: false,
      remove: /[*+~.()'"!:@]/g,
      replacement: '-',
      trim: true
    });
  };

  // Function to format text with preserved line breaks and bullet points
  const formatDescription = (text) => {
    if (!text) return null;
    
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      // Check if this paragraph contains bullet points
      const lines = trimmedParagraph.split('\n');
      const isBulletList = lines.some(line => 
        /^\s*[-*•]\s/.test(line) || /^\s*\d+\.\s/.test(line)
      );
      
      if (isBulletList) {
        // Handle bullet points
        const listItems = lines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Check for different bullet formats
          if (/^[-*•]\s/.test(trimmedLine)) {
            // Regular bullet points (-, *, •)
            return (
              <li key={lineIndex} className="bullet-item">
                {trimmedLine.replace(/^[-*•]\s/, '')}
              </li>
            );
          } else if (/^\d+\.\s/.test(trimmedLine)) {
            // Numbered list (1., 2., etc.)
            return (
              <li key={lineIndex} className="numbered-item">
                {trimmedLine.replace(/^\d+\.\s/, '')}
              </li>
            );
          } else if (trimmedLine) {
            // Regular line in a list context
            return (
              <li key={lineIndex} className="text-item" style={{listStyle: 'none'}}>
                {trimmedLine}
              </li>
            );
          }
          return null;
        }).filter(item => item !== null);
        
        // Determine if it's mostly numbered or bullet points
        const hasNumbered = lines.some(line => /^\s*\d+\.\s/.test(line));
        
        return hasNumbered ? (
          <ol key={index} className="description-list numbered-list">
            {listItems}
          </ol>
        ) : (
          <ul key={index} className="description-list bullet-list">
            {listItems}
          </ul>
        );
      } else {
        // Handle regular paragraphs with line breaks
        const formattedParagraph = lines.map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ));
        
        return (
          <p key={index} className="description-paragraph">
            {formattedParagraph}
          </p>
        );
      }
    });
  };

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://localhost:5001/files/authors");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Use the same slug generation logic as Home.js
        const foundAuthor = data.files.find(file =>
          file.metadata?.title && createSlug(file.metadata.title) === authorSlug
        );
        
        if (foundAuthor) {
          setAuthorData(foundAuthor);
        } else {
          setError("Author not found.");
        }
      } catch (err) {
        console.error("Error fetching author data:", err);
        setError("Failed to load author details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorSlug]);

  if (loading) {
    return <div className="author-page-container">Loading author details...</div>;
  }

  if (error) {
    return <div className="author-page-container error-message">{error}</div>;
  }

  if (!authorData) {
    return <div className="author-page-container">No author data available.</div>;
  }

  return (
    <div className="author-page-container">
      {/* Back to Home button */}
      <div className="back-button-container">
        <Link to="/" className="back-button">
          <span className="arrow">&larr;</span> საწყისი
        </Link>
      </div>

      {/* Author details */}
      <div className="author-details">
        <div className="author-image-container">
          <img
            src={`http://localhost:5001${authorData.url}`}
            alt={authorData.metadata?.title || 'Author'}
            className="author-detail-image"
            onError={(e) => {
              console.warn("Could not load image: " + authorData.url);
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="author-info">
          {authorData.metadata?.title && (
            <h1 className="author-title">{authorData.metadata.title}</h1>
          )}

          {authorData.metadata?.description && (
            <div className="author-description">
              {formatDescription(authorData.metadata.description)}
            </div>
          )}

          {!authorData.metadata?.title && (
            <h1 className="author-title">{authorData.filename}</h1>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthorPage;