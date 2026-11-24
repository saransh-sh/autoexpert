import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STATUS_COLORS = {
  Critical: '#FF3B5C',
  Warning: '#F59E0B',
  'Attention Required': '#00D9FF',
  Healthy: '#C7FF4A',
  'Not Assessed': '#00D9FF',
};

function resolveStatusColor(subsystemStatuses, key, activeSubsystem) {
  const entry = subsystemStatuses?.[key];
  const status = typeof entry === 'string' ? entry : entry?.status;
  if (status && STATUS_COLORS[status] && status !== 'Not Assessed') {
    return STATUS_COLORS[status];
  }
  if (activeSubsystem === key) {
    return '#00D9FF';
  }
  return null;
}

/**
 * Sport motorcycle spoked wheel with dual/single drilled brake rotors & radial caliper.
 */
function MotoWheel({
  position,
  isRear = false,
  geometries,
  brakeGlowColor,
  suspensionGlowColor,
  transGlowColor,
  reducedMotion,
}) {
  const spinRef = useRef(null);
  const radius = isRear ? 0.32 : 0.31;
  const width = isRear ? 0.18 : 0.13;
  const rimAccent = suspensionGlowColor || '#00D9FF';
  const rotorAccent = brakeGlowColor || '#00D9FF';

  useFrame((_, delta) => {
    if (!reducedMotion && spinRef.current) {
      spinRef.current.rotation.z -= Math.min(delta, 0.05) * 0.14;
    }
  });

  return (
    <group position={position}>
      <group ref={spinRef}>
        {/* Sculpted Sport Tire */}
        <mesh geometry={isRear ? geometries.rearTireGeo : geometries.frontTireGeo}>
          <meshStandardMaterial color="#0A0D13" metalness={0.18} roughness={0.76} />
        </mesh>

        {/* Alloy Rim Barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.73, radius * 0.73, width * 0.78, 32, 1, true]} />
          <meshStandardMaterial
            color="#16202D"
            metalness={0.88}
            roughness={0.26}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rim Edge Telemetry Rings */}
        {[1, -1].map((side) => (
          <mesh key={side} position={[0, 0, side * (width * 0.4)]}>
            <torusGeometry args={[radius * 0.72, 0.007, 8, 44]} />
            <meshStandardMaterial
              color={rimAccent}
              emissive={rimAccent}
              emissiveIntensity={suspensionGlowColor ? 1.5 : 0.75}
            />
          </mesh>
        ))}

        {/* 5 Split Y-Spokes */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const angle = (idx / 5) * Math.PI * 2;
          return (
            <group key={idx} rotation={[0, 0, angle]}>
              <mesh position={[radius * 0.36, 0.018, 0]} rotation={[0, 0, 0.12]}>
                <boxGeometry args={[radius * 0.62, 0.018, 0.028]} />
                <meshStandardMaterial color="#1F2A38" metalness={0.9} roughness={0.24} />
              </mesh>
              <mesh position={[radius * 0.36, -0.018, 0]} rotation={[0, 0, -0.12]}>
                <boxGeometry args={[radius * 0.62, 0.018, 0.028]} />
                <meshStandardMaterial color="#1F2A38" metalness={0.9} roughness={0.24} />
              </mesh>
            </group>
          );
        })}

        {/* Hub Axle Barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, width * 1.1, 20]} />
          <meshStandardMaterial color="#10151D" metalness={0.92} roughness={0.22} />
        </mesh>

        {/* Drilled Brake Rotor(s) */}
        {(isRear ? [1] : [1, -1]).map((side) => (
          <group key={`rotor-${side}`} position={[0, 0, side * (width * 0.52)]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[
                  isRear ? radius * 0.44 : radius * 0.62,
                  isRear ? radius * 0.44 : radius * 0.62,
                  0.01,
                  32,
                ]}
              />
              <meshStandardMaterial color="#3B4859" metalness={0.92} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0, side * 0.007]}>
              <ringGeometry
                args={[
                  isRear ? radius * 0.28 : radius * 0.42,
                  isRear ? radius * 0.41 : radius * 0.59,
                  32,
                ]}
              />
              <meshBasicMaterial
                color={rotorAccent}
                transparent
                opacity={brakeGlowColor ? 0.6 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Rear Drive Sprocket */}
        {isRear ? (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -width * 0.56]}>
            <cylinderGeometry args={[radius * 0.42, radius * 0.42, 0.012, 24]} />
            <meshStandardMaterial
              color="#2A3646"
              emissive={transGlowColor || '#00D9FF'}
              emissiveIntensity={transGlowColor ? 1.1 : 0.2}
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>
        ) : null}
      </group>

      {/* Radial Brake Calipers */}
      {(isRear ? [1] : [1, -1]).map((side) => (
        <mesh
          key={`cal-${side}`}
          position={[-radius * 0.36, isRear ? radius * 0.2 : -radius * 0.14, side * (width * 0.52)]}
          rotation={[0, 0, isRear ? -0.45 : 0.35]}
        >
          <boxGeometry args={[0.068, 0.11, 0.045]} />
          <meshStandardMaterial
            color={rotorAccent}
            emissive={rotorAccent}
            emissiveIntensity={brakeGlowColor ? 1.5 : 0.65}
            metalness={0.65}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Sculpted sport motorcycle chassis with curved fairing/tank/tail geometry,
 * TubeGeometry trellis frame & swept exhaust, inverted USD forks, swingarm,
 * dual spoked wheels + drilled rotors, and cyan EdgesGeometry wireframe shell.
 */
export default function MotoChassisMesh({
  activeSubsystem = null,
  subsystemStatuses = {},
  reducedMotion = false,
}) {
  const rootRef = useRef(null);

  const engineGlow = resolveStatusColor(subsystemStatuses, 'engine', activeSubsystem);
  const elecGlow = resolveStatusColor(subsystemStatuses, 'electrical', activeSubsystem);
  const transGlow = resolveStatusColor(subsystemStatuses, 'transmission', activeSubsystem);
  const brakeGlow = resolveStatusColor(subsystemStatuses, 'brakes', activeSubsystem);
  const thermalGlow = resolveStatusColor(subsystemStatuses, 'cooling_lubrication', activeSubsystem);
  const suspGlow = resolveStatusColor(subsystemStatuses, 'suspension_tyres', activeSubsystem);
  const fuelGlow = resolveStatusColor(subsystemStatuses, 'fuel_system', activeSubsystem);

  const geometries = useMemo(() => {
    // 1. Sculpted front nose fairing
    const noseShape = new THREE.Shape();
    noseShape.moveTo(0.98, 0.72);
    noseShape.quadraticCurveTo(0.84, 0.94, 0.56, 1.06);
    noseShape.lineTo(0.30, 0.80);
    noseShape.quadraticCurveTo(0.24, 0.58, 0.42, 0.46);
    noseShape.quadraticCurveTo(0.68, 0.56, 0.98, 0.72);
    noseShape.closePath();

    const noseGeo = new THREE.ExtrudeGeometry(noseShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.045,
      bevelSegments: 4,
      curveSegments: 20,
    });
    noseGeo.translate(0, 0, -0.14);
    noseGeo.computeVertexNormals();

    // 2. Tinted aerodynamic windscreen
    const screenShape = new THREE.Shape();
    screenShape.moveTo(0.84, 0.88);
    screenShape.quadraticCurveTo(0.68, 1.14, 0.48, 1.24);
    screenShape.lineTo(0.45, 1.19);
    screenShape.quadraticCurveTo(0.60, 1.08, 0.76, 0.86);
    screenShape.closePath();

    const screenGeo = new THREE.ExtrudeGeometry(screenShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 16,
    });
    screenGeo.translate(0, 0, -0.12);

    // 3. Muscular sculpted fuel tank
    const tankShape = new THREE.Shape();
    tankShape.moveTo(-0.10, 0.74);
    tankShape.bezierCurveTo(-0.02, 0.92, 0.16, 1.06, 0.36, 1.04);
    tankShape.quadraticCurveTo(0.54, 1.00, 0.56, 0.84);
    tankShape.lineTo(0.24, 0.72);
    tankShape.closePath();

    const tankGeo = new THREE.ExtrudeGeometry(tankShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 20,
    });
    tankGeo.translate(0, 0, -0.14);
    tankGeo.computeVertexNormals();

    // 4. Upswept sport tail cowl
    const tailShape = new THREE.Shape();
    tailShape.moveTo(-0.34, 0.73);
    tailShape.quadraticCurveTo(-0.68, 0.86, -1.04, 1.04);
    tailShape.lineTo(-1.08, 0.99);
    tailShape.quadraticCurveTo(-0.74, 0.76, -0.36, 0.68);
    tailShape.closePath();

    const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 16,
    });
    tailGeo.translate(0, 0, -0.10);
    tailGeo.computeVertexNormals();

    // 5. Lower aerodynamic belly pan
    const bellyShape = new THREE.Shape();
    bellyShape.moveTo(-0.28, 0.22);
    bellyShape.lineTo(0.42, 0.22);
    bellyShape.quadraticCurveTo(0.58, 0.32, 0.50, 0.44);
    bellyShape.lineTo(-0.22, 0.36);
    bellyShape.closePath();

    const bellyGeo = new THREE.ExtrudeGeometry(bellyShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 3,
      curveSegments: 12,
    });
    bellyGeo.translate(0, 0, -0.11);

    // 6. TubeGeometry Trellis Frame (left & right triangulated steel tubes)
    const buildTrellisSet = (z) => {
      const upper = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.52, 0.86, z * 0.82),
          new THREE.Vector3(0.18, 0.80, z * 1.1),
          new THREE.Vector3(-0.20, 0.56, z),
        ]),
        18,
        0.017,
        8,
        false
      );
      const lower = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.50, 0.74, z * 0.84),
          new THREE.Vector3(0.24, 0.58, z * 1.06),
          new THREE.Vector3(-0.22, 0.40, z),
        ]),
        16,
        0.016,
        8,
        false
      );
      const brace = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.18, 0.80, z * 1.1),
          new THREE.Vector3(0.24, 0.58, z * 1.06),
          new THREE.Vector3(-0.20, 0.56, z),
        ]),
        12,
        0.014,
        8,
        false
      );
      const subframe = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.20, 0.56, z),
          new THREE.Vector3(-0.56, 0.76, z * 0.88),
          new THREE.Vector3(-0.92, 0.94, z * 0.72),
        ]),
        16,
        0.014,
        8,
        false
      );
      return [upper, lower, brace, subframe];
    };

    const trellisGeos = [...buildTrellisSet(0.135), ...buildTrellisSet(-0.135)];

    // 7. Swept Titanium Exhaust Header & Upswept Muffler Pipe
    const exhaustCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.28, 0.44, 0.11),
      new THREE.Vector3(0.32, 0.28, 0.14),
      new THREE.Vector3(0.02, 0.19, 0.15),
      new THREE.Vector3(-0.34, 0.22, 0.16),
      new THREE.Vector3(-0.62, 0.36, 0.175),
    ]);
    const exhaustGeo = new THREE.TubeGeometry(exhaustCurve, 28, 0.025, 10, false);

    // 8. Helical Rear Mono-Shock Spring
    const coilPts = [];
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const angle = t * Math.PI * 10;
      coilPts.push(
        new THREE.Vector3(
          Math.cos(angle) * 0.026,
          t * 0.19 - 0.095,
          Math.sin(angle) * 0.026
        )
      );
    }
    const shockCoilGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 44, 0.006, 6, false);

    // 9. Sculpted Moto Sport Tires via LatheGeometry
    const buildMotoTire = (outerR, width) => {
      const innerR = outerR * 0.72;
      const halfW = width * 0.5;
      const profile = [
        new THREE.Vector2(innerR, -halfW * 0.84),
        new THREE.Vector2(outerR * 0.91, -halfW),
        new THREE.Vector2(outerR, 0),
        new THREE.Vector2(outerR * 0.91, halfW),
        new THREE.Vector2(innerR, halfW * 0.84),
      ];
      const lathe = new THREE.LatheGeometry(profile, 36);
      lathe.rotateX(Math.PI / 2);
      lathe.computeVertexNormals();
      return lathe;
    };

    const frontTireGeo = buildMotoTire(0.31, 0.13);
    const rearTireGeo = buildMotoTire(0.32, 0.18);

    // 10. Cyan Wireframe EdgesGeometry
    const noseEdgesGeo = new THREE.EdgesGeometry(noseGeo, 18);
    const screenEdgesGeo = new THREE.EdgesGeometry(screenGeo, 16);
    const tankEdgesGeo = new THREE.EdgesGeometry(tankGeo, 18);
    const tailEdgesGeo = new THREE.EdgesGeometry(tailGeo, 18);
    const bellyEdgesGeo = new THREE.EdgesGeometry(bellyGeo, 18);

    // 11. Shared Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#141B26',
      metalness: 0.82,
      roughness: 0.26,
    });
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: '#07141F',
      metalness: 0.1,
      roughness: 0.07,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.78,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#313F52',
      metalness: 0.88,
      roughness: 0.25,
    });
    const edgeCyanMat = new THREE.LineBasicMaterial({
      color: '#00D9FF',
      transparent: true,
      opacity: 0.48,
    });

    return {
      noseGeo,
      screenGeo,
      tankGeo,
      tailGeo,
      bellyGeo,
      trellisGeos,
      exhaustGeo,
      shockCoilGeo,
      frontTireGeo,
      rearTireGeo,
      noseEdgesGeo,
      screenEdgesGeo,
      tankEdgesGeo,
      tailEdgesGeo,
      bellyEdgesGeo,
      bodyMat,
      screenMat,
      frameMat,
      edgeCyanMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.noseGeo.dispose();
      geometries.screenGeo.dispose();
      geometries.tankGeo.dispose();
      geometries.tailGeo.dispose();
      geometries.bellyGeo.dispose();
      geometries.trellisGeos.forEach((g) => g.dispose());
      geometries.exhaustGeo.dispose();
      geometries.shockCoilGeo.dispose();
      geometries.frontTireGeo.dispose();
      geometries.rearTireGeo.dispose();
      geometries.noseEdgesGeo.dispose();
      geometries.screenEdgesGeo.dispose();
      geometries.tankEdgesGeo.dispose();
      geometries.tailEdgesGeo.dispose();
      geometries.bellyEdgesGeo.dispose();
      geometries.bodyMat.dispose();
      geometries.screenMat.dispose();
      geometries.frameMat.dispose();
      geometries.edgeCyanMat.dispose();
    };
  }, [geometries]);

  // Fork rake geometry vector from steering head (0.54, 0.86) to front axle (0.90, 0.31)
  const forkAngle = Math.atan2(0.90 - 0.54, 0.86 - 0.31); // ~0.579 rad

  return (
    <group ref={rootRef} name="nexus-moto-chassis">
      {/* Aerodynamic Nose Fairing + Cyan Scan Shell */}
      <mesh geometry={geometries.noseGeo} material={geometries.bodyMat} />
      <lineSegments geometry={geometries.noseEdgesGeo} material={geometries.edgeCyanMat} />

      {/* Front LED Headlight Blade */}
      <mesh position={[0.94, 0.77, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.06, 0.04, 0.22]} />
        <meshStandardMaterial
          color="#E8EDF3"
          emissive={elecGlow || '#00D9FF'}
          emissiveIntensity={elecGlow ? 2.1 : 1.5}
        />
      </mesh>

      {/* Aerodynamic Windscreen */}
      <mesh geometry={geometries.screenGeo} material={geometries.screenMat} />
      <lineSegments geometry={geometries.screenEdgesGeo} material={geometries.edgeCyanMat} />

      {/* Sculpted Fuel Tank */}
      <mesh geometry={geometries.tankGeo} material={geometries.bodyMat} />
      <lineSegments geometry={geometries.tankEdgesGeo} material={geometries.edgeCyanMat} />
      {fuelGlow ? (
        <mesh position={[0.24, 0.90, 0]}>
          <boxGeometry args={[0.32, 0.14, 0.26]} />
          <meshStandardMaterial
            color={fuelGlow}
            emissive={fuelGlow}
            emissiveIntensity={0.85}
            transparent
            opacity={0.45}
          />
        </mesh>
      ) : null}

      {/* Rider Saddle Pad */}
      <mesh position={[-0.24, 0.73, 0]} rotation={[0, 0, -0.14]}>
        <boxGeometry args={[0.36, 0.06, 0.24]} />
        <meshStandardMaterial color="#0A0D12" roughness={0.88} metalness={0.1} />
      </mesh>

      {/* Upswept Tail Section + Integrated Tail Blade */}
      <mesh geometry={geometries.tailGeo} material={geometries.bodyMat} />
      <lineSegments geometry={geometries.tailEdgesGeo} material={geometries.edgeCyanMat} />
      <mesh position={[-1.06, 1.01, 0]} rotation={[0, 0, -0.42]}>
        <boxGeometry args={[0.04, 0.025, 0.16]} />
        <meshStandardMaterial
          color="#FF3B5C"
          emissive={brakeGlow || '#FF3B5C'}
          emissiveIntensity={1.25}
        />
      </mesh>

      {/* Belly Pan Fairing */}
      <mesh geometry={geometries.bellyGeo} material={geometries.bodyMat} />
      <lineSegments geometry={geometries.bellyEdgesGeo} material={geometries.edgeCyanMat} />

      {/* TubeGeometry Trellis Frame */}
      {geometries.trellisGeos.map((tGeo, idx) => (
        <mesh key={`trellis-${idx}`} geometry={tGeo} material={geometries.frameMat} />
      ))}

      {/* Inverted USD Front Forks + Triple Clamps + Clip-on Handlebars */}
      <group position={[0.72, 0.585, 0]} rotation={[0, 0, forkAngle]}>
        {[1, -1].map((side) => (
          <group key={`fork-${side}`} position={[0, 0, side * 0.098]}>
            {/* Upper Outer Fork Leg */}
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.36, 16]} />
              <meshStandardMaterial
                color="#263242"
                emissive={suspGlow || '#00D9FF'}
                emissiveIntensity={suspGlow ? 0.65 : 0.08}
                metalness={0.88}
                roughness={0.22}
              />
            </mesh>
            {/* Lower Inner Stanchion */}
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.34, 16]} />
              <meshStandardMaterial color="#9FB0C4" metalness={0.94} roughness={0.16} />
            </mesh>
          </group>
        ))}
        {/* Upper Triple Clamp + Clip-on Bars */}
        <mesh position={[0, 0.30, 0]}>
          <boxGeometry args={[0.06, 0.025, 0.24]} />
          <meshStandardMaterial color="#1B2430" metalness={0.88} roughness={0.26} />
        </mesh>
        {[1, -1].map((side) => (
          <mesh
            key={`bar-${side}`}
            position={[-0.03, 0.31, side * 0.19]}
            rotation={[side * 0.24, 0, 0.12]}
          >
            <cylinderGeometry args={[0.014, 0.014, 0.18, 12]} />
            <meshStandardMaterial color="#10151D" metalness={0.75} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* Front Mudguard Fender */}
      <mesh position={[0.90, 0.31, 0]} rotation={[0, 0, 0.45]}>
        <torusGeometry args={[0.335, 0.028, 10, 22, 1.35]} />
        <meshStandardMaterial color="#141B26" metalness={0.8} roughness={0.28} />
      </mesh>

      {/* Rear Sculpted Swingarm + Helical Mono-Shock */}
      {[-0.105, 0.105].map((zPos) => (
        <mesh
          key={`swing-${zPos}`}
          position={[-0.54, 0.36, zPos]}
          rotation={[0, 0, 0.12]}
        >
          <boxGeometry args={[0.68, 0.065, 0.035]} />
          <meshStandardMaterial
            color="#1E2836"
            emissive={suspGlow || '#00D9FF'}
            emissiveIntensity={suspGlow ? 0.55 : 0.06}
            metalness={0.86}
            roughness={0.26}
          />
        </mesh>
      ))}
      <group position={[-0.28, 0.56, 0]} rotation={[0, 0, -0.58]}>
        <mesh geometry={geometries.shockCoilGeo}>
          <meshStandardMaterial
            color={suspGlow || '#00D9FF'}
            emissive={suspGlow || '#00D9FF'}
            emissiveIntensity={suspGlow ? 1.2 : 0.45}
            metalness={0.7}
            roughness={0.25}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 12]} />
          <meshStandardMaterial color="#9FB0C4" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>

      {/* Swept Exhaust Header & Angled Canister */}
      <mesh geometry={geometries.exhaustGeo}>
        <meshStandardMaterial color="#4B5A6E" metalness={0.92} roughness={0.22} />
      </mesh>
      <mesh position={[-0.58, 0.34, 0.18]} rotation={[0, 0, 1.1]}>
        <cylinderGeometry args={[0.044, 0.036, 0.22, 18]} />
        <meshStandardMaterial color="#1B2430" metalness={0.88} roughness={0.24} />
      </mesh>

      {/* Sculpted Engine Crankcase + Circular Clutch Window */}
      <group position={[0.12, 0.44, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.28, 0.28]} />
          <meshStandardMaterial
            color="#1A222E"
            emissive={engineGlow || '#00D9FF'}
            emissiveIntensity={engineGlow ? 0.95 : 0.14}
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
        {/* Iconic Dry-Clutch Inspection Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.02, -0.02, 0.145]}>
          <cylinderGeometry args={[0.095, 0.095, 0.025, 24]} />
          <meshStandardMaterial color="#10151D" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.02, -0.02, 0.16]}>
          <ringGeometry args={[0.056, 0.082, 28]} />
          <meshBasicMaterial
            color={engineGlow || '#00D9FF'}
            transparent
            opacity={engineGlow ? 0.95 : 0.65}
          />
        </mesh>
      </group>

      {/* Curved Front Radiator & Thermal Core */}
      <mesh position={[0.50, 0.50, 0]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.08, 0.22, 0.24]} />
        <meshStandardMaterial
          color="#131C28"
          emissive={thermalGlow || '#00D9FF'}
          emissiveIntensity={thermalGlow ? 1.15 : 0.22}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Cockpit Instrument ECU Pod */}
      <mesh position={[0.56, 0.92, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.10, 0.06, 0.16]} />
        <meshStandardMaterial
          color="#0F1D28"
          emissive={elecGlow || '#00D9FF'}
          emissiveIntensity={elecGlow ? 1.35 : 0.35}
        />
      </mesh>

      {/* Dual Spoked Wheels + Drilled Rotors */}
      <MotoWheel
        position={[0.90, 0.31, 0]}
        isRear={false}
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        transGlowColor={transGlow}
        reducedMotion={reducedMotion}
      />
      <MotoWheel
        position={[-0.86, 0.32, 0]}
        isRear
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        transGlowColor={transGlow}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}
