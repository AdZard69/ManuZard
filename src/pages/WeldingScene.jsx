import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import WeldingSimulator from '../components/WeldingSimulator';
import './Scene.css';

const WeldingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Arc Welding Simulator</h1>
        <p className="scene-description">
          Arc welding uses an electric arc (~6000°C) to melt and fuse metal parts. MIG welding
          feeds wire automatically (one-hand operation), while TIG welding requires manual filler
          rod dipping (two-hand technique). Proper welding speed is critical - too fast causes
          undercut, too slow causes burn-through.
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [4, 4, 4], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[4, 4, 4]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2.2}
          />

          <WeldingSimulator />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>MIG vs TIG Welding</h3>
          <ul>
            <li>MIG - Wire feed, one-hand, faster production</li>
            <li>TIG - Manual rod, two-hand, higher precision</li>
            <li>MIG uses consumable wire electrode</li>
            <li>TIG uses non-consumable tungsten electrode</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Welding Defects</h3>
          <ul>
            <li>Undercut - Travel speed too fast (thin beads)</li>
            <li>Burn-through - Travel speed too slow (large blobs)</li>
            <li>Porosity - Gas shielding insufficient</li>
            <li>Lack of Fusion - Heat input too low</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Click and drag on metal plate to weld</li>
            <li>Toggle MIG/TIG in control panel</li>
            <li>Watch for weld quality feedback</li>
            <li>Auto Demo mode for presentations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WeldingScene;
