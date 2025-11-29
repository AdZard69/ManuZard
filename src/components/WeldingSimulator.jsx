import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// Arc sparks particle system
const ArcSparks = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.3;
      pos[i * 3] = position[0] + Math.cos(angle) * radius;
      pos[i * 3 + 1] = position[1] + Math.random() * 0.5;
      pos[i * 3 + 2] = position[2] + Math.sin(angle) * radius;
    }
    return pos;
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Fall and spread
        positions[i * 3 + 1] -= delta * 2;
        positions[i * 3] += (Math.random() - 0.5) * delta * 0.5;
        positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.5;

        if (positions[i * 3 + 1] < position[1] - 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.3;
          positions[i * 3] = position[0] + Math.cos(angle) * radius;
          positions[i * 3 + 1] = position[1] + Math.random() * 0.3;
          positions[i * 3 + 2] = position[2] + Math.sin(angle) * radius;
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
        emissive="#ffaa00"
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Smoke particles
const WeldSmoke = ({ active, position }) => {
  const particlesRef = useRef();
  const particleCount = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = position[1] + Math.random() * 0.3;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.2;
    }
    return pos;
  }, [position]);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.5;
        positions[i * 3] += (Math.random() - 0.5) * delta * 0.1;
        positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.1;

        if (positions[i * 3 + 1] > position[1] + 2) {
          positions[i * 3] = position[0] + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = position[1];
          positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.2;
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
        color="#555555"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

const WeldingSimulator = () => {
  const { camera, raycaster, pointer } = useThree();

  const workplateRef = useRef();
  const torchRef = useRef();
  const fillerRodRef = useRef();
  const weldBeadRef = useRef();
  const arcLightRef = useRef();

  const [isWelding, setIsWelding] = useState(false);
  const [torchPosition, setTorchPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [weldBeads, setWeldBeads] = useState([]);
  const [lastWeldTime, setLastWeldTime] = useState(0);
  const [lastPosition, setLastPosition] = useState(new THREE.Vector3());
  const [fillerDipPhase, setFillerDipPhase] = useState(0);

  // Leva controls
  const controls = useControls('Welding Controls', {
    weldMode: {
      value: 'MIG',
      options: ['MIG', 'TIG'],
      label: 'Welding Mode'
    },
    arcIntensity: { value: 2.5, min: 0, max: 5, step: 0.1, label: 'Arc Intensity' },
    weldSpeed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Recommended Speed' },
    showHAZ: { value: true, label: 'Show Heat Zone' },
    showParticles: { value: true, label: 'Show Particles' },
    autoWeld: { value: false, label: 'Auto Weld Demo' },
    clearBeads: button(() => {
      setWeldBeads([]);
    })
  });

  const { weldMode, arcIntensity, weldSpeed, showHAZ, showParticles, autoWeld } = controls;

  // Maximum weld beads to prevent performance issues
  const MAX_BEADS = 500;

  // Mouse interaction for welding
  useFrame((state, delta) => {
    if (!workplateRef.current) return;

    // Update torch position based on mouse
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(workplateRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const newPosition = new THREE.Vector3(point.x, 0.5, point.z);
      setTorchPosition(newPosition);

      if (torchRef.current) {
        torchRef.current.position.set(point.x, 0.5, point.z);
      }
    }

    // Auto-weld demo mode
    if (autoWeld && !isWelding) {
      const time = state.clock.elapsedTime;
      const x = Math.sin(time * 0.5) * 2;
      const z = Math.cos(time * 0.3) * 1.5;
      const demoPosition = new THREE.Vector3(x, 0.5, z);
      setTorchPosition(demoPosition);
      if (torchRef.current) {
        torchRef.current.position.copy(demoPosition);
      }

      // Create weld beads automatically
      if (time - lastWeldTime > 0.05) {
        addWeldBead(demoPosition, 1.0);
        setLastWeldTime(time);
      }
    }

    // TIG mode: animate filler rod dipping
    if (weldMode === 'TIG' && fillerRodRef.current) {
      if (isWelding || autoWeld) {
        setFillerDipPhase((prev) => (prev + delta * 4) % (Math.PI * 2));
        const dipAmount = Math.sin(fillerDipPhase) * 0.15 + 0.15;
        fillerRodRef.current.position.y = torchPosition.y - dipAmount;
      } else {
        fillerRodRef.current.position.y = torchPosition.y + 0.3;
      }
      fillerRodRef.current.position.x = torchPosition.x + 0.2;
      fillerRodRef.current.position.z = torchPosition.z;
    }

    // Update arc light flicker
    if (arcLightRef.current && (isWelding || autoWeld)) {
      arcLightRef.current.intensity = arcIntensity + Math.random() * 0.5;
    }

    // Cool down weld beads
    setWeldBeads((prev) =>
      prev.map((bead) => ({
        ...bead,
        temperature: Math.max(0, bead.temperature - delta * 0.3)
      }))
    );
  });

  // Add weld bead with defect detection
  const addWeldBead = useCallback((position, speed) => {
    if (weldBeads.length >= MAX_BEADS) {
      setWeldBeads((prev) => prev.slice(1));
    }

    const distance = position.distanceTo(lastPosition);
    const optimalDistance = 0.1 * weldSpeed;

    let beadSize, beadQuality;

    if (distance < optimalDistance * 0.5) {
      // Too slow - burn through (large blob)
      beadSize = 0.15;
      beadQuality = 'burn-through';
    } else if (distance > optimalDistance * 2) {
      // Too fast - undercut (small, disconnected)
      beadSize = 0.05;
      beadQuality = 'undercut';
    } else {
      // Optimal
      beadSize = 0.1;
      beadQuality = 'good';
    }

    const newBead = {
      position: position.clone(),
      size: beadSize,
      temperature: 1.0,
      quality: beadQuality,
      id: Math.random()
    };

    setWeldBeads((prev) => [...prev, newBead]);
    setLastPosition(position.clone());
  }, [weldBeads.length, lastPosition, weldSpeed]);

  // Handle mouse down/up for welding
  const handlePointerDown = useCallback(() => {
    if (!autoWeld) {
      setIsWelding(true);
      setLastPosition(torchPosition.clone());
    }
  }, [autoWeld, torchPosition]);

  const handlePointerUp = useCallback(() => {
    setIsWelding(false);
  }, []);

  // Handle pointer move for creating beads
  const handlePointerMove = useCallback(() => {
    if (isWelding && Date.now() - lastWeldTime > 50) {
      addWeldBead(torchPosition, 1.0);
      setLastWeldTime(Date.now());
    }
  }, [isWelding, torchPosition, lastWeldTime, addWeldBead]);

  return (
    <group>
      {/* ========== WORKBENCH ========== */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[8, 0.2, 6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* ========== WORKPLATE (The metal being welded) ========== */}
      <mesh
        ref={workplateRef}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial
          color="#8a8a8a"
          metalness={0.9}
          roughness={0.2}
          emissive={showHAZ && (isWelding || autoWeld) ? "#ff3300" : "#000000"}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* ========== WELDING TORCH ========== */}
      <group ref={torchRef} position={[torchPosition.x, torchPosition.y, torchPosition.z]}>
        {/* Torch body */}
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Torch nozzle */}
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* MIG wire */}
        {weldMode === 'MIG' && (
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.1, 6]} />
            <meshStandardMaterial
              color="#cccccc"
              metalness={1}
              roughness={0}
              emissive={(isWelding || autoWeld) ? "#ff6600" : "#000000"}
              emissiveIntensity={0.5}
            />
          </mesh>
        )}

        {/* TIG tungsten electrode */}
        {weldMode === 'TIG' && (
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.003, 0.001, 0.08, 6]} />
            <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
          </mesh>
        )}

        {/* Arc cone (visible when welding) */}
        {(isWelding || autoWeld) && (
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.1, 0.15, 8, 1, true]} />
            <meshBasicMaterial
              color="#aaddff"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </group>

      {/* ========== TIG FILLER ROD ========== */}
      {weldMode === 'TIG' && (
        <mesh
          ref={fillerRodRef}
          position={[torchPosition.x + 0.2, torchPosition.y + 0.3, torchPosition.z]}
          rotation={[0, 0, -Math.PI / 4]}
          castShadow
        >
          <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
          <meshStandardMaterial color="#999999" metalness={0.9} roughness={0.2} />
        </mesh>
      )}

      {/* ========== WELD BEADS (Instanced) ========== */}
      {weldBeads.map((bead) => {
        const temperature = bead.temperature;
        const color = new THREE.Color().lerpColors(
          new THREE.Color(0x555555), // Cold
          new THREE.Color(0xff6600), // Hot
          temperature
        );

        return (
          <mesh key={bead.id} position={[bead.position.x, 0.01, bead.position.z]}>
            <sphereGeometry args={[bead.size, 8, 6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={temperature * 2}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        );
      })}

      {/* ========== ARC LIGHT ========== */}
      {(isWelding || autoWeld) && (
        <pointLight
          ref={arcLightRef}
          position={[torchPosition.x, torchPosition.y - 0.1, torchPosition.z]}
          intensity={arcIntensity}
          distance={3}
          decay={2}
          color="#aaddff"
          castShadow
        />
      )}

      {/* ========== PARTICLE EFFECTS ========== */}
      {showParticles && (
        <>
          <ArcSparks
            active={isWelding || autoWeld}
            position={[torchPosition.x, 0, torchPosition.z]}
          />
          <WeldSmoke
            active={isWelding || autoWeld}
            position={[torchPosition.x, 0, torchPosition.z]}
          />
        </>
      )}

      {/* ========== SPARKLES EFFECT ========== */}
      {showParticles && (isWelding || autoWeld) && (
        <Sparkles
          count={20}
          scale={0.5}
          size={2}
          speed={0.4}
          opacity={0.6}
          color="#ffaa00"
          position={[torchPosition.x, 0.1, torchPosition.z]}
        />
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#66fcf1" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffcc00" />
      <directionalLight
        position={[0, 10, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* ========== GROUND GRID ========== */}
      <gridHelper args={[20, 20, '#45a29e', '#1f2833']} position={[0, -0.51, 0]} />

      {/* ========== STATUS DISPLAY ========== */}
      <Html position={[0, -1, 3]} center>
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
          minWidth: '200px',
          textAlign: 'center'
        }}>
          <div>Mode: {weldMode} Welding</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#45a29e' }}>
            {isWelding ? 'WELDING ACTIVE' : autoWeld ? 'AUTO DEMO' : 'Click & Drag to Weld'}
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#c5c6c7' }}>
            Beads: {weldBeads.length} | Good: {weldBeads.filter(b => b.quality === 'good').length}
          </div>
        </div>
      </Html>
    </group>
  );
};

export default WeldingSimulator;
