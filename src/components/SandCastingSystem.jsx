import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Particle system for molten metal splash effects
const MetalParticles = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = position[1] + Math.random() * 0.5;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.3;
    }
    return pos;
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] -= delta * 0.5; // Fall down
        if (positions[i * 3 + 1] < position[1] - 2) {
          positions[i * 3 + 1] = position[1] + Math.random() * 0.5;
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
        size={0.05}
        color="#ff6600"
        emissive="#ff6600"
        emissiveIntensity={2}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

// Steam particles for cooling phase
const SteamParticles = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 30;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 1;
      pos[i * 3 + 1] = position[1] + Math.random() * 0.5;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 1;
    }
    return pos;
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.3; // Rise up
        positions[i * 3] += (Math.random() - 0.5) * delta * 0.2; // Drift
        positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.2;

        if (positions[i * 3 + 1] > position[1] + 3) {
          positions[i * 3] = position[0] + (Math.random() - 0.5) * 1;
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
        size={0.1}
        color="#cccccc"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

const SandCastingSystem = () => {
  const metalGroupRef = useRef();
  const sprueRef = useRef();
  const runnerRef = useRef();
  const partRef = useRef();
  const riserRef = useRef();

  const [internalProgress, setInternalProgress] = useState(0);

  // Leva Controls
  const controls = useControls('Casting Controls', {
    processProgress: { value: 0, min: 0, max: 100, step: 0.1, label: 'Process Progress (%)' },
    sandOpacity: { value: 0.25, min: 0, max: 1, step: 0.05, label: 'Sand Opacity' },
    showLabels: { value: true, label: 'Show Labels' },
    autoPlay: { value: true, label: 'Auto Play' },
    playbackSpeed: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Playback Speed' },
    showParticles: { value: true, label: 'Show Particles' },
    reset: button(() => {
      setInternalProgress(0);
      controls.processProgress = 0;
    })
  });

  const { processProgress, sandOpacity, showLabels, autoPlay, playbackSpeed, showParticles } = controls;

  // Auto-play animation with proper timing
  useFrame((state, delta) => {
    if (autoPlay) {
      setInternalProgress((prev) => {
        const newProgress = prev + delta * playbackSpeed * 10;
        if (newProgress >= 100) {
          return 0; // Loop
        }
        return newProgress;
      });
    } else {
      setInternalProgress(processProgress);
    }

    // Gentle rotation of parts during pouring for visual interest
    if (partRef.current && pouringPhase > 0 && pouringPhase < 1) {
      partRef.current.rotation.y += delta * 0.2;
    }
  });

  // Use internal progress for smooth animation
  const activeProgress = autoPlay ? internalProgress : processProgress;

  // Calculate phases based on progress
  const pouringPhase = Math.min(activeProgress / 30, 1); // 0-30%
  const solidificationPhase = Math.max((activeProgress - 30) / 70, 0); // 30-100%

  // Clipping plane for pouring animation
  const clippingPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  }, []);

  // Update clipping plane based on pouring phase
  useFrame(() => {
    if (pouringPhase < 1) {
      // Metal rises from bottom (-3) to top (4)
      const fillHeight = -3 + pouringPhase * 7;
      clippingPlane.constant = fillHeight;
    } else {
      clippingPlane.constant = 4; // Fully filled
    }
  });

  // Material definitions with cooling rates (Chvorinov's Rule)
  const getMaterialColor = (baseTemp, coolRate) => {
    // Thin parts cool faster (high coolRate), thick parts cool slower (low coolRate)
    const coolingProgress = Math.min(solidificationPhase * coolRate, 1);

    // Lerp from molten (red/orange) to solid (grey)
    const moltenColor = new THREE.Color(0xff6600);
    const solidColor = new THREE.Color(0x555555);

    return moltenColor.lerp(solidColor, coolingProgress);
  };

  const getEmissiveIntensity = (coolRate) => {
    const coolingProgress = Math.min(solidificationPhase * coolRate, 1);
    return (1 - coolingProgress) * 2; // Bright when molten, dim when solid
  };

  // Cooling rates based on volume/surface area ratio
  const COOL_RATE_SPRUE = 2.5;    // Thin, cools fastest
  const COOL_RATE_RUNNER = 2.0;    // Thin, cools fast
  const COOL_RATE_PART = 0.5;      // Thick TorusKnot, cools slowest
  const COOL_RATE_RISER = 0.8;     // Medium thickness

  return (
    <group>
      {/* ========== FLASK (Sand Mold Container) ========== */}
      <group name="flask">
        {/* Cope (Top Half) - Wireframe */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[6, 3, 4]} />
          <meshBasicMaterial
            color="#C2B280"
            wireframe
            opacity={sandOpacity * 0.5}
            transparent
          />
        </mesh>

        {/* Drag (Bottom Half) - Wireframe */}
        <mesh position={[0, -1.5, 0]}>
          <boxGeometry args={[6, 3, 4]} />
          <meshBasicMaterial
            color="#C2B280"
            wireframe
            opacity={sandOpacity * 0.5}
            transparent
          />
        </mesh>

        {/* Sand Mold Walls (Solid but transparent) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 6, 4]} />
          <meshStandardMaterial
            color="#C2B280"
            opacity={sandOpacity}
            transparent
            roughness={1}
            metalness={0}
          />
        </mesh>
      </group>

      {/* ========== METAL (The Casting) ========== */}
      <group ref={metalGroupRef} name="metal">
        {/* Sprue - Tapered vertical cylinder */}
        <mesh ref={sprueRef} position={[-2, 0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 6, 16]} />
          <meshStandardMaterial
            color={getMaterialColor(1, COOL_RATE_SPRUE)}
            emissive={getMaterialColor(1, COOL_RATE_SPRUE)}
            emissiveIntensity={getEmissiveIntensity(COOL_RATE_SPRUE)}
            metalness={solidificationPhase * 0.9}
            roughness={0.3 + solidificationPhase * 0.5}
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>

        {/* Runner - Horizontal channel */}
        <mesh ref={runnerRef} position={[0, -2.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[5, 0.4, 0.4]} />
          <meshStandardMaterial
            color={getMaterialColor(1, COOL_RATE_RUNNER)}
            emissive={getMaterialColor(1, COOL_RATE_RUNNER)}
            emissiveIntensity={getEmissiveIntensity(COOL_RATE_RUNNER)}
            metalness={solidificationPhase * 0.9}
            roughness={0.3 + solidificationPhase * 0.5}
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>

        {/* The Part - TorusKnot (Complex Industrial Part) */}
        <mesh ref={partRef} position={[1.5, 0, 0]} scale={0.8}>
          <torusKnotGeometry args={[1, 0.3, 128, 16]} />
          <meshStandardMaterial
            color={getMaterialColor(1, COOL_RATE_PART)}
            emissive={getMaterialColor(1, COOL_RATE_PART)}
            emissiveIntensity={getEmissiveIntensity(COOL_RATE_PART)}
            metalness={solidificationPhase * 0.9}
            roughness={0.3 + solidificationPhase * 0.5}
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>

        {/* Riser - Vertical cylinder (Shrinkage compensation) */}
        <mesh ref={riserRef} position={[1.5, 2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
          <meshStandardMaterial
            color={getMaterialColor(1, COOL_RATE_RISER)}
            emissive={getMaterialColor(1, COOL_RATE_RISER)}
            emissiveIntensity={getEmissiveIntensity(COOL_RATE_RISER)}
            metalness={solidificationPhase * 0.9}
            roughness={0.3 + solidificationPhase * 0.5}
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>

        {/* Pouring Basin (Cup at top of sprue) */}
        <mesh position={[-2, 3.2, 0]}>
          <cylinderGeometry args={[0.6, 0.4, 0.4, 16]} />
          <meshStandardMaterial
            color={getMaterialColor(1, COOL_RATE_SPRUE)}
            emissive={getMaterialColor(1, COOL_RATE_SPRUE)}
            emissiveIntensity={getEmissiveIntensity(COOL_RATE_SPRUE)}
            metalness={solidificationPhase * 0.9}
            roughness={0.3 + solidificationPhase * 0.5}
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>
      </group>

      {/* ========== LABELS ========== */}
      {showLabels && (
        <>
          <Html position={[-2, 4, 0]} center>
            <div style={{
              background: 'rgba(102, 252, 241, 0.9)',
              color: '#0b0c10',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
            }}>
              Pouring Basin
            </div>
          </Html>

          <Html position={[-2, 0, 1.5]} center>
            <div style={{
              background: 'rgba(102, 252, 241, 0.9)',
              color: '#0b0c10',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
            }}>
              Sprue
            </div>
          </Html>

          <Html position={[0, -2.8, 1.5]} center>
            <div style={{
              background: 'rgba(102, 252, 241, 0.9)',
              color: '#0b0c10',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
            }}>
              Runner
            </div>
          </Html>

          <Html position={[1.5, 0, 1.5]} center>
            <div style={{
              background: 'rgba(255, 204, 0, 0.9)',
              color: '#0b0c10',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
            }}>
              Casting (Part)
            </div>
          </Html>

          <Html position={[1.5, 3.2, 0]} center>
            <div style={{
              background: 'rgba(102, 252, 241, 0.9)',
              color: '#0b0c10',
              padding: '4px 8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
            }}>
              Riser
            </div>
          </Html>
        </>
      )}

      {/* ========== PARTICLE EFFECTS ========== */}
      {showParticles && (
        <>
          {/* Pouring splash particles */}
          <MetalParticles
            active={pouringPhase > 0.1 && pouringPhase < 0.9}
            position={[-2, 3, 0]}
          />

          {/* Steam during solidification */}
          <SteamParticles
            active={solidificationPhase > 0.2 && solidificationPhase < 0.8}
            position={[0, 0, 0]}
          />
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#66fcf1" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffcc00" />

      {/* Dynamic pouring spotlight */}
      <spotLight
        position={[0, 8, 0]}
        intensity={pouringPhase * 3}
        angle={0.4}
        penumbra={1}
        color="#ff6600"
        castShadow
      />

      {/* Glow from molten metal */}
      {pouringPhase > 0 && (
        <pointLight
          position={[-2, 0, 0]}
          intensity={(1 - solidificationPhase) * 2}
          distance={8}
          decay={2}
          color="#ff6600"
        />
      )}

      {/* Part glow during solidification */}
      {solidificationPhase > 0 && solidificationPhase < 1 && (
        <pointLight
          position={[1.5, 0, 0]}
          intensity={(1 - solidificationPhase) * 1.5}
          distance={6}
          decay={2}
          color="#ff3300"
        />
      )}

      {/* Ground Grid */}
      <gridHelper args={[20, 20, '#45a29e', '#1f2833']} position={[0, -4, 0]} />

      {/* Progress indicator on ground */}
      {showLabels && (
        <Html position={[0, -4.5, 3]} center>
          <div style={{
            background: 'rgba(11, 12, 16, 0.9)',
            border: '1px solid #66fcf1',
            color: '#66fcf1',
            padding: '8px 16px',
            borderRadius: '2px',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'Rajdhani, monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            {pouringPhase < 1 ? `Pouring: ${Math.round(pouringPhase * 100)}%` :
             solidificationPhase < 1 ? `Cooling: ${Math.round(solidificationPhase * 100)}%` :
             'Complete'}
          </div>
        </Html>
      )}
    </group>
  );
};

export default SandCastingSystem;
