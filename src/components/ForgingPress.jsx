import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Impact sparks when hammer strikes
const ImpactSparks = ({ active, position, intensity }) => {
  const particlesRef = useRef();
  const particleCount = 150;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.8;
      const height = Math.random() * 0.3;
      pos[i * 3] = position[0] + Math.cos(angle) * radius;
      pos[i * 3 + 1] = position[1] + height;
      pos[i * 3 + 2] = position[2] + Math.sin(angle) * radius;
    }
    return pos;
  }, [position, active]); // Re-create when active changes

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Expand outward and fall
        const angle = Math.atan2(positions[i * 3 + 2] - position[2], positions[i * 3] - position[0]);
        positions[i * 3] += Math.cos(angle) * delta * 2;
        positions[i * 3 + 1] -= delta * 3;
        positions[i * 3 + 2] += Math.sin(angle) * delta * 2;

        if (positions[i * 3 + 1] < position[1] - 1) {
          const newAngle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.3;
          positions[i * 3] = position[0] + Math.cos(newAngle) * radius;
          positions[i * 3 + 1] = position[1] + Math.random() * 0.3;
          positions[i * 3 + 2] = position[2] + Math.sin(newAngle) * radius;
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
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Custom geometry for barrelled cylinder (Open Die effect)
const BarrelledCylinder = ({ compression, radiusTop, radiusBottom, height, radialSegments }) => {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position;

    // Store original positions on first render
    if (!geometry.userData.originalPositions) {
      geometry.userData.originalPositions = positionAttribute.array.slice();
    }

    const originalPositions = geometry.userData.originalPositions;
    const positions = positionAttribute.array;

    // Calculate barrelling - middle bulges more due to friction at top/bottom
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const y = originalPositions[i + 1];
      const z = originalPositions[i + 2];

      // Normalized height (-1 to 1)
      const normalizedY = y / (height / 2);

      // Barrelling factor: middle (y=0) expands more, top/bottom less
      const barrelFactor = 1 - Math.abs(normalizedY);
      const expansionDueToBarrel = compression * barrelFactor * 0.3;

      // Calculate radial distance from center
      const distance = Math.sqrt(x * x + z * z);
      if (distance > 0.001) {
        const angle = Math.atan2(z, x);
        const newRadius = distance * (1 + expansionDueToBarrel);

        positions[i] = Math.cos(angle) * newRadius;
        positions[i + 2] = Math.sin(angle) * newRadius;
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [compression, height]);

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, radialSegments, 20]} />
      <meshStandardMaterial
        color="#ff6600"
        emissive="#ff3300"
        emissiveIntensity={0.5}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  );
};

