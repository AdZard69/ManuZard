import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

const ThreeDPrinter = () => {
  const modelRef = useRef();
  const nozzleRef = useRef();
  const laserRef = useRef();
  const rollerRef = useRef();

  const [printProgress, setPrintProgress] = useState(0);
  const [nozzleAngle, setNozzleAngle] = useState(0);
  const [rollerPosition, setRollerPosition] = useState(-2);

  // Leva Controls
  const controls = useControls('3D Printer Controls', {
    mode: {
      value: 'FDM',
      options: ['FDM', 'SLA', 'SLS', 'Metal'],
      label: 'Print Technology',
    },
    progress: { value: 0, min: 0, max: 100, step: 0.1, label: 'Print Progress (%)' },
    showSupports: { value: true, label: 'Show Support Structures' },
    showLabels: { value: true, label: 'Show Labels' },
    autoRun: { value: true, label: 'Auto Print' },
    speed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
    reset: button(() => {
      setPrintProgress(0);
    }),
  });

  const { mode, progress, showSupports, showLabels, autoRun, speed } = controls;

  const isFDM = mode === 'FDM';
  const isSLA = mode === 'SLA';
  const isSLS = mode === 'SLS';
  const isMetal = mode === 'Metal';

  // Auto-run animation
  useFrame((state, delta) => {
    if (autoRun) {
      setPrintProgress((prev) => {
        const newProgress = prev + delta * speed * 8;
        if (newProgress >= 100) return 0; // Loop
        return newProgress;
      });
    } else {
      setPrintProgress(progress);
    }

    // FDM nozzle movement (circular pattern)
    if (isFDM && nozzleRef.current) {
      setNozzleAngle((prev) => prev + delta * 5);
      const radius = 0.3;
      nozzleRef.current.position.x = Math.cos(nozzleAngle) * radius;
      nozzleRef.current.position.z = Math.sin(nozzleAngle) * radius;
    }

    // SLS/Metal roller sweeping
    if ((isSLS || isMetal) && rollerRef.current) {
      const layerIncrement = Math.floor(activeProgress / 5) % 2; // Every 5%
      if (layerIncrement === 1) {
        setRollerPosition((prev) => {
          const newPos = prev + delta * 2;
          if (newPos > 2) return -2;
          return newPos;
        });
      }
    }
  });

  const activeProgress = autoRun ? printProgress : progress;
  const normalizedProgress = activeProgress / 100;

  // Model dimensions
  const modelHeight = 3;
  const currentHeight = normalizedProgress * modelHeight;

  // Clipping plane
  const clippingPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  }, []);

  // Update clipping plane
  useFrame(() => {
    if (isSLA) {
      // SLA: Model rises, clipping plane stays at liquid surface
      clippingPlane.constant = 0.5; // Liquid surface
    } else {
      // FDM/SLS/Metal: Clipping plane rises
      clippingPlane.constant = currentHeight - modelHeight / 2;
    }
  });

  // Model position (SLA rises)
  const modelPosition = isSLA ? [0, currentHeight - modelHeight / 2, 0] : [0, 0, 0];

  // Support structures
  const supportStructures = useMemo(() => {
    const supports = [];
    if (showSupports && (isFDM || isSLA)) {
      const positions = [
        [-0.8, -1.5, -0.8],
        [0.8, -1.5, -0.8],
        [-0.8, -1.5, 0.8],
        [0.8, -1.5, 0.8],
      ];
      positions.forEach((pos, idx) => {
        supports.push(
          <mesh key={idx} position={pos}>
            <cylinderGeometry args={[0.05, 0.05, modelHeight, 8]} />
            <meshStandardMaterial color="#ffcc00" metalness={0.5} roughness={0.6} />
          </mesh>
        );
      });
    }
    return supports;
  }, [showSupports, isFDM, isSLA, modelHeight]);

  // Material based on mode
  const modelMaterial = useMemo(() => {
    if (isFDM) {
      // FDM: Layer lines (rough texture)
      return (
        <meshStandardMaterial
          color="#ff6600"
          metalness={0.3}
          roughness={0.8}
          clippingPlanes={[clippingPlane]}
        />
      );
    } else if (isSLA) {
      // SLA: Smooth, glossy resin
      return (
        <meshStandardMaterial
          color="#4488ff"
          metalness={0.1}
          roughness={0.1}
          clippingPlanes={[clippingPlane]}
          transparent
          opacity={0.95}
        />
      );
    } else {
      // SLS/Metal: Grainy powder texture
      return (
        <meshStandardMaterial
          color={isMetal ? '#888888' : '#ccaa88'}
          metalness={isMetal ? 0.9 : 0.4}
          roughness={isMetal ? 0.3 : 0.7}
          clippingPlanes={[clippingPlane]}
        />
      );
    }
  }, [mode, clippingPlane, isFDM, isSLA, isMetal]);

  return (
    <group>
      {/* ========== PRINT MODEL (TorusKnot) ========== */}
      <mesh ref={modelRef} position={modelPosition} castShadow>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        {modelMaterial}
      </mesh>

      {/* ========== SUPPORT STRUCTURES ========== */}
      {supportStructures}

      {/* ========== FDM MODE ========== */}
      {isFDM && (
        <group>
          {/* Print nozzle */}
          <mesh
            ref={nozzleRef}
            position={[0, currentHeight + 0.3, 0]}
            castShadow
          >
            <coneGeometry args={[0.15, 0.5, 16]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1.5} />
          </mesh>

          {/* Nozzle holder */}
          <mesh position={[0, currentHeight + 0.8, 0]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Extruder gantry */}
          <mesh position={[0, currentHeight + 1.2, 0]}>
            <boxGeometry args={[3, 0.2, 0.2]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
          </mesh>

          {/* Vertical rods */}
          <mesh position={[1.5, 0.5, -1.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 4, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-1.5, 0.5, -1.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 4, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* ========== SLA MODE ========== */}
      {isSLA && (
        <group>
          {/* Resin vat (transparent blue) */}
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[3, 1, 3]} />
            <meshPhysicalMaterial
              color="#0066ff"
              transparent
              opacity={0.3}
              metalness={0.0}
              roughness={0.1}
              transmission={0.9}
            />
          </mesh>

          {/* Liquid surface */}
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.8, 2.8]} />
            <meshStandardMaterial
              color="#0088ff"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* UV laser (green line) */}
          {normalizedProgress > 0.05 && (
            <mesh ref={laserRef} position={[0, -0.8, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
              <meshStandardMaterial
                color="#00ff00"
                emissive="#00ff00"
                emissiveIntensity={3}
                transparent
                opacity={0.8}
              />
            </mesh>
          )}

          {/* Build platform (rising) */}
          <mesh position={[0, currentHeight + 0.2, 0]} castShadow>
            <boxGeometry args={[2.5, 0.2, 2.5]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Z-axis rod */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* ========== SLS/METAL MODE ========== */}
      {(isSLS || isMetal) && (
        <group>
          {/* Powder bed */}
          <mesh position={[0, -1.8, 0]}>
            <boxGeometry args={[3, 0.4, 3]} />
            <meshStandardMaterial color="#998877" metalness={0.2} roughness={0.9} />
          </mesh>

          {/* Powder layer (textured) */}
          <mesh position={[0, currentHeight - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.8, 2.8, 64, 64]} />
            <meshStandardMaterial
              color={isMetal ? '#666666' : '#aa9988'}
              metalness={isMetal ? 0.6 : 0.3}
              roughness={0.8}
            />
          </mesh>

          {/* Roller (powder spreader) */}
          <mesh
            ref={rollerRef}
            position={[rollerPosition, currentHeight + 0.3, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.15, 0.15, 3, 16]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Laser head */}
          <mesh position={[0, currentHeight + 0.8, 0]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Laser beam (red for high power) */}
          {normalizedProgress > 0.05 && (
            <mesh position={[0, currentHeight + 0.2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
              <meshStandardMaterial
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={4}
                transparent
                opacity={0.9}
              />
            </mesh>
          )}

          {/* Metal sparks */}
          {isMetal && normalizedProgress > 0.1 && (
            <Sparkles
              count={30}
              scale={[0.5, 0.3, 0.5]}
              size={3}
              speed={0.5}
              color="#ffaa00"
              position={[0, currentHeight, 0]}
            />
          )}

          {/* Gantry frame */}
          <mesh position={[0, currentHeight + 1.2, 0]}>
            <boxGeometry args={[3.5, 0.2, 0.2]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* ========== BUILD PLATFORM ========== */}
      {!isSLA && (
        <mesh position={[0, -2, 0]} receiveShadow>
          <boxGeometry args={[3, 0.3, 3]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
        </mesh>
      )}

      {/* ========== LABELS ========== */}
      {showLabels && (
        <>
          {/* Process Title */}
          <Html position={[0, 3, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.9)',
                border: '2px solid #66fcf1',
                color: '#66fcf1',
                padding: '12px 24px',
                borderRadius: '2px',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {isFDM && '🖨️ FDM (FUSED DEPOSITION)'}
              {isSLA && '💧 SLA (STEREOLITHOGRAPHY)'}
              {isSLS && '⚡ SLS (LASER SINTERING)'}
              {isMetal && '🔥 DMLS (METAL PRINTING)'}
            </div>
          </Html>

          {/* Progress Display */}
          <Html position={[0, -2.8, 0]} center>
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
              Layer: {Math.floor(activeProgress * 2)}/200 ({activeProgress.toFixed(1)}%)
            </div>
          </Html>

          {/* SLS Self-Supporting Note */}
          {(isSLS || isMetal) && (
            <Html position={[2.2, 0, 0]} center>
              <div
                style={{
                  background: 'rgba(255, 204, 0, 0.9)',
                  border: '2px solid #ffcc00',
                  color: '#0b0c10',
                  padding: '8px 12px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                SELF-SUPPORTING<br />(Powder Acts As Support)
              </div>
            </Html>
          )}

          {/* FDM Layer Lines Note */}
          {isFDM && (
            <Html position={[-2.2, 0, 0]} center>
              <div
                style={{
                  background: 'rgba(255, 68, 0, 0.9)',
                  border: '2px solid #ff4400',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                Anisotropic<br />(Weak in Z-axis)
              </div>
            </Html>
          )}

          {/* SLA Resolution Note */}
          {isSLA && (
            <Html position={[-2.2, 0, 0]} center>
              <div
                style={{
                  background: 'rgba(68, 136, 255, 0.9)',
                  border: '2px solid #4488ff',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                High Resolution<br />(Smooth Surface)
              </div>
            </Html>
          )}

          {/* Temperature Info */}
          {isFDM && (
            <Html position={[2.2, currentHeight + 0.8, 0]} center>
              <div
                style={{
                  background: 'rgba(11, 12, 16, 0.8)',
                  border: '1px solid #ff4400',
                  color: '#ff9966',
                  padding: '6px 10px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                Nozzle: 200°C
              </div>
            </Html>
          )}
        </>
      )}

      {/* ========== LIGHTING ========== */}
      <ambientLight intensity={1.2} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#444444" />

      {/* Key lights from multiple angles */}
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[5, 3, 0]} intensity={1.5} color="#ffffff" />

      {/* Process-specific lighting */}
      {isFDM && (
        <pointLight
          position={[0, currentHeight + 0.3, 0]}
          intensity={2.5}
          distance={2}
          decay={2}
          color="#ff4400"
        />
      )}

      {isSLA && (
        <pointLight
          position={[0, -0.5, 0]}
          intensity={2}
          distance={4}
          decay={2}
          color="#00ff00"
        />
      )}

      {(isSLS || isMetal) && (
        <pointLight
          position={[0, currentHeight, 0]}
          intensity={isMetal ? 3.5 : 2.5}
          distance={3}
          decay={2}
          color={isMetal ? '#ff6600' : '#ff0000'}
        />
      )}

      {/* Main spotlight */}
      <spotLight
        position={[0, 5, 3]}
        intensity={2.5}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[0, 5, -3]}
        intensity={2}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
      />

      {/* Ground Grid */}
      <gridHelper args={[10, 10, '#45a29e', '#1f2833']} position={[0, -2.5, 0]} />

      {/* Platform base */}
      <mesh position={[0, -2.7, 0]} receiveShadow>
        <boxGeometry args={[10, 0.4, 8]} />
        <meshStandardMaterial color="#1f2833" metalness={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
};

export default ThreeDPrinter;
