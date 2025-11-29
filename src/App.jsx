import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import CastingScene from './pages/CastingScene';
import WeldingScene from './pages/WeldingScene';
import ForgingScene from './pages/ForgingScene';
import RollingScene from './pages/RollingScene';
import ExtrusionScene from './pages/ExtrusionScene';
import SheetMetalScene from './pages/SheetMetalScene';
import PrintingScene from './pages/PrintingScene';
import LaserCuttingScene from './pages/LaserCuttingScene';
import './App.css';

function App() {
  const [activeCategory, setActiveCategory] = useState('home');

  return (
    <Router>
      <div className="app">
        <Navigation activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/casting" element={<CastingScene />} />
            <Route path="/welding" element={<WeldingScene />} />
            <Route path="/forging" element={<ForgingScene />} />
            <Route path="/rolling" element={<RollingScene />} />
            <Route path="/extrusion" element={<ExtrusionScene />} />
            <Route path="/sheet-metal" element={<SheetMetalScene />} />
            <Route path="/3d-printing" element={<PrintingScene />} />
            <Route path="/laser-cutting" element={<LaserCuttingScene />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
