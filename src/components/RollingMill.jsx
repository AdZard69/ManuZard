import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Heat haze particles for hot rolling
const HeatHazeParticles = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = position[1] + Math.random() * 0.5;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 1;
    }
    return pos;
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.5; // Rise up
        positions[i * 3] += (Math.random() - 0.5) * delta * 0.3; // Drift
        positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.3;

        if (positions[i * 3 + 1] > position[1] + 2) {
          positions[i * 3] = position[0] + (Math.random() - 0.5) * 2;
          positions[i * 3 + 1] = position[1];
          positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 1;
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
        size={0.08}
        color="#ff9900"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Sparks for hot rolling
const SparkParticles = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 60;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];

      vel[i * 3] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = Math.random() * 1.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return [pos, vel];
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        velocities[i * 3 + 1] -= delta * 2; // Gravity

        if (positions[i * 3 + 1] < -1) {
          positions[i * 3] = position[0];
          positions[i * 3 + 1] = position[1];
          positions[i * 3 + 2] = position[2];
          velocities[i * 3] = (Math.random() - 0.5) * 2;
          velocities[i * 3 + 1] = Math.random() * 1.5;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
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
        size={0.04}
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

const RollingMill = () => {
  const metalSheetRef = useRef();
  const topRollerRef = useRef();
  const bottomRollerRef = useRef();
  const [sheetPosition, setSheetPosition] = useState(-8);

  // Leva Controls
  const controls = useControls('Rolling Mill Controls', {
    rollerGap: { value: 0.4, min: 0.2, max: 0.8, step: 0.05, label: 'Roller Gap (Output Thickness)' },
    speed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Rolling Speed' },
    rollingMode: { value: 'Hot Rolling', options: ['Hot Rolling', 'Cold Rolling'], label: 'Rolling Mode' },
    showLabels: { value: true, label: 'Show Labels' },
    showParticles: { value: true, label: 'Show Effects' },
    autoRun: { value: true, label: 'Auto Run' },
    reset: button(() => {
      setSheetPosition(-8);
    })
  });

  const { rollerGap, speed, rollingMode, showLabels, showParticles, autoRun } = controls;

  const isHotRolling = rollingMode === 'Hot Rolling';

  // Constants
  const h_in = 1.0; // Initial thickness
  const h_out = rollerGap; // Final thickness
  const reduction = ((h_in - h_out) / h_in) * 100;

  const sheetLength = 10;
  const sheetWidth = 3;
  const segments = 128; // High segment count for smooth vertex displacement

  // Create geometry with high segments
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(sheetLength, h_in, sheetWidth, segments, 1, 1);
  }, [sheetLength, sheetWidth, segments]);

  // Animation loop
  useFrame((state, delta) => {
    // Move sheet
    if (autoRun) {
      setSheetPosition((prev) => {
        const newPos = prev + delta * speed;
        if (newPos > 10) return -8; // Loop
        return newPos;
      });
    }

    // Rotate rollers
    if (topRollerRef.current && bottomRollerRef.current) {
      topRollerRef.current.rotation.z -= delta * speed * 2;
      bottomRollerRef.current.rotation.z += delta * speed * 2;
    }

    // Vertex displacement
    if (metalSheetRef.current) {
      const geometry = metalSheetRef.current.geometry;
      const positions = geometry.attributes.position.array;
      const originalPositions = geometry.userData.originalPositions;

      if (!originalPositions) {
        geometry.userData.originalPositions = positions.slice();
        return;
      }

      const rollerX = 0; // Roller position in local space
      const transitionWidth = 0.5; // Width of deformation zone

      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i]; // Local X position of vertex
        const worldX = x + sheetPosition; // World X position

        let y = originalPositions[i + 1]; // Y is thickness

        // Determine thickness based on position relative to rollers
        if (worldX < rollerX - transitionWidth) {
          // Before rollers - original thickness
          positions[i + 1] = (y / Math.abs(y)) * (h_in / 2);
        } else if (worldX > rollerX + transitionWidth) {
          // After rollers - reduced thickness
          positions[i + 1] = (y / Math.abs(y)) * (h_out / 2);
        } else {
          // In the rollers - interpolate
          const t = (worldX - (rollerX - transitionWidth)) / (2 * transitionWidth);
          const interpolatedThickness = h_in + (h_out - h_in) * t;
          positions[i + 1] = (y / Math.abs(y)) * (interpolatedThickness / 2);
        }
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  // Material based on rolling mode
  const materialProps = isHotRolling
    ? {
        color: '#ff4400',
        emissive: '#ff2200',
        emissiveIntensity: 1.5,
        metalness: 0.4,
        roughness: 0.6,
      }
    : {
        color: '#c0c0c0',
        emissive: '#000000',
        emissiveIntensity: 0,
        metalness: 1.0,
        roughness: 0.1,
      };

  // Calculate neutral point position (simplified - at roller center)
  const neutralPointX = 0;

  // Volume conservation visualization - output speed increases
  const inputVelocity = speed;
  const outputVelocity = speed * (h_in / h_out); // v_out = v_in * (h_in / h_out)

  return (
    <group>
      {/* ========== METAL SHEET (WITH VERTEX DISPLACEMENT) ========== */}
      <mesh
        ref={metalSheetRef}
        position={[sheetPosition, 0, 0]}
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* ========== TOP ROLLER ========== */}
      <mesh ref={topRollerRef} position={[0, h_out / 2 + 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, sheetWidth + 0.5, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* ========== BOTTOM ROLLER ========== */}
      <mesh ref={bottomRollerRef} position={[0, -(h_out / 2 + 0.4), 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, sheetWidth + 0.5, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* ========== ROLLER SUPPORTS (STRUCTURAL) ========== */}
      {/* Top support */}
      <mesh position={[0, h_out / 2 + 0.4, sheetWidth / 2 + 0.6]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, h_out / 2 + 0.4, -(sheetWidth / 2 + 0.6)]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Bottom support */}
      <mesh position={[0, -(h_out / 2 + 0.4), sheetWidth / 2 + 0.6]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, -(h_out / 2 + 0.4), -(sheetWidth / 2 + 0.6)]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* ========== PARTICLE EFFECTS (HOT ROLLING) ========== */}
      {showParticles && isHotRolling && (
        <>
          <HeatHazeParticles active={true} position={[0, 0, 0]} />
          <SparkParticles active={true} position={[0, 0, 0]} />
        </>
      )}

      {/* ========== LABELS & UI ========== */}
      {showLabels && (
        <>
          {/* Neutral Point Label */}
          <Html position={[neutralPointX, 1.5, 0]} center>
            <div
              style={{
                background: 'rgba(255, 204, 0, 0.9)',
                border: '2px solid #ffcc00',
                color: '#0b0c10',
                padding: '6px 12px',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Neutral Point
            </div>
          </Html>

          {/* Reduction Percentage */}
          <Html position={[0, -2.5, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.9)',
                border: '1px solid #66fcf1',
                color: '#66fcf1',
                padding: '12px 20px',
                borderRadius: '2px',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              Reduction: {reduction.toFixed(1)}%
            </div>
          </Html>

          {/* Input/Output Velocity Indicators */}
          <Html position={[-4, -2, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: '1px solid #45a29e',
                color: '#45a29e',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              ← Input: {inputVelocity.toFixed(1)} m/s
            </div>
          </Html>

          <Html position={[4, -2, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: '1px solid #ffcc00',
                color: '#ffcc00',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Output: {outputVelocity.toFixed(1)} m/s →
            </div>
          </Html>

          {/* Rolling Mode Indicator */}
          <Html position={[0, 2.5, 0]} center>
            <div
              style={{
                background: isHotRolling
                  ? 'rgba(255, 68, 0, 0.9)'
                  : 'rgba(192, 192, 192, 0.9)',
                border: isHotRolling ? '2px solid #ff4400' : '2px solid #c0c0c0',
                color: isHotRolling ? '#fff' : '#0b0c10',
                padding: '10px 20px',
                borderRadius: '2px',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {isHotRolling ? '🔥 HOT ROLLING' : '❄️ COLD ROLLING'}
            </div>
          </Html>

          {/* Thickness Labels */}
          <Html position={[-6, 0, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.7)',
                border: '1px solid #66fcf1',
                color: '#66fcf1',
                padding: '6px 10px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
              }}
            >
              h₀ = {h_in.toFixed(1)}m
            </div>
          </Html>

          <Html position={[6, 0, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.7)',
                border: '1px solid #66fcf1',
                color: '#66fcf1',
                padding: '6px 10px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
              }}
            >
              h𝒇 = {h_out.toFixed(1)}m
            </div>
          </Html>
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={1.2} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />

      {/* Key lights from multiple angles */}
      <pointLight position={[8, 5, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-8, 5, -5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[0, 5, -5]} intensity={1.8} color="#ffffff" />

      {/* Hot rolling glow */}
      {isHotRolling && (
        <>
          <pointLight
            position={[sheetPosition, 0, 0]}
            intensity={3}
            distance={6}
            decay={2}
            color="#ff4400"
          />
          <pointLight
            position={[0, 0, 0]}
            intensity={2.5}
            distance={4}
            decay={2}
            color="#ff6600"
          />
        </>
      )}

      {/* Roller lights */}
      <spotLight
        position={[0, 3, 3]}
        intensity={2}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[0, 3, -3]}
        intensity={2}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
      />

      {/* Ground Grid */}
      <gridHelper args={[30, 30, '#45a29e', '#1f2833']} position={[0, -2, 0]} />

      {/* Platform */}
      <mesh position={[0, -2.1, 0]} receiveShadow>
        <boxGeometry args={[30, 0.2, 10]} />
        <meshStandardMaterial color="#1f2833" metalness={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
};

export default RollingMill;
