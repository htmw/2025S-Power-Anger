// src/Navbar.js
import React from 'react';
import './Navbar.css'; // Import the custom CSS file

import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          Guidesense
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <a href="#maps" className="navbar-link">Maps</a>
          <a href="#text" className="navbar-link">Text to speech</a>
          <a href="#paths" className="navbar-link">Old paths </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
