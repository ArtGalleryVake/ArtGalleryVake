import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import "../styles/Home.css";
import Landing from "./Landing"; // Import Landing component
import { Search } from 'lucide-react';
import slugify from 'slugify';

function Home() {
  const [authors, setAuthors] = useState([]);
  const [paintings, setPaintings] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loadingError, setLoadingError] = useState(false);

  // State for visible items per section
  const [visibleAuthors, setVisibleAuthors] = useState(4);
  const [visiblePaintings, setVisiblePaintings] = useState(4);
  const [visibleExhibitions, setVisibleExhibitions] = useState(4);

  // State for the search input
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSectionFiles = async (section, setter) => {
    try {
      const response = await fetch("http://localhost:5001/files/" + section);
      if (!response.ok) {
        console.error("HTTP error fetching " + section + ":", response.status, response.statusText);
        setLoadingError(true);
        setter([]);
        return;
      }
      const data = await response.json();
      setter(data.files || []);
    } catch (err) {
      console.error("Network or parsing error fetching " + section + ":", err);
      setLoadingError(true);
      setter([]);
    }
  };

  useEffect(() => {
    fetchSectionFiles("authors", setAuthors);
    fetchSectionFiles("paintings", setPaintings);
    fetchSectionFiles("exhibitions", setExhibitions);
  }, []);

  // This is the robust slug function we established earlier for Georgian text.
  // We will use this for all sections.
  const createSlug = (text) => {
    if (!text) return '';
    return slugify(text, {
      lower: true,
      strict: false,
      remove: /[*+~.()'"!:@„“”`']/g, // Expanded to include common Georgian quotes
      replacement: '-',
      trim: true,
      locale: 'ka' // Explicitly set for Georgian
    });
  };

  // Filtered data based on search query
  const filteredAuthors = authors.filter(author =>
    author.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- MODIFIED: Search paintings by title, description, or filename ---
  const filteredPaintings = paintings.filter(painting =>
    (painting.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     painting.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) || // Added description search
     painting.filename.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- APPLYING SEARCH FILTER TO EXHIBITIONS ---
  const filteredExhibitions = exhibitions.filter(exhibition =>
    exhibition.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exhibition.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFileCard = (file, index, altPrefix) => {
    const authorSlug = file.metadata?.title
      ? createSlug(file.metadata.title)
      : "author-" + (file.filename || index);

    const paintingSlug = file.metadata?.title
      ? createSlug(file.metadata.title)
      : "painting-" + (file.filename ? file.filename.split('.')[0] : index);

    // --- APPLYING THE ROBUST CREATE SLUG FOR EXHIBITIONS ---
    const exhibitionSlug = file.metadata?.title
      ? createSlug(file.metadata.title)
      : "exhibition-" + (file.filename ? file.filename.split('.')[0] : index);

    const isAuthor = altPrefix === "Author";
    const isPainting = altPrefix === "Painting";
    const isExhibition = altPrefix === "Exhibition";

    const imageUrl = "http://localhost:5001" + file.url;
    const title = file.metadata?.title;
    const altText = title || `${altPrefix} ${index + 1}`;
    const description = file.metadata?.description;

    const getCardClassName = () => {
      if (isAuthor) return "image-card-authors";
      if (isPainting) return "image-card-paintings";
      if (isExhibition) return "image-card-exhibitions";
      return "image-card"; // fallback for any other type
    };

    return (
      <div key={file.filename || index} className={getCardClassName()}>
        {/* --- Author Logic: Image with Text Below, Clickable to AuthorPage --- */}
        {isAuthor ? (
          <Link to={"/authors/" + authorSlug} className="link-wrapper">
            <div className="author-card">
              <img
                src={imageUrl}
                alt={altText}
                className="author-image"
                onError={(e) => {
                  console.warn("Could not load image: " + file.url);
                  e.target.style.display = 'none';
                }}
              />
              {title && (
                <h3 className="author-name">{title}</h3>
              )}
            </div>
          </Link>
        ) : (
          // --- Painting/Exhibition Logic: Image, then Info Below ---
          <>
            <div className="painting-image-container">
              {isPainting ? (
                <Link to={"/paintings/" + paintingSlug} className="link-wrapper">
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="painting-image-display"
                    onError={(e) => {
                      console.warn("Could not load image: " + file.url);
                      e.target.style.display = 'none';
                    }}
                  />
                </Link>
              ) : isExhibition ? (
                <Link to={"/exhibitions/" + exhibitionSlug} className="link-wrapper">
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="image-display"
                    onError={(e) => {
                      console.warn("Could not load image: " + file.url);
                      e.target.style.display = 'none';
                    }}
                  />
                </Link>
              ) : (
                <img
                  src={imageUrl}
                  alt={altText}
                  className="image-display"
                  onError={(e) => {
                    console.warn("Could not load image: " + file.url);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="image-info">
              {title && (
                <h3 className="image-title">{title}</h3>
              )}
              {description && (
                <p className="image-description">{description.substring(0, 100)}{description.length > 100 ? '...' : ''}</p>
              )}
              {!title && (
                <p className="image-filename">{file.filename}</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Function to render items for a section, applying slicing and renderFileCard
  const renderSectionItems = (items, visibleCount, sectionType) => {
    return (
      <>
        {items.slice(0, visibleCount).map((file, index) =>
          renderFileCard(file, index, sectionType)
        )}
      </>
    );
  };

  // Function to handle "Show More" clicks
  const handleLoadMore = (section) => {
    switch (section) {
      case "authors":
        setVisibleAuthors(prevVisible => prevVisible + 4);
        break;
      case "paintings":
        setVisiblePaintings(prevVisible => prevVisible + 4);
        break;
      case "exhibitions":
        setVisibleExhibitions(prevVisible => prevVisible + 4);
        break;
      default:
        break;
    }
  };

  // Function to handle "Show Less" clicks
  const handleShowLess = (section) => {
    switch (section) {
      case "authors":
        setVisibleAuthors(4); // Reset to initial view
        break;
      case "paintings":
        setVisiblePaintings(4); // Reset to initial view
        break;
      case "exhibitions":
        setVisibleExhibitions(4); // Reset to initial view
        break;
      default:
        break;
    }
  };

  // Determine if "Show More" button should be visible
  const showMoreAuthorsButton = filteredAuthors.length > visibleAuthors;
  const showMorePaintingsButton = filteredPaintings.length > visiblePaintings;
  const showMoreExhibitionsButton = filteredExhibitions.length > visibleExhibitions;

  // Determine if "Show Less" button should be visible
  const showLessAuthorsButton = visibleAuthors > 4;
  const showLessPaintingsButton = visiblePaintings > 4;
  const showLessExhibitionsButton = visibleExhibitions > 4;

  return (
    <div className="home-body">
      {/* Search Bar */}
      <Landing />
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} color="#333" />
          <input
            type="text"
            placeholder="მოძებნე ავტორი ან ნამუშევარი..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Authors Section */}
      <section className="author-content-section">
        <h1 className="author-section-title">ავტორები</h1>
        <div className="author-images-section">
          {renderSectionItems(filteredAuthors, visibleAuthors, "Author")}
          {filteredAuthors.length === 0 && !loadingError && searchQuery && (
            <p className="no-content-message">No authors found matching "{searchQuery}".</p>
          )}
          {authors.length === 0 && !loadingError && !searchQuery && (
            <p className="no-content-message">No author images available yet.</p>
          )}
        </div>
        {/* Buttons for Authors */}
        <div className="button-group-container">
          <div className="button-group">
            {showMoreAuthorsButton && (
              <button onClick={() => handleLoadMore("authors")} className="load-more-btn">
                Show More Authors
              </button>
            )}
            {showLessAuthorsButton && (
              <button onClick={() => handleShowLess("authors")} className="show-less-btn">
                Show Less
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Paintings Section */}
      <section className="painting-content-section">
        <h1 className="painting-section-title">ნამუშევრები</h1>
        <div className="painting-images-section">
          {renderSectionItems(filteredPaintings, visiblePaintings, "Painting")}
          {filteredPaintings.length === 0 && !loadingError && searchQuery && (
            <p className="no-content-message">No paintings found matching "{searchQuery}".</p>
          )}
          {paintings.length === 0 && !loadingError && !searchQuery && (
            <p className="no-content-message">No painting images available yet.</p>
          )}
        </div>
        {/* Buttons for Paintings */}
        <div className="button-group-container">
          <div className="button-group">
            {showMorePaintingsButton && (
              <button onClick={() => handleLoadMore("paintings")} className="load-more-btn">
                Show More Paintings
              </button>
            )}
            {showLessPaintingsButton && (
              <button onClick={() => handleShowLess("paintings")} className="show-less-btn">
                Show Less
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Exhibitions Section */}
      <section className="content-section">
        <h1 className="section-title">გამოფენები</h1>
        <div className="images-section">
          {renderSectionItems(filteredExhibitions, visibleExhibitions, "Exhibition")}
          {filteredExhibitions.length === 0 && !loadingError && searchQuery && (
            <p className="no-content-message">No exhibitions found matching "{searchQuery}".</p>
          )}
          {exhibitions.length === 0 && !loadingError && !searchQuery && (
            <p className="no-content-message">No exhibition images available yet.</p>
          )}
        </div>
        {/* Buttons for Exhibitions */}
        <div className="button-group-container">
          <div className="button-group">
            {showMoreExhibitionsButton && (
              <button onClick={() => handleLoadMore("exhibitions")} className="load-more-btn">
                Show More Exhibitions
              </button>
            )}
            {showLessExhibitionsButton && (
              <button onClick={() => handleShowLess("exhibitions")} className="show-less-btn">
                Show Less
              </button>
            )}
          </div>
        </div>
      </section>

      {loadingError && (
        <div className="error-section">
          <p className="error-message">
            ⚠️ Failed to load images. Please ensure the backend is running and has files uploaded.
          </p>
        </div>
      )}
    </div>
  );
}

export default Home;