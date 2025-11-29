import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navigation.css';

const Navigation = ({ activeCategory, setActiveCategory }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = [
    { name: 'Home', path: '/', icon: '🏭' },
    { name: 'Casting', path: '/casting', icon: '🔥' },
    { name: 'Welding', path: '/welding', icon: '⚡' },
    { name: 'Forging', path: '/forging', icon: '🔨' },
    { name: 'Rolling', path: '/rolling', icon: '🎚️' },
    { name: 'Extrusion', path: '/extrusion', icon: '➡️' },
    { name: 'Sheet Metal', path: '/sheet-metal', icon: '📄' },
    { name: '3D Printing', path: '/3d-printing', icon: '🖨️' },
    { name: 'Laser Cutting', path: '/laser-cutting', icon: '✨' },
  ];

  // Close menu when route changes on mobile
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
        <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      
      {isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <nav className={`navigation ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <h1 className="logo">
            <span className="logo-manu">Manu</span>
            <span className="logo-zard">Zard</span>
          </h1>
          <p className="tagline">Interactive Manufacturing Process Visualizer</p>
        </div>

        <div className="nav-categories">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className={`nav-item ${location.pathname === category.path ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(category.name.toLowerCase());
                setIsMenuOpen(false);
              }}
            >
              <span className="nav-icon">{category.icon}</span>
              <span className="nav-text">{category.name}</span>
              <span className="nav-glow"></span>
            </Link>
          ))}
        </div>

        <div className="nav-footer">
          <p className="credit">Engineering Manufacturing Processes</p>
          <p className="version">v1.0.0</p>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
