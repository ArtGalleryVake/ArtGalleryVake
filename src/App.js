// src/App.js (or wherever your main App component is)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from "./components/Home"; // Assuming Home is in components
import Admin from "./components/Admin"; // Assuming Admin is in components
import AuthorPage from './components/AuthorPage'; // Assuming AuthorPage is in components
import PaintingPage from './components/PaintingPage'; // Assuming PaintingPage is in components
import ExhibitionPage from './components/ExhibitionPage'; // <-- Import ExhibitionPage
import Landing from './components/Landing'; // <-- Import LandingPage (adjust path if needed)

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the Landing page (at the root '/') */}
        
        {/* Route for the Home page (gallery), now accessed at '/home' */}
        <Route path="/" element={<Home />} /> 
        
        {/* Route for the Admin page */}
        <Route path="/admin" element={<Admin />} />

        {/* Route for individual Author detail pages */}
        <Route path="/authors/:authorSlug" element={<AuthorPage />} />
        
        {/* Route for individual Painting detail pages */}
        <Route path="/paintings/:paintingSlug" element={<PaintingPage />} /> 
        
        {/* Route for individual Exhibition detail pages */}
        <Route path="/exhibitions/:exhibitionSlug" element={<ExhibitionPage />} /> 
      </Routes>
    </Router>
  );
}

export default App;