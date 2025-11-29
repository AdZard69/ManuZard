import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import SandCastingSystem from '../components/SandCastingSystem';
import './Scene.css';

const CastingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Sand Casting Process</h1>
        <p className="scene-description">
          Sand casting uses a sand mold to create metal parts. Molten metal flows through a gating
          system (sprue, runner, gate) into the part cavity. The riser provides additional metal
          to compensate for shrinkage during solidification. Thin sections cool faster than thick
          sections, following Chvorinov's Rule.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          gl={{ localClippingEnabled: true }}
        >
          <PerspectiveCamera makeDefault position={[8, 6, 8]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={20}
          />

          <SandCastingSystem />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>Gating System Components</h3>
          <ul>
            <li>Pouring Basin - Entry point for molten metal</li>
            <li>Sprue - Vertical channel (gravity feed)</li>
            <li>Runner - Horizontal distribution channel</li>
            <li>Gate - Entry into the part cavity</li>
            <li>Riser - Feeds metal during shrinkage</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Chvorinov's Rule</h3>
          <ul>
            <li>Cooling Time = C × (Volume/Surface Area)²</li>
            <li>Thin sections solidify first (Runner, Sprue)</li>
            <li>Thick sections solidify last (Part, Riser)</li>
            <li>Riser must freeze last to feed the part</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Common Defects</h3>
          <ul>
            <li>Shrinkage Cavity - Riser too small</li>
            <li>Cold Shut - Metal too cold at junction</li>
            <li>Porosity - Gas trapped during pour</li>
            <li>Misrun - Incomplete filling of mold</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CastingScene;
