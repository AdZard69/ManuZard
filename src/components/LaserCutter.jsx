import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Spark particles
const LaserSparks = ({ active, position, direction }) => {
  const particlesRef = useRef();
  const particleCount = 40;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];

      // Sparks spray opposite to movement direction
      vel[i * 3] = -direction[0] * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = Math.random() * 0.3;
      vel[i * 3 + 2] = -direction[1] * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
    }
    return [pos, vel];
  }, [position, direction]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        velocities[i * 3 + 1] -= delta * 1.5; // Gravity

        if (positions[i * 3 + 1] < -0.5) {
          positions[i * 3] = position[0];
          positions[i * 3 + 1] = position[1];
          positions[i * 3 + 2] = position[2];
          velocities[i * 3] = -direction[0] * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
          velocities[i * 3 + 1] = Math.random() * 0.3;
          velocities[i * 3 + 2] = -direction[1] * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffaa00"
        emissive="#ff6600"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const LaserCutter = () => {
  const laserHeadRef = useRef();
  const materialPlaneRef = useRef();
  const canvasRef = useRef();
  const textureRef = useRef();

  const [laserPosition, setLaserPosition] = useState({ x: -1.5, y: -1.5 });
  const [cutProgress, setCutProgress] = useState(0);
  const [laserDirection, setLaserDirection] = useState([1, 0]);

  // Leva Controls
  const controls = useControls('Laser Cutter Controls', {
    mode: {
      value: 'Vector Cutting',
      options: ['Vector Cutting', 'Raster Engraving'],
      label: 'Operation Mode',
    },
    progress: { value: 0, min: 0, max: 100, step: 0.1, label: 'Cut Progress (%)' },
    kerfWidth: { value: 0.02, min: 0.01, max: 0.05, step: 0.005, label: 'Kerf Width (mm)' },
    showLabels: { value: true, label: 'Show Labels' },
    showSparks: { value: true, label: 'Show Sparks' },
    autoRun: { value: true, label: 'Auto Run' },
    speed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
    reset: button(() => {
      setCutProgress(0);
      // Reset canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#D2B48C'; // Wood color
        ctx.fillRect(0, 0, 512, 512);
      }
    }),
  });

  const { mode, progress, kerfWidth, showLabels, showSparks, autoRun, speed } = controls;

  const isVectorCutting = mode === 'Vector Cutting';
  const isRasterEngraving = mode === 'Raster Engraving';

  // Create canvas texture
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#D2B48C'; // Wood color
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    textureRef.current = texture;

    if (materialPlaneRef.current) {
      materialPlaneRef.current.material.map = texture;
      materialPlaneRef.current.material.needsUpdate = true;
    }
  }, []);

  // Auto-run animation
  useFrame((state, delta) => {
    if (autoRun) {
      setCutProgress((prev) => {
        const newProgress = prev + delta * speed * 15;
        if (newProgress >= 100) return 0; // Loop
        return newProgress;
      });
    } else {
      setCutProgress(progress);
    }
  });

  const activeProgress = autoRun ? cutProgress : progress;
  const normalizedProgress = activeProgress / 100;

  // Update laser position and draw on canvas
  useFrame(() => {
    if (!canvasRef.current || !textureRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;

    if (isVectorCutting) {
      // Vector Cutting: Draw a circle/star path
      const angle = normalizedProgress * Math.PI * 2;
      const radius = 1.0;
      const centerX = 0;
      const centerY = 0;

      // Star pattern (5 points)
      const points = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      const pointIndex = Math.floor(normalizedProgress * points * 2);
      const isOuter = pointIndex % 2 === 0;
      const currentRadius = isOuter ? outerRadius : innerRadius;
      const currentAngle = (pointIndex / (points * 2)) * Math.PI * 2;

      const newX = centerX + Math.cos(currentAngle) * currentRadius;
      const newY = centerY + Math.sin(currentAngle) * currentRadius;

      setLaserPosition({ x: newX, y: newY });

      // Calculate direction
      const dx = newX - laserPosition.x;
      const dy = newY - laserPosition.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0.001) {
        setLaserDirection([dx / length, dy / length]);
      }

      // Draw on canvas (cutting = transparency)
      const canvasX = ((newX + 1.5) / 3) * canvas.width;
      const canvasY = ((1.5 - newY) / 3) * canvas.height;

      ctx.globalCompositeOperation = 'destination-out'; // Create transparency
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, kerfWidth * 1000, 0, Math.PI * 2);
      ctx.fill();

      // HAZ (Heat Affected Zone) - brown ring
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(50, 25, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, kerfWidth * 1500, 0, Math.PI * 2);
      ctx.fill();

      textureRef.current.needsUpdate = true;
    } else {
      // Raster Engraving: Zig-zag pattern
      const lineY = normalizedProgress * 3 - 1.5;
      const scanSpeed = state.clock.elapsedTime * 5;
      const scanX = (Math.sin(scanSpeed) * 1.2);

      setLaserPosition({ x: scanX, y: lineY });
      setLaserDirection([Math.cos(scanSpeed) * 5, 0]);

      // Draw on canvas (engraving = dark marks)
      const canvasX = ((scanX + 1.5) / 3) * canvas.width;
      const canvasY = ((1.5 - lineY) / 3) * canvas.height;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Dark burn
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, kerfWidth * 500, 0, Math.PI * 2);
      ctx.fill();

      textureRef.current.needsUpdate = true;
    }

    // Update laser head position
    if (laserHeadRef.current) {
      laserHeadRef.current.position.x = laserPosition.x;
      laserHeadRef.current.position.z = laserPosition.y;
    }
  });

  return (
    <group>
      {/* ========== MATERIAL BED (WOOD SHEET WITH CANVAS TEXTURE) ========== */}
      <mesh ref={materialPlaneRef} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial
          transparent
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Honeycomb bed (underneath) */}
      <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} wireframe />
      </mesh>

      {/* ========== LASER HEAD (HOURGLASS BEAM) ========== */}
      <group ref={laserHeadRef} position={[0, 0.8, 0]}>
        {/* Laser head module */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Hourglass beam (two cones meeting at focal point) */}
        {activeProgress > 0 && (
          <>
            {/* Top cone */}
            <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.5, 16]} />
              <meshStandardMaterial
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={3}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Bottom cone (focal point) */}
            <mesh position={[0, -0.45, 0]}>
              <coneGeometry args={[0.08, 0.5, 16]} />
              <meshStandardMaterial
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={3}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Focal point glow */}
            <mesh position={[0, -0.45, 0]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={5}
                transparent
                opacity={0.9}
              />
            </mesh>
          </>
        )}

        {/* Air assist nozzle */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.15, 16]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ========== SPARKS ========== */}
      {showSparks && activeProgress > 0 && (
        <LaserSparks
          active={true}
          position={[laserPosition.x, -0.4, laserPosition.y]}
          direction={laserDirection}
        />
      )}

      {/* ========== GANTRY SYSTEM ========== */}
      {/* X-axis rail */}
      <mesh position={[0, 1.2, laserPosition.y]}>
        <boxGeometry args={[3.5, 0.1, 0.15]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Y-axis rails (left and right) */}
      <mesh position={[-1.8, 1.2, 0]}>
        <boxGeometry args={[0.1, 0.1, 3.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.8, 1.2, 0]}>
        <boxGeometry args={[0.1, 0.1, 3.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Frame corners */}
      <mesh position={[-1.8, 0.5, -1.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.8, 0.5, -1.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.8, 0.5, 1.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.8, 0.5, 1.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ========== LABELS ========== */}
      {showLabels && (
        <>
          {/* Process Title */}
          <Html position={[0, 2, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.9)',
                border: '2px solid #ff0000',
                color: '#ff6666',
                padding: '12px 24px',
                borderRadius: '2px',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {isVectorCutting ? '✂️ VECTOR CUTTING (DXF)' : '🖨️ RASTER ENGRAVING (PNG)'}
            </div>
          </Html>

          {/* Progress Display */}
          <Html position={[0, -1.2, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.9)',
                border: '1px solid #66fcf1',
                color: '#66fcf1',
                padding: '10px 20px',
                borderRadius: '2px',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
              }}
            >
              Progress: {activeProgress.toFixed(1)}%
            </div>
          </Html>

          {/* Power/Speed Info */}
          <Html position={[2.2, 0.5, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: `2px solid ${isVectorCutting ? '#ff4400' : '#ffcc00'}`,
                color: isVectorCutting ? '#ff9966' : '#ffcc00',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {isVectorCutting ? 'HIGH POWER / LOW SPEED' : 'LOW POWER / HIGH SPEED'}
            </div>
          </Html>

          {/* Kerf Width Display */}
          <Html position={[-2.2, 0.5, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: '1px solid #66fcf1',
                color: '#66fcf1',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Kerf: {(kerfWidth * 100).toFixed(1)}mm
            </div>
          </Html>

          {/* Focal Point Label */}
          {activeProgress > 0 && (
            <Html position={[laserPosition.x, -0.45, laserPosition.y + 0.3]} center>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #ff0000',
                  color: '#ff0000',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                FOCAL POINT
              </div>
            </Html>
          )}

          {/* HAZ Warning */}
          {isVectorCutting && (
            <Html position={[0, -0.9, 0]} center>
              <div
                style={{
                  background: 'rgba(255, 68, 0, 0.8)',
                  border: '2px solid #ff4400',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                HAZ (Heat Affected Zone)
              </div>
            </Html>
          )}
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#66fcf1" />
      <pointLight position={[-3, 3, -3]} intensity={0.5} color="#45a29e" />

      {/* Laser glow */}
      {activeProgress > 0 && (
        <pointLight
          position={[laserPosition.x, -0.4, laserPosition.y]}
          intensity={isVectorCutting ? 3 : 1.5}
          distance={2}
          decay={2}
          color="#ff0000"
        />
      )}

      {/* Main spotlight */}
      <spotLight
        position={[0, 3, 2]}
        intensity={1}
        angle={0.8}
        penumbra={1}
        color="#ffffff"
        castShadow
      />

      {/* Ground Grid */}
      <gridHelper args={[8, 8, '#45a29e', '#1f2833']} position={[0, -1, 0]} />

      {/* Platform base */}
      <mesh position={[0, -1.1, 0]} receiveShadow>
        <boxGeometry args={[8, 0.2, 6]} />
        <meshStandardMaterial color="#1f2833" metalness={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
};

export default LaserCutter;
