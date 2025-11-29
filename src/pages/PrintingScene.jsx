import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ThreeDPrinter from '../components/ThreeDPrinter';
import './Scene.css';

const PrintingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Additive Manufacturing: 4 Technologies</h1>
        <p className="scene-description">
          3D printing builds objects layer-by-layer. FDM extrudes molten plastic (200°C) creating
          anisotropic parts weak in Z-axis. SLA uses UV laser to cure liquid resin from bottom-up
          (smooth surface). SLS laser-sinters powder particles - unsintered powder acts as support
          structure. Metal DMLS uses high-power laser in argon atmosphere generating sparks.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          gl={{ localClippingEnabled: true }}
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

          <ThreeDPrinter />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>FDM (Fused Deposition)</h3>
          <ul>
            <li>Hot nozzle extrudes thermoplastic filament</li>
            <li>Nozzle temp: 180-250°C (PLA/ABS)</li>
            <li>Layer lines visible (anisotropic strength)</li>
            <li>Requires support structures for overhangs</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>SLA (Stereolithography)</h3>
          <ul>
            <li>UV laser cures liquid photopolymer resin</li>
            <li>Prints upside-down (rises from vat)</li>
            <li>High resolution, smooth surface finish</li>
            <li>Requires support structures and post-curing</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>SLS/Metal (Laser Sintering)</h3>
          <ul>
            <li>Laser sinters powder layer-by-layer</li>
            <li>Self-supporting (powder = support)</li>
            <li>Metal requires inert gas (Argon)</li>
            <li>High strength, complex geometries</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Select technology: FDM/SLA/SLS/Metal</li>
            <li>Watch clipping plane reveal layers</li>
            <li>Toggle support structures (FDM/SLA only)</li>
            <li>Observe process-specific animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrintingScene;
