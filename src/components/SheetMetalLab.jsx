import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

// ========== SHEARING STATION ==========
const ShearingStation = ({ progress, showLabels }) => {
  const punchRef = useRef();
  const slugRef = useRef();
  const [slugFalling, setSlugFalling] = useState(false);
  const [slugPosition, setSlugPosition] = useState(0);

  const punchPosition = -0.5 + progress * 2; // Moves from -0.5 to 1.5
  const isPunched = punchPosition > 0.3; // Punch has penetrated

  useFrame((state, delta) => {
    if (slugFalling) {
      setSlugPosition((prev) => prev - delta * 2);
      if (slugPosition < -3) {
        setSlugFalling(false);
        setSlugPosition(0);
      }
    }
  });

  useEffect(() => {
    if (isPunched && !slugFalling) {
      setSlugFalling(true);
      setSlugPosition(0);
    }
  }, [isPunched]);

  return (
    <group>
      {/* Die Block (Bottom) */}
      <mesh position={[0, -1, 0]} castShadow>
        <boxGeometry args={[3, 0.5, 2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Die opening */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Sheet Metal - Solid vs Punched */}
      {!isPunched ? (
        // Solid sheet
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[3, 0.1, 2]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>
      ) : (
        // Punched sheet (with hole)
        <group position={[0, -0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[3, 0.1, 2]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hole (dark circle to simulate cut) */}
          <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.4, 32]} />
            <meshStandardMaterial color="#0a0a0a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Punch (Cylinder moving down) */}
      <mesh ref={punchRef} position={[0, punchPosition, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 1, 32]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Punch holder */}
      <mesh position={[0, punchPosition + 0.8, 0]} castShadow>
        <boxGeometry args={[1, 0.6, 1]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Slug (falling waste) */}
      {slugFalling && (
        <mesh ref={slugRef} position={[0, -0.7 + slugPosition, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.1, 32]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
        </mesh>
      )}

      {/* Labels */}
      {showLabels && (
        <>
          <Html position={[1.8, -0.5, 0]} center>
            <div
              style={{
                background: 'rgba(255, 68, 0, 0.9)',
                border: '2px solid #ff4400',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Shear Fracture
            </div>
          </Html>
          {isPunched && (
            <Html position={[0, -1.5, 0]} center>
              <div
                style={{
                  background: 'rgba(11, 12, 16, 0.9)',
                  border: '1px solid #66fcf1',
                  color: '#66fcf1',
                  padding: '6px 12px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                }}
              >
                Slug (Waste)
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
};

// ========== BENDING STATION ==========
const BendingStation = ({ progress, showLabels }) => {
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const punchRef = useRef();

  // Bending phases
  const bendingPhase = Math.min(progress * 2, 1); // 0-50% progress
  const springbackPhase = Math.max((progress - 0.5) * 2, 0); // 50-100% progress

  // Bend angle calculation with springback
  const targetBendAngle = bendingPhase * (Math.PI / 4); // 0 to 45 degrees
  const springbackAngle = springbackPhase * 0.087; // 5 degrees springback (0.087 rad)
  const finalBendAngle = targetBendAngle - springbackAngle;

  const punchPosition = -0.5 + bendingPhase * 1.2;

  useFrame(() => {
    if (leftWingRef.current && rightWingRef.current) {
      leftWingRef.current.rotation.z = -finalBendAngle;
      rightWingRef.current.rotation.z = finalBendAngle;
    }
  });

  return (
    <group>
      {/* V-Die (Bottom) */}
      <group position={[0, -1, 0]}>
        {/* Left side of V */}
        <mesh position={[-0.6, 0.3, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <boxGeometry args={[1.2, 0.5, 2]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Right side of V */}
        <mesh position={[0.6, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[1.2, 0.5, 2]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Sheet Metal - Two Wings */}
      <group position={[0, -0.4, 0]}>
        {/* Left Wing */}
        <mesh
          ref={leftWingRef}
          position={[-0.75, 0, 0]}
          castShadow
        >
          <boxGeometry args={[1.5, 0.08, 2]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Right Wing */}
        <mesh
          ref={rightWingRef}
          position={[0.75, 0, 0]}
          castShadow
        >
          <boxGeometry args={[1.5, 0.08, 2]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Center pivot (Neutral Axis) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 16]} />
          <meshStandardMaterial color="#ff4400" metalness={0.8} roughness={0.3} />
          <mesh rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
      </group>

      {/* V-Punch (Top) */}
      <group ref={punchRef} position={[0, punchPosition, 0]}>
        {/* Punch tip (V-shaped) */}
        <mesh rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[0.8, 1, 4]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Punch holder */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.2, 0.6, 2]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Labels */}
      {showLabels && (
        <>
          <Html position={[0, -0.4, 1.3]} center>
            <div
              style={{
                background: 'rgba(255, 68, 0, 0.9)',
                border: '2px solid #ff4400',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Neutral Axis
            </div>
          </Html>
          {springbackPhase > 0 && (
            <Html position={[0, 0.5, 0]} center>
              <div
                style={{
                  background: 'rgba(102, 252, 241, 0.9)',
                  border: '2px solid #66fcf1',
                  color: '#0b0c10',
                  padding: '6px 12px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚡ SPRINGBACK: {(springbackAngle * 180 / Math.PI).toFixed(1)}°
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
};

// ========== SPINNING STATION ==========
const SpinningStation = ({ progress, showLabels }) => {
  const diskRef = useRef();
  const rollerRef = useRef();
  const [rotation, setRotation] = useState(0);

  // Generate lathe geometry points
  const latheGeometry = useMemo(() => {
    const points = [];
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Interpolate from flat disk to cone
      const flatRadius = 1.5;
      const coneRadius = 1.5 * (1 - t * 0.6); // Cone gets narrower
      const height = 0; // Flat initially
      const coneHeight = t * 2; // Cone grows in height

      // Lerp between flat and cone based on progress
      const currentRadius = flatRadius + (coneRadius - flatRadius) * progress;
      const currentHeight = height + (coneHeight - height) * progress;

      points.push(new THREE.Vector2(currentRadius, currentHeight));
    }

    return new THREE.LatheGeometry(points, 32);
  }, [progress]);

  useFrame((state, delta) => {
    setRotation((prev) => prev + delta * 3);

    if (rollerRef.current) {
      // Roller moves along the surface
      const rollerT = (Math.sin(state.clock.elapsedTime * 1.5) + 1) / 2; // 0 to 1
      const rollerRadius = 1.5 - rollerT * 0.9 * progress;
      const rollerHeight = rollerT * 2 * progress;

      rollerRef.current.position.x = rollerRadius + 0.2;
      rollerRef.current.position.y = rollerHeight;
    }
  });

  return (
    <group>
      {/* Mandrel (Cone - the target shape) */}
      <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.6, 3, 32]} />
        <meshStandardMaterial
          color="#3a3a3a"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Spinning Disk (Deforming) */}
      <mesh
        ref={diskRef}
        geometry={latheGeometry}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, rotation, 0]}
        castShadow
      >
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Roller Tool */}
      <mesh ref={rollerRef} position={[1.5, 0, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Roller arm */}
      <mesh position={[1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Lathe base */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Labels */}
      {showLabels && (
        <>
          <Html position={[0, 1.8, 0]} center>
            <div
              style={{
                background: 'rgba(58, 58, 58, 0.8)',
                border: '1px solid #888',
                color: '#ccc',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Mandrel (Target Shape)
            </div>
          </Html>
          <Html position={[2.2, 0, 0]} center>
            <div
              style={{
                background: 'rgba(255, 204, 0, 0.9)',
                border: '2px solid #ffcc00',
                color: '#0b0c10',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Roller
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

// ========== MAIN COMPONENT ==========
const SheetMetalLab = () => {
  const [processProgress, setProcessProgress] = useState(0);

  // Leva Controls
  const controls = useControls('Sheet Metal Controls', {
    process: {
      value: 'Shearing',
      options: ['Shearing', 'Bending', 'Spinning'],
      label: 'Process Type',
    },
    progress: { value: 0, min: 0, max: 100, step: 0.1, label: 'Process Progress (%)' },
    forceApplied: { value: 50, min: 0, max: 100, step: 1, label: 'Force Applied (%)' },
    showLabels: { value: true, label: 'Show Labels' },
    autoRun: { value: true, label: 'Auto Run' },
    speed: { value: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
    reset: button(() => {
      setProcessProgress(0);
    }),
  });

  const { process, progress, forceApplied, showLabels, autoRun, speed } = controls;

  // Auto-run animation
  useFrame((state, delta) => {
    if (autoRun) {
      setProcessProgress((prev) => {
        const newProgress = prev + delta * speed * 15;
        if (newProgress >= 100) return 0; // Loop
        return newProgress;
      });
    } else {
      setProcessProgress(progress);
    }
  });

  const activeProgress = autoRun ? processProgress : progress;
  const normalizedProgress = activeProgress / 100;

  // Force color (visual feedback)
  const forceColor = new THREE.Color().setHSL(
    (1 - forceApplied / 100) * 0.3, // Red at high force
    1,
    0.5
  );

  return (
    <group>
      {/* Render active process */}
      {process === 'Shearing' && (
        <ShearingStation progress={normalizedProgress} showLabels={showLabels} />
      )}
      {process === 'Bending' && (
        <BendingStation progress={normalizedProgress} showLabels={showLabels} />
      )}
      {process === 'Spinning' && (
        <SpinningStation progress={normalizedProgress} showLabels={showLabels} />
      )}

      {/* Process Title */}
      {showLabels && (
        <>
          <Html position={[0, 2.5, 0]} center>
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
              {process === 'Shearing' && '✂️ SHEARING (PUNCHING)'}
              {process === 'Bending' && '📐 V-BENDING'}
              {process === 'Spinning' && '🔄 METAL SPINNING'}
            </div>
          </Html>

          {/* Progress Display */}
          <Html position={[0, -2.5, 0]} center>
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

          {/* Force Indicator */}
          <Html position={[2.5, 0, 0]} center>
            <div
              style={{
                background: 'rgba(11, 12, 16, 0.8)',
                border: `2px solid ${forceColor.getStyle()}`,
                color: forceColor.getStyle(),
                padding: '8px 12px',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani, monospace',
                whiteSpace: 'nowrap',
              }}
            >
              Force: {forceApplied}%
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
      <pointLight position={[5, 3, 0]} intensity={1.5} color="#ffffff" />

      {/* Process-specific lighting */}
      <spotLight
        position={[0, 4, 2]}
        intensity={2.5}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[0, 4, -2]}
        intensity={2}
        angle={0.6}
        penumbra={1}
        color="#ffffff"
      />

      {/* Ground Grid */}
      <gridHelper args={[15, 15, '#45a29e', '#1f2833']} position={[0, -2.5, 0]} />

      {/* Platform */}
      <mesh position={[0, -2.6, 0]} receiveShadow>
        <boxGeometry args={[15, 0.2, 10]} />
        <meshStandardMaterial color="#1f2833" metalness={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
};

export default SheetMetalLab;
