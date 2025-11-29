import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import RollingMill from '../components/RollingMill';
import './Scene.css';

const RollingScene = () => {
  return (
    <div className="scene-container">
      <div className="scene-header">
        <h1 className="scene-title">Two-High Rolling Mill</h1>
        <p className="scene-description">
          Rolling reduces metal thickness by passing it through rotating cylinders. The Neutral
          Point is where metal velocity equals roller surface velocity. Hot Rolling (above
          recrystallization temp) produces large reductions with glowing red metal. Cold Rolling
          (room temp) creates shiny, dimensionally-accurate surfaces. Volume conservation means
          exit velocity exceeds entry velocity (v_out = v_in × h_in/h_out).
        </p>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          className="three-canvas"
          shadows
          camera={{ position: [6, 4, 8], fov: 50 }}
        >
          <PerspectiveCamera makeDefault position={[6, 4, 8]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2.1}
          />

          <RollingMill />
        </Canvas>
      </div>

      <div className="scene-info">
        <div className="info-card">
          <h3>The Neutral Point</h3>
          <ul>
            <li>Entry: Rollers move faster than metal (pulling)</li>
            <li>Neutral Point: Velocities match (no slip)</li>
            <li>Exit: Metal moves faster than rollers (pushing)</li>
            <li>Location depends on friction and reduction ratio</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Hot vs Cold Rolling</h3>
          <ul>
            <li>Hot Rolling: Above 1200°C, large reductions, rough surface</li>
            <li>Cold Rolling: Room temp, precise dimensions, shiny finish</li>
            <li>Hot: Lower force required, oxide scale forms</li>
            <li>Cold: Higher force, work hardening occurs</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Volume Conservation</h3>
          <ul>
            <li>Metal volume stays constant: V = A × L</li>
            <li>Thickness decreases → Length increases</li>
            <li>Exit velocity: v_out = v_in × (h_in / h_out)</li>
            <li>60% reduction → Exit speed 2.5× faster</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>How to Use</h3>
          <ul>
            <li>Adjust Roller Gap to control output thickness</li>
            <li>Toggle Hot/Cold Rolling modes</li>
            <li>Watch velocity differential at entry/exit</li>
            <li>Observe reduction percentage in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RollingScene;
