import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Dead Metal Zone - stagnant metal at die corners
const DeadMetalZone = ({ visible, position }) => {
  if (!visible) return null;

  return (
    <group position={position}>
      {/* Cone-shaped dead zone at die corners */}
      <mesh rotation={[0, 0, 0]}>
        <coneGeometry args={[0.6, 0.8, 8]} />
        <meshStandardMaterial
          color="#1a1a3a"
          metalness={0.3}
          roughness={0.8}
          opacity={0.7}
          transparent
        />
      </mesh>
      {/* Label */}
      <Html position={[0, 0.5, 0]} center>
        <div
          style={{
            background: 'rgba(26, 26, 58, 0.9)',
            border: '2px solid #4444aa',
            color: '#8888ff',
            padding: '4px 8px',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'Rajdhani, monospace',
            whiteSpace: 'nowrap',
          }}
        >
          DMZ
        </div>
      </Html>
    </group>
  );
};

// Heat particles for direct extrusion friction
const FrictionHeatParticles = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.9 + Math.random() * 0.2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.5; // Rise up
        if (positions[i * 3 + 1] > 1.5) {
          positions[i * 3 + 1] = -1.5;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ff4400"
        emissive="#ff2200"
        emissiveIntensity={2}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const ExtrusionPress = () => {
  const billetRef = useRef();
  const extrudateRef = useRef();
  const ramRef = useRef();
  const containerRef = useRef();

  const [extrusionProgress, setExtrusionProgress] = useState(0);

  // Leva Controls
  const controls = useControls('Extrusion Controls', {
    mode: { value: 'Direct', options: ['Direct', 'Indirect'], label: 'Extrusion Mode' },
    progress: { value: 0, min: 0, max: 100, step: 0.1, label: 'Extrusion Progress (%)' },
    showLabels: { value: true, label: 'Show Labels' },
    showDMZ: { value: true, label: 'Show Dead Metal Zone' },
    showHeat: { value: true, label: 'Show Friction Heat' },
    autoRun: { value: true, label: 'Auto Run' },
    speed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
    reset: button(() => {
      setExtrusionProgress(0);
    }),
  });

  const { mode, progress, showLabels, showDMZ, showHeat, autoRun, speed } = controls;

  const isDirect = mode === 'Direct';

  // Constants
  const billetLength = 3.0;
  const billetRadius = 1.0;
  const extrudateLength = 8.0;
  const extrudateRadius = 0.35; // T-beam cross-section

  // Area ratio for volume conservation
  const areaRatio = (billetRadius * billetRadius) / (extrudateRadius * extrudateRadius);

  // Auto-run animation
  useFrame((state, delta) => {
    if (autoRun) {
      setExtrusionProgress((prev) => {
        const newProgress = prev + delta * speed * 10;
        if (newProgress >= 100) return 0; // Loop
        return newProgress;
      });
    } else {
      setExtrusionProgress(progress);
    }
  });

  const activeProgress = autoRun ? extrusionProgress : progress;
  const normalizedProgress = activeProgress / 100;

  // Calculate positions and scales based on progress
  const ramPosition = -billetLength / 2 + normalizedProgress * billetLength;
  const billetScale = 1 - normalizedProgress; // Shrinks to 0
  const extrudateScale = normalizedProgress * areaRatio; // Grows based on volume conservation

  // Calculate ram force (Direct has friction, Indirect doesn't)
  const basePressure = 250; // MPa base
  const frictionFactor = isDirect ? 100 : 0; // Direct has wall friction
  const lengthRemaining = billetLength * (1 - normalizedProgress);
  const ramForce = basePressure + frictionFactor * lengthRemaining;

  // Create T-shaped extrudate using ExtrudeGeometry
  const extrudateGeometry = useMemo(() => {
    const shape = new THREE.Shape();

    // T-shape profile
    shape.moveTo(-0.3, 0.3); // Top left
    shape.lineTo(0.3, 0.3); // Top right
    shape.lineTo(0.3, 0.1); // Right shoulder
    shape.lineTo(0.1, 0.1); // Right stem top
    shape.lineTo(0.1, -0.3); // Right stem bottom
    shape.lineTo(-0.1, -0.3); // Left stem bottom
    shape.lineTo(-0.1, 0.1); // Left stem top
    shape.lineTo(-0.3, 0.1); // Left shoulder
    shape.lineTo(-0.3, 0.3); // Close

    const extrudeSettings = {
      steps: 2,
      depth: extrudateLength,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [extrudateLength]);

  return (
    <group>
      {/* ========== CONTAINER (GLASS) ========== */}
      <mesh ref={containerRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[billetRadius + 0.1, billetRadius + 0.1, billetLength, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#66fcf1"
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Container end caps */}
      <mesh position={[0, billetLength / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[billetRadius, billetRadius + 0.1, 32]} />
        <meshStandardMaterial color="#66fcf1" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -billetLength / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[billetRadius, billetRadius + 0.1, 32]} />
        <meshStandardMaterial color="#66fcf1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ========== BILLET (SHRINKING) ========== */}
      {billetScale > 0.05 && (
        <group position={[0, isDirect ? ramPosition / 2 : 0, 0]}>
          <mesh
            ref={billetRef}
            scale={[1, isDirect ? billetScale : 1, 1]}
            castShadow
          >
            <cylinderGeometry args={[billetRadius, billetRadius, billetLength, 32]} />
            <meshStandardMaterial
              color={isDirect && showHeat ? '#ff4400' : '#c0c0c0'}
              emissive={isDirect && showHeat ? '#ff2200' : '#000000'}
              emissiveIntensity={isDirect && showHeat ? 0.8 : 0}
              metalness={isDirect ? 0.4 : 0.9}
              roughness={isDirect ? 0.6 : 0.2}
            />
          </mesh>

          {/* Friction heat particles (Direct mode only) */}
          {showHeat && isDirect && (
            <FrictionHeatParticles
              active={normalizedProgress > 0.1 && normalizedProgress < 0.9}
              position={[0, 0, 0]}
            />
          )}
        </group>
      )}

      {/* ========== DIE (THICK DISK WITH T-HOLE) ========== */}
      <group position={[0, -billetLength / 2 - 0.2, 0]}>
        {/* Die body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[billetRadius + 0.15, billetRadius + 0.15, 0.4, 32]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Die label */}
        {showLabels && (
          <Html position={[0, 0, billetRadius + 0.5]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.9)',
                border: '1px solid #ffcc00',
                color: '#ffcc00',
                padding: '6px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
              }}
            >
              Die (T-Profile)
            </div>
          </Html>
        )}
      </group>

      {/* ========== DEAD METAL ZONE (DIRECT MODE ONLY) ========== */}
      {showDMZ && isDirect && (
        <DeadMetalZone visible={true} position={[0, -billetLength / 2 - 0.2, 0]} />
      )}

      {/* ========== RAM (PISTON) ========== */}
      <group position={[0, isDirect ? ramPosition : -billetLength / 2, 0]}>
        <mesh ref={ramRef} castShadow>
          <cylinderGeometry args={[billetRadius - 0.05, billetRadius - 0.05, 0.5, 32]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Ram rod */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Ram label */}
        {showLabels && (
          <Html position={[0, 0, billetRadius + 0.4]} center>
            <div
              style={{
                background: 'rgba(255, 204, 0, 0.9)',
                border: '2px solid #ffcc00',
                color: '#0b0c10',
                padding: '6px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
              }}
            >
              {isDirect ? 'RAM (PUSHING)' : 'RAM + DIE'}
            </div>
          </Html>
        )}
      </group>

      {/* ========== EXTRUDATE (GROWING T-BEAM) ========== */}
      {extrudateScale > 0.05 && (
        <mesh
          ref={extrudateRef}
          geometry={extrudateGeometry}
          position={[0, -billetLength / 2 - 0.4 - (extrudateScale * extrudateLength) / 2, 0]}
          scale={[1, 1, extrudateScale]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#888888"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      )}

      {/* ========== UI LABELS ========== */}
      {showLabels && (
        <>
          {/* Extrusion Mode Indicator */}
          <Html position={[0, 3, 0]} center>
            <div
              style={{
                background: isDirect
                  ? 'rgba(255, 68, 0, 0.9)'
                  : 'rgba(69, 162, 158, 0.9)',
                border: isDirect ? '2px solid #ff4400' : '2px solid #45a29e',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '2px',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {isDirect ? '⚡ DIRECT EXTRUSION' : '↩️ INDIRECT EXTRUSION'}
            </div>
          </Html>

          {/* Ram Force Display */}
          <Html position={[0, -3.5, 0]} center>
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
              Ram Force: {ramForce.toFixed(0)} MPa
            </div>
          </Html>

          {/* Progress Percentage */}
          <Html position={[2.5, 0, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: '1px solid #45a29e',
                color: '#45a29e',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
              }}
            >
              Progress: {activeProgress.toFixed(1)}%
            </div>
          </Html>

          {/* Friction Info */}
          <Html position={[-2.5, 0, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: isDirect ? '1px solid #ff4400' : '1px solid #45a29e',
                color: isDirect ? '#ff9966' : '#45a29e',
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {isDirect ? 'Wall Friction: HIGH 🔥' : 'Wall Friction: ZERO ✓'}
            </div>
          </Html>

          {/* Volume Conservation Info */}
          <Html position={[0, -2.8, 0]} center>
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
              Area Ratio: {areaRatio.toFixed(1)}× | V = A × L
            </div>
          </Html>
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={1.2} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />

      {/* Key lights from multiple angles */}
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[5, -3, 0]} intensity={1.5} color="#ffffff" />

      {/* Direct mode heat glow */}
      {isDirect && showHeat && (
        <pointLight
          position={[0, 0, 0]}
          intensity={normalizedProgress * 3}
          distance={6}
          decay={2}
          color="#ff4400"
        />
      )}

      {/* Spotlight on die */}
      <spotLight
        position={[0, -5, 3]}
        intensity={2.5}
        angle={0.5}
        penumbra={1}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[0, 5, 0]}
        intensity={2}
        angle={0.8}
        penumbra={1}
        color="#ffffff"
      />

      {/* Ground Grid */}
      <gridHelper args={[20, 20, '#45a29e', '#1f2833']} position={[0, -4, 0]} />

      {/* Platform */}
      <mesh position={[0, -4.2, 0]} receiveShadow>
        <boxGeometry args={[20, 0.4, 10]} />
        <meshStandardMaterial color="#1f2833" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* Support frame */}
      <group>
        {/* Vertical supports */}
        <mesh position={[billetRadius + 0.4, 0, billetRadius + 0.4]} castShadow>
          <boxGeometry args={[0.15, billetLength + 2, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[-billetRadius - 0.4, 0, billetRadius + 0.4]} castShadow>
          <boxGeometry args={[0.15, billetLength + 2, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[billetRadius + 0.4, 0, -billetRadius - 0.4]} castShadow>
          <boxGeometry args={[0.15, billetLength + 2, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[-billetRadius - 0.4, 0, -billetRadius - 0.4]} castShadow>
          <boxGeometry args={[0.15, billetLength + 2, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

export default ExtrusionPress;
