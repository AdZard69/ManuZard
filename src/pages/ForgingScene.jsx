import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ForgingPress from '../components/ForgingPress';
import './Scene.css';

const ForgingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Hydraulic Forging Press</h1>
        <p className="scene-description">
          Forging uses compressive forces to shape metal at high temperature (1200°C). Open Die
          forging creates barrelling (middle bulges due to friction). Closed Die forging uses a
          shaped cavity - excess metal forms flash that must be trimmed. Volume conservation:
          V = πr²h means as height decreases, radius must increase.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [4, 3, 4], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[4, 3, 4]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.1}
          />

          <ForgingPress />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>Open Die vs Closed Die</h3>
          <ul>
            <li>Open Die - Flat dies, barrelling effect, large parts</li>
            <li>Closed Die - Shaped cavity, flash formation, precision</li>
            <li>Friction at die contact causes non-uniform deformation</li>
            <li>Middle section bulges more (barrelling)</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Volume Conservation</h3>
          <ul>
            <li>Metal volume stays constant: V = πr²h</li>
            <li>Compression reduces height → radius increases</li>
            <li>70% compression = 2.0m → 0.6m height</li>
            <li>Flash forms when billet exceeds die cavity</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Grain Structure Effects</h3>
          <ul>
            <li>Forging aligns grain boundaries (stronger)</li>
            <li>Cast parts have random grain orientation</li>
            <li>Grain flow follows part contours</li>
            <li>Toggle grain view to see alignment</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Toggle Open Die / Closed Die modes</li>
            <li>Adjust compression slider (0-100%)</li>
            <li>Control temperature (affects color)</li>
            <li>Enable Auto Forge for animated demo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgingScene;
