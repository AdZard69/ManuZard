import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ExtrusionPress from '../components/ExtrusionPress';
import './Scene.css';

const ExtrusionScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Extrusion Press: Direct vs Indirect</h1>
        <p className="scene-description">
          Extrusion pushes a billet through a die to create T-beams, tubes, and complex profiles.
          Direct Extrusion has massive wall friction (billet slides against container). Indirect
          Extrusion eliminates friction (die moves into stationary billet) requiring 30% less
          force. The Dead Metal Zone (DMZ) is stagnant metal trapped at die corners in Direct mode.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [5, 3, 6], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[5, 3, 6]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2.1}
          />

          <ExtrusionPress />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>Direct Extrusion (Forward)</h3>
          <ul>
            <li>Ram pushes billet through stationary die</li>
            <li>Billet slides along container walls (friction)</li>
            <li>Force decreases as billet shortens</li>
            <li>Dead Metal Zone forms at die corners</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Indirect Extrusion (Backward)</h3>
          <ul>
            <li>Die attached to ram, pushes into billet</li>
            <li>Billet stationary relative to container</li>
            <li>Zero wall friction → 30% less force</li>
            <li>Constant force throughout process</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Dead Metal Zone (DMZ)</h3>
          <ul>
            <li>Cone-shaped stagnant metal at die corners</li>
            <li>Only appears in Direct Extrusion</li>
            <li>Caused by friction and material flow</li>
            <li>Proves understanding of plastic flow</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Toggle Direct/Indirect modes</li>
            <li>Watch ram force difference (friction effect)</li>
            <li>Observe DMZ in Direct mode</li>
            <li>See friction heat on billet surface</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionScene;