const ForgingPress = () => {
  const ramRef = useRef();
  const workpieceRef = useRef();
  const flashRingRef = useRef();
  const finishedPartRef = useRef();

  const [lastCompression, setLastCompression] = useState(0);
  const [showImpact, setShowImpact] = useState(false);
  const [impactKey, setImpactKey] = useState(0);

  // Leva controls
  const controls = useControls('Forging Controls', {
    forgingMode: {
      value: 'Open Die',
      options: ['Open Die', 'Closed Die'],
      label: 'Forging Mode'
    },
    compression: { value: 0, min: 0, max: 1, step: 0.01, label: 'Compression' },
    autoForge: { value: false, label: 'Auto Forge' },
    forgeSpeed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Forge Speed' },
    showGrainStructure: { value: false, label: 'Show Grain Flow' },
    temperature: { value: 1200, min: 20, max: 1400, step: 10, label: 'Temp (°C)' },
    reset: button(() => {
      controls.compression = 0;
    })
  });

  const { forgingMode, compression, autoForge, forgeSpeed, showGrainStructure, temperature } = controls;

  // Auto-forge animation
  useFrame((state, delta) => {
    if (autoForge) {
      const newCompression = (Math.sin(state.clock.elapsedTime * forgeSpeed) + 1) / 2;
      controls.compression = newCompression;

      // Detect impact (compression increasing and > 0.9)
      if (newCompression > 0.85 && newCompression > lastCompression) {
        if (!showImpact) {
          setShowImpact(true);
          setImpactKey(prev => prev + 1);
          setTimeout(() => setShowImpact(false), 300);
        }
      }
      setLastCompression(newCompression);
    }

    // Update ram position
    if (ramRef.current) {
      ramRef.current.position.y = 3 - compression * 2;
    }
  });

  // Calculate workpiece deformation (Volume Conservation)
  // V = π * r² * h  =>  r = sqrt(V₀ / (π * h))
  const originalHeight = 2.0;
  const originalRadius = 0.5;
  const originalVolume = Math.PI * originalRadius * originalRadius * originalHeight;

  const currentHeight = originalHeight * (1 - compression * 0.7); // Max 70% compression
  const currentRadius = Math.sqrt(originalVolume / (Math.PI * currentHeight));
  const radialExpansion = currentRadius / originalRadius;

  // Temperature-based color
  const getTemperatureColor = (temp) => {
    if (temp > 1000) return new THREE.Color(0xff6600); // Yellow-orange (hot)
    if (temp > 500) return new THREE.Color(0xff3300);  // Orange-red
    return new THREE.Color(0x555555); // Grey (cold)
  };

  const tempColor = getTemperatureColor(temperature);

  // Flash visibility and size (Closed Die only)
  const flashVisible = forgingMode === 'Closed Die' && compression > 0.95;
  const flashScale = compression > 0.95 ? (compression - 0.95) * 20 : 0;

  return (
    <group>
      {/* ========== BASE / ANVIL ========== */}
      <group position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[3, 1, 3]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
        </mesh>
        <Html position={[0, -0.7, 1.8]} center>
          <div style={{
            background: 'rgba(102, 252, 241, 0.9)',
            color: '#0b0c10',
            padding: '4px 8px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'Rajdhani, sans-serif',
            textTransform: 'uppercase',
          }}>
            Anvil
          </div>
        </Html>
      </group>

      {/* ========== LOWER DIE (for Closed Die mode) ========== */}
      {forgingMode === 'Closed Die' && (
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 32]} />
          <meshStandardMaterial
            color="#333333"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* ========== WORKPIECE ========== */}
      {forgingMode === 'Open Die' ? (
        // Open Die: Barrelling effect
        <group
          ref={workpieceRef}
          position={[0, 0.5 + currentHeight / 2, 0]}
          scale={[radialExpansion, 1 - compression * 0.7, radialExpansion]}
        >
          <BarrelledCylinder
            compression={compression}
            radiusTop={originalRadius}
            radiusBottom={originalRadius}
            height={originalHeight}
            radialSegments={32}
          />

          {/* Grain structure lines (if enabled) */}
          {showGrainStructure && (
            <lineSegments>
              <edgesGeometry
                attach="geometry"
                args={[new THREE.CylinderGeometry(originalRadius, originalRadius, originalHeight, 32, 8)]}
              />
              <lineBasicMaterial attach="material" color="#ffff00" linewidth={2} />
            </lineSegments>
          )}
        </group>
      ) : (
        // Closed Die: Flash formation
        <group position={[0, 0.6, 0]}>
          {/* Rough billet (shrinks) */}
          <mesh
            ref={workpieceRef}
            visible={compression < 0.9}
            scale={[1 + compression * 0.2, 1 - compression * 0.8, 1 + compression * 0.2]}
          >
            <cylinderGeometry args={[0.6, 0.6, 1.5, 32]} />
            <meshStandardMaterial
              color={tempColor}
              emissive={tempColor}
              emissiveIntensity={temperature > 800 ? 0.6 : 0}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Finished part (gear shape - appears as die closes) */}
          <mesh
            ref={finishedPartRef}
            visible={compression > 0.5}
            scale={[compression * 0.8, compression * 0.6, compression * 0.8]}
          >
            <cylinderGeometry args={[0.7, 0.7, 1.0, 8]} /> {/* Octagon simulates gear */}
            <meshStandardMaterial
              color={tempColor}
              emissive={tempColor}
              emissiveIntensity={temperature > 800 ? 0.5 : 0}
              metalness={0.9}
              roughness={0.1}
            />

            {/* Grain flow lines (follows part shape) */}
            {showGrainStructure && (
              <lineSegments>
                <edgesGeometry
                  attach="geometry"
                  args={[new THREE.CylinderGeometry(0.7, 0.7, 1.0, 8, 4)]}
                />
                <lineBasicMaterial attach="material" color="#ffff00" linewidth={2} />
              </lineSegments>
            )}
          </mesh>

          {/* FLASH (excess metal squeezing out) */}
          <mesh
            ref={flashRingRef}
            visible={flashVisible}
            position={[0, 0, 0]}
            scale={[flashScale, 0.5, flashScale]}
          >
            <torusGeometry args={[0.8, 0.08, 8, 16]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff6600"
              emissiveIntensity={1}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {flashVisible && (
            <Html position={[1.2, 0, 0]} center>
              <div style={{
                background: 'rgba(255, 204, 0, 0.9)',
                color: '#0b0c10',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, sans-serif',
                textTransform: 'uppercase',
              }}>
                Flash!
              </div>
            </Html>
          )}
        </group>
      )}

      {/* ========== RAM / HAMMER ========== */}
      <group ref={ramRef} position={[0, 3, 0]}>
        {/* Ram body */}
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.8, 2.5]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Hydraulic cylinder */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Upper die (for Closed Die mode) */}
        {forgingMode === 'Closed Die' && (
          <mesh position={[0, -0.7, 0]} castShadow>
            <cylinderGeometry args={[0.75, 0.75, 0.6, 8]} /> {/* Octagon matches lower die */}
            <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
          </mesh>
        )}

        <Html position={[0, 2, 1.5]} center>
          <div style={{
            background: 'rgba(102, 252, 241, 0.9)',
            color: '#0b0c10',
            padding: '4px 8px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'Rajdhani, sans-serif',
            textTransform: 'uppercase',
          }}>
            Ram
          </div>
        </Html>
      </group>

      {/* ========== IMPACT EFFECTS ========== */}
      {compression > 0.8 && (
        <>
          <ImpactSparks
            active={showImpact}
            key={impactKey}
            position={[0, 0.5, 0]}
            intensity={compression}
          />

          <Sparkles
            count={30}
            scale={2}
            size={3}
            speed={0.6}
            opacity={0.8}
            color="#ffaa00"
            position={[0, 0.5, 0]}
          />
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={1.2} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />

      {/* Key lights from multiple angles */}
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, -5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[5, 3, 0]} intensity={1.5} color="#ffffff" />

      <directionalLight
        position={[0, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Heat glow from hot workpiece */}
      {temperature > 800 && (
        <pointLight
          position={[0, 0.8, 0]}
          intensity={(temperature - 800) / 600 * 3}
          distance={3}
          decay={2}
          color="#ff6600"
        />
      )}

      {/* ========== GROUND ========== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0b0c10" />
      </mesh>

      <gridHelper args={[20, 20, '#45a29e', '#1f2833']} position={[0, -1, 0]} />

      {/* ========== STATUS DISPLAY ========== */}
      <Html position={[0, -1.5, 3.5]} center>
        <div style={{
          background: 'rgba(11, 12, 16, 0.9)',
          border: '1px solid #66fcf1',
          color: '#66fcf1',
          padding: '12px 20px',
          borderRadius: '2px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'Rajdhani, monospace',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          minWidth: '300px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '6px' }}>
            {forgingMode} Forging
          </div>
          <div style={{ fontSize: '12px', color: '#45a29e', marginBottom: '4px' }}>
            Compression: {(compression * 100).toFixed(0)}% | Temp: {temperature}°C
          </div>
          <div style={{ fontSize: '11px', color: '#c5c6c7' }}>
            {forgingMode === 'Open Die'
              ? `Height: ${currentHeight.toFixed(2)}m | Radius: ${currentRadius.toFixed(2)}m`
              : compression > 0.95
              ? 'Flash Forming!'
              : 'Die Filling...'}
          </div>
        </div>
      </Html>
    </group>
  );
};

export default ForgingPress;
