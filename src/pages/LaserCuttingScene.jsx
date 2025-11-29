import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import LaserCutter from '../components/LaserCutter';
import './Scene.css';

const LaserCuttingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">CO2 Laser Cutter: Cutting vs Engraving</h1>
        <p className="scene-description">
          Laser cutting uses focused light at the focal point (hourglass beam) to vaporize material.
          The Kerf is the width of material removed - parts are smaller by kerf width. Vector Cutting
          (DXF) traces paths at high power/low speed cutting through material. Raster Engraving (PNG)
          uses zig-zag pattern at low power/high speed for surface marking. HAZ (Heat Affected Zone)
          is the burnt edge around cuts.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [3, 3, 4], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[3, 3, 4]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2.1}
          />

          <LaserCutter />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>Vector Cutting (DXF/SVG)</h3>
          <ul>
            <li>Laser traces path like pen drawing line</li>
            <li>High power / Low speed → cuts through</li>
            <li>Kerf width: Material removed by beam</li>
            <li>Creates holes, slots, outlines</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Raster Engraving (JPG/PNG)</h3>
          <ul>
            <li>Laser scans left-right like inkjet printer</li>
            <li>Low power / High speed → surface marking</li>
            <li>Creates images, text, textures</li>
            <li>No material removal, just discoloration</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Laser Physics & HAZ</h3>
          <ul>
            <li>Hourglass beam focuses at focal point</li>
            <li>Focal point = maximum power density</li>
            <li>HAZ: Heat affected zone (burnt edges)</li>
            <li>Sparks spray opposite to movement direction</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Toggle Vector Cutting / Raster Engraving</li>
            <li>Watch canvas texture burn in real-time</li>
            <li>Adjust kerf width (beam thickness)</li>
            <li>Observe hourglass focal point beam</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LaserCuttingScene;
