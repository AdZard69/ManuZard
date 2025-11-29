import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import SheetMetalLab from '../components/SheetMetalLab';
import './Scene.css';

const SheetMetalScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Sheet Metal Lab: 3 Processes</h1>
        <p className="scene-description">
          Sheet metal operations transform flat metal into complex shapes. Shearing uses shear
          stress to fracture metal (punching creates holes, slug is waste). V-Bending demonstrates
          springback - elastic recovery causes the bend angle to open 3-5° after tool removal.
          Metal Spinning uses a roller to force a rotating disk onto a mandrel, creating axisymmetric
          parts like cones and bowls.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [4, 3, 5], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[4, 3, 5]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.1}
          />

          <SheetMetalLab />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>Shearing (Punching)</h3>
          <ul>
            <li>Stress exceeds shear strength → fracture</li>
            <li>Clearance between punch and die critical</li>
            <li>Slug (waste) falls through die opening</li>
            <li>Wrong clearance causes burrs/rough edges</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>V-Bending & Springback</h3>
          <ul>
            <li>Tension on outer fibers, compression inside</li>
            <li>Neutral axis = no stress (center line)</li>
            <li>Springback: Elastic recovery after tool removal</li>
            <li>Bend 90° → Springs back to 92-95°</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Metal Spinning</h3>
          <ul>
            <li>Lathe-like process for axisymmetric parts</li>
            <li>Flat disk rotates, roller pushes onto mandrel</li>
            <li>Creates cones, cups, bowls without cutting</li>
            <li>Minimal material waste vs. machining</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Select process: Shearing/Bending/Spinning</li>
            <li>Watch for springback in Bending mode</li>
            <li>Observe slug falling in Shearing</li>
            <li>See LatheGeometry morph in Spinning</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SheetMetalScene;
