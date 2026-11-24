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
 * Multi-part spoked alloy wheel + drilled brake rotor + caliper assembly.
 */
function CoupeWheel({
  position,
  isRear = false,
  isRightSide = true,
  geometries,
  brakeGlowColor,
  suspensionGlowColor,
  reducedMotion,
}) {
  const wheelSpinRef = useRef(null);
  const sideSign = isRightSide ? 1 : -1;
  const radius = isRear ? 0.37 : 0.355;
  const tireWidth = isRear ? 0.25 : 0.22;

  useFrame((_, delta) => {
    if (!reducedMotion && wheelSpinRef.current) {
      // Subtle ambient bench inspection rotation
      wheelSpinRef.current.rotation.z -= Math.min(delta, 0.05) * 0.12;
    }
  });

  const caliperColor = brakeGlowColor || '#00D9FF';
  const rimHighlightColor = suspensionGlowColor || '#00D9FF';

  return (
    <group position={position}>
      {/* Spinning Tire + Spoked Rim + Drilled Rotor */}
      <group ref={wheelSpinRef}>
        {/* Sculpted Sport Tire */}
        <mesh geometry={isRear ? geometries.rearTireGeo : geometries.frontTireGeo}>
          <meshStandardMaterial
            color="#0B0E14"
            metalness={0.18}
            roughness={0.78}
          />
        </mesh>

        {/* Metallic Rim Barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.72, radius * 0.72, tireWidth * 0.82, 32, 1, true]} />
          <meshStandardMaterial
            color="#151E2B"
            metalness={0.86}
            roughness={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Cyan Rim Accent Ring */}
        <mesh position={[0, 0, sideSign * (tireWidth * 0.44)]}>
          <torusGeometry args={[radius * 0.71, 0.009, 10, 48]} />
          <meshStandardMaterial
            color={rimHighlightColor}
            emissive={rimHighlightColor}
            emissiveIntensity={suspensionGlowColor ? 1.5 : 0.75}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* 5 Twin Y-Spokes */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const angle = (idx / 5) * Math.PI * 2;
          return (
            <group key={idx} rotation={[0, 0, angle]} position={[0, 0, sideSign * (tireWidth * 0.3)]}>
              <mesh position={[radius * 0.34, 0.022, 0]} rotation={[0, 0, 0.14]}>
                <boxGeometry args={[radius * 0.58, 0.022, 0.024]} />
                <meshStandardMaterial color="#1F2A38" metalness={0.9} roughness={0.24} />
              </mesh>
              <mesh position={[radius * 0.34, -0.022, 0]} rotation={[0, 0, -0.14]}>
                <boxGeometry args={[radius * 0.58, 0.022, 0.024]} />
                <meshStandardMaterial color="#1F2A38" metalness={0.9} roughness={0.24} />
              </mesh>
            </group>
          );
        })}

        {/* Center Alloy Hub Cap */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, sideSign * (tireWidth * 0.33)]}>
          <cylinderGeometry args={[0.068, 0.075, 0.04, 20]} />
          <meshStandardMaterial color="#10151D" metalness={0.92} roughness={0.22} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, sideSign * (tireWidth * 0.355)]}>
          <cylinderGeometry args={[0.028, 0.028, 0.015, 16]} />
          <meshStandardMaterial
            color={rimHighlightColor}
            emissive={rimHighlightColor}
            emissiveIntensity={0.65}
          />
        </mesh>

        {/* Drilled Ventilated Brake Rotor Disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, sideSign * 0.02]}>
          <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.022, 32]} />
          <meshStandardMaterial color="#3A4758" metalness={0.92} roughness={0.22} />
        </mesh>
        {/* Rotor Telemetry Cooling Slot Ring */}
        <mesh position={[0, 0, sideSign * 0.032]}>
          <ringGeometry args={[radius * 0.38, radius * 0.53, 32]} />
          <meshBasicMaterial
            color={caliperColor}
            transparent
            opacity={brakeGlowColor ? 0.55 : 0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Fixed Brake Caliper Housing */}
      <mesh
        position={[-radius * 0.38, radius * 0.16, sideSign * 0.05]}
        rotation={[0, 0, -0.45]}
      >
        <boxGeometry args={[0.09, 0.15, 0.075]} />
        <meshStandardMaterial
          color={caliperColor}
          emissive={caliperColor}
          emissiveIntensity={brakeGlowColor ? 1.45 : 0.55}
          metalness={0.65}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/**
 * Sculpted futuristic fastback GT coupe chassis with ExtrudeGeometry bodywork,
 * tinted panoramic greenhouse canopy, cyan EdgesGeometry scan shell,
 * 4 multi-part wheels with drilled rotors & calipers, and LED light blades.
 */
export default function VehicleChassisMesh({
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
    // 1. Central sculpted monocoque lower body (hood, beltline sill, fastback tail)
    const spineShape = new THREE.Shape();
    spineShape.moveTo(2.14, 0.24);
    spineShape.quadraticCurveTo(2.22, 0.34, 2.15, 0.45);
    spineShape.bezierCurveTo(1.88, 0.56, 1.38, 0.69, 0.74, 0.77);
    spineShape.bezierCurveTo(0.18, 0.79, -0.65, 0.81, -1.48, 0.86);
    spineShape.lineTo(-1.86, 0.89);
    spineShape.quadraticCurveTo(-2.10, 0.86, -2.14, 0.78);
    spineShape.lineTo(-2.17, 0.32);
    spineShape.lineTo(-2.02, 0.19);
    spineShape.lineTo(1.96, 0.17);
    spineShape.closePath();

    const spineGeo = new THREE.ExtrudeGeometry(spineShape, {
      depth: 1.02,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.11,
      bevelSegments: 5,
      curveSegments: 28,
    });
    spineGeo.translate(0, 0, -0.51);
    spineGeo.computeVertexNormals();

    // 2. Flared side fender/pod profile with true semicircular wheel-arch cutouts
    const fenderShape = new THREE.Shape();
    fenderShape.moveTo(2.06, 0.18);
    fenderShape.quadraticCurveTo(2.13, 0.42, 1.92, 0.56);
    fenderShape.quadraticCurveTo(1.42, 0.82, 0.76, 0.76);
    fenderShape.bezierCurveTo(0.15, 0.77, -0.58, 0.84, -1.24, 0.90);
    fenderShape.quadraticCurveTo(-1.82, 0.90, -2.08, 0.74);
    fenderShape.lineTo(-2.12, 0.28);
    fenderShape.lineTo(-1.73, 0.18);
    fenderShape.absarc(-1.34, 0.36, 0.43, Math.PI + 0.432, -0.432, true);
    fenderShape.lineTo(0.983, 0.18);
    fenderShape.absarc(1.34, 0.36, 0.40, Math.PI + 0.467, -0.467, true);
    fenderShape.closePath();

    const fenderGeo = new THREE.ExtrudeGeometry(fenderShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.045,
      bevelSegments: 4,
      curveSegments: 28,
    });
    fenderGeo.translate(0, 0, -0.125);
    fenderGeo.computeVertexNormals();

    // 3. Tinted panoramic greenhouse canopy
    const canopyShape = new THREE.Shape();
    canopyShape.moveTo(0.76, 0.74);
    canopyShape.bezierCurveTo(0.45, 0.98, 0.14, 1.25, -0.26, 1.27);
    canopyShape.bezierCurveTo(-0.80, 1.27, -1.30, 1.06, -1.78, 0.88);
    canopyShape.lineTo(-1.55, 0.76);
    canopyShape.closePath();

    const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, {
      depth: 0.92,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 24,
    });
    canopyGeo.translate(0, 0, -0.46);
    canopyGeo.computeVertexNormals();

    // 4. Front aerodynamic splitter crescent
    const splitterShape = new THREE.Shape();
    splitterShape.moveTo(1.75, -0.82);
    splitterShape.quadraticCurveTo(2.28, -0.68, 2.26, 0);
    splitterShape.quadraticCurveTo(2.28, 0.68, 1.75, 0.82);
    splitterShape.lineTo(1.62, 0.72);
    splitterShape.quadraticCurveTo(2.04, 0.56, 2.04, 0);
    splitterShape.quadraticCurveTo(2.04, -0.56, 1.62, -0.72);
    splitterShape.closePath();

    const splitterGeo = new THREE.ExtrudeGeometry(splitterShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 24,
    });
    splitterGeo.rotateX(Math.PI / 2);
    splitterGeo.computeVertexNormals();

    // 5. Sleek LED light blade profile (sweeps down from fender into nose)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0.08);
    bladeShape.quadraticCurveTo(0.14, 0.04, 0.27, 0);
    bladeShape.lineTo(0.25, -0.025);
    bladeShape.quadraticCurveTo(0.12, 0.015, -0.02, 0.055);
    bladeShape.closePath();

    const ledBladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.16,
      bevelEnabled: false,
      curveSegments: 12,
    });
    ledBladeGeo.translate(0, 0, -0.08);

    // 6. Sculpted sport tires via LatheGeometry
    const buildTireLathe = (outerR, width) => {
      const innerR = outerR * 0.71;
      const halfW = width * 0.5;
      const profile = [
        new THREE.Vector2(innerR, -halfW * 0.88),
        new THREE.Vector2(outerR * 0.92, -halfW),
        new THREE.Vector2(outerR, -halfW * 0.72),
        new THREE.Vector2(outerR, halfW * 0.72),
        new THREE.Vector2(outerR * 0.92, halfW),
        new THREE.Vector2(innerR, halfW * 0.88),
      ];
      const lathe = new THREE.LatheGeometry(profile, 36);
      lathe.rotateX(Math.PI / 2);
      lathe.computeVertexNormals();
      return lathe;
    };

    const frontTireGeo = buildTireLathe(0.355, 0.22);
    const rearTireGeo = buildTireLathe(0.37, 0.25);

    // 7. Side aero intake scoop rail (TubeGeometry)
    const intakeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.45, 0.38, 0.88),
      new THREE.Vector3(-0.18, 0.36, 0.91),
      new THREE.Vector3(-0.78, 0.52, 0.89),
      new THREE.Vector3(-1.05, 0.74, 0.86),
    ]);
    const intakeTubeGeo = new THREE.TubeGeometry(intakeCurve, 24, 0.011, 8, false);

    // 8. Cyan wireframe EdgesGeometry scan shells
    const spineEdgesGeo = new THREE.EdgesGeometry(spineGeo, 19);
    const fenderEdgesGeo = new THREE.EdgesGeometry(fenderGeo, 20);
    const canopyEdgesGeo = new THREE.EdgesGeometry(canopyGeo, 16);
    const splitterEdgesGeo = new THREE.EdgesGeometry(splitterGeo, 18);

    // 9. Shared Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#141B26',
      metalness: 0.84,
      roughness: 0.27,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: '#0B0F15',
      metalness: 0.65,
      roughness: 0.42,
    });
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: '#07111A',
      metalness: 0.15,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.86,
      reflectivity: 0.95,
    });
    const edgeCyanMat = new THREE.LineBasicMaterial({
      color: '#00D9FF',
      transparent: true,
      opacity: 0.44,
    });
    const edgeCanopyMat = new THREE.LineBasicMaterial({
      color: '#67E8F9',
      transparent: true,
      opacity: 0.55,
    });

    return {
      spineGeo,
      fenderGeo,
      canopyGeo,
      splitterGeo,
      ledBladeGeo,
      frontTireGeo,
      rearTireGeo,
      intakeTubeGeo,
      spineEdgesGeo,
      fenderEdgesGeo,
      canopyEdgesGeo,
      splitterEdgesGeo,
      bodyMat,
      trimMat,
      canopyMat,
      edgeCyanMat,
      edgeCanopyMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.spineGeo.dispose();
      geometries.fenderGeo.dispose();
      geometries.canopyGeo.dispose();
      geometries.splitterGeo.dispose();
      geometries.ledBladeGeo.dispose();
      geometries.frontTireGeo.dispose();
      geometries.rearTireGeo.dispose();
      geometries.intakeTubeGeo.dispose();
      geometries.spineEdgesGeo.dispose();
      geometries.fenderEdgesGeo.dispose();
      geometries.canopyEdgesGeo.dispose();
      geometries.splitterEdgesGeo.dispose();
      geometries.bodyMat.dispose();
      geometries.trimMat.dispose();
      geometries.canopyMat.dispose();
      geometries.edgeCyanMat.dispose();
      geometries.edgeCanopyMat.dispose();
    };
  }, [geometries]);

  return (
    <group ref={rootRef} name="nexus-car-chassis">
      {/* Central Sculpted Monocoque Body + Cyan Scan Shell */}
      <mesh geometry={geometries.spineGeo} material={geometries.bodyMat} />
      <lineSegments geometry={geometries.spineEdgesGeo} material={geometries.edgeCyanMat} />

      {/* Right & Left Sculpted Flared Fender Shells */}
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0, side * 0.72]}>
          <mesh geometry={geometries.fenderGeo} material={geometries.bodyMat} />
          <lineSegments geometry={geometries.fenderEdgesGeo} material={geometries.edgeCyanMat} />
        </group>
      ))}

      {/* Tinted Panoramic Greenhouse Canopy */}
      <mesh geometry={geometries.canopyGeo} material={geometries.canopyMat} />
      <lineSegments geometry={geometries.canopyEdgesGeo} material={geometries.edgeCanopyMat} />

      {/* Front Carbon Aero Splitter */}
      <mesh position={[0, 0.145, 0]} geometry={geometries.splitterGeo} material={geometries.trimMat} />
      <lineSegments
        position={[0, 0.145, 0]}
        geometry={geometries.splitterEdgesGeo}
        material={geometries.edgeCyanMat}
      />

      {/* Side Aero Intake Channel Rails & Wing Mirrors */}
      {[1, -1].map((side) => (
        <group key={`aero-${side}`} scale={[1, 1, side]}>
          <mesh geometry={geometries.intakeTubeGeo}>
            <meshStandardMaterial
              color="#00D9FF"
              emissive="#00D9FF"
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.25}
            />
          </mesh>
          {/* Mirror Stalk & Blade */}
          <mesh position={[0.48, 0.80, 0.76]} rotation={[0.2, 0.15, 0]}>
            <boxGeometry args={[0.14, 0.042, 0.16]} />
            <meshStandardMaterial color="#141B26" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Front LED Light Blades */}
      {[1, -1].map((side) => (
        <group key={`headlight-${side}`} position={[1.90, 0.49, side * 0.58]} rotation={[0, side * -0.22, 0]}>
          <mesh geometry={geometries.ledBladeGeo}>
            <meshStandardMaterial
              color="#E8EDF3"
              emissive={elecGlow || '#00D9FF'}
              emissiveIntensity={elecGlow ? 2.1 : 1.45}
            />
          </mesh>
        </group>
      ))}

      {/* Rear Horizon LED Tail Light Bar & Diffuser Strakes */}
      <mesh position={[-2.15, 0.72, 0]}>
        <boxGeometry args={[0.04, 0.032, 1.48]} />
        <meshStandardMaterial
          color="#FF3B5C"
          emissive={brakeGlow || '#FF3B5C'}
          emissiveIntensity={brakeGlow ? 2.0 : 1.1}
        />
      </mesh>
      {[-0.48, -0.24, 0, 0.24, 0.48].map((zPos) => (
        <mesh key={zPos} position={[-2.04, 0.22, zPos]}>
          <boxGeometry args={[0.32, 0.13, 0.022]} />
          <meshStandardMaterial color="#0A0E14" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* Dark Wheel-Well Backing Drums */}
      {[
        [1.34, 0.36, 0.62],
        [1.34, 0.36, -0.62],
        [-1.34, 0.36, 0.62],
        [-1.34, 0.36, -0.62],
      ].map((pos, idx) => (
        <mesh key={`well-${idx}`} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.26, 24]} />
          <meshStandardMaterial color="#07090C" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* 4 Multi-Part Alloy Wheels + Drilled Brake Rotors + Calipers */}
      <CoupeWheel
        position={[1.34, 0.355, 0.78]}
        isRear={false}
        isRightSide
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        reducedMotion={reducedMotion}
      />
      <CoupeWheel
        position={[1.34, 0.355, -0.78]}
        isRear={false}
        isRightSide={false}
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        reducedMotion={reducedMotion}
      />
      <CoupeWheel
        position={[-1.34, 0.37, 0.80]}
        isRear
        isRightSide
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        reducedMotion={reducedMotion}
      />
      <CoupeWheel
        position={[-1.34, 0.37, -0.80]}
        isRear
        isRightSide={false}
        geometries={geometries}
        brakeGlowColor={brakeGlow}
        suspensionGlowColor={suspGlow}
        reducedMotion={reducedMotion}
      />

      {/* Internal Diagnostic Subsystem Cores (illuminated on active or Warning/Critical) */}
      {/* Engine Core Block */}
      <group position={[0.96, 0.48, 0]}>
        <mesh>
          <boxGeometry args={[0.56, 0.26, 0.48]} />
          <meshStandardMaterial
            color="#1B2430"
            emissive={engineGlow || '#00D9FF'}
            emissiveIntensity={engineGlow ? 0.95 : 0.14}
            metalness={0.85}
            roughness={0.28}
            transparent
            opacity={engineGlow ? 0.95 : 0.55}
          />
        </mesh>
      </group>

      {/* Thermal & Oil Radiator Core */}
      <mesh position={[1.82, 0.38, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.14, 0.24, 0.78]} />
        <meshStandardMaterial
          color="#15202E"
          emissive={thermalGlow || '#00D9FF'}
          emissiveIntensity={thermalGlow ? 1.15 : 0.18}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Electrical Bus Spine */}
      <mesh position={[0.15, 0.42, 0]}>
        <boxGeometry args={[0.92, 0.08, 0.24]} />
        <meshStandardMaterial
          color="#0F202D"
          emissive={elecGlow || '#00D9FF'}
          emissiveIntensity={elecGlow ? 1.2 : 0.2}
        />
      </mesh>

      {/* Drivetrain / Transmission Tunnel */}
      <mesh position={[-0.65, 0.37, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.13, 0.85, 16]} />
        <meshStandardMaterial
          color="#1B2430"
          emissive={transGlow || '#00D9FF'}
          emissiveIntensity={transGlow ? 1.05 : 0.14}
          metalness={0.88}
          roughness={0.25}
        />
      </mesh>

      {/* Fuel Delivery Saddle Tank */}
      <mesh position={[-1.02, 0.54, 0]}>
        <boxGeometry args={[0.42, 0.20, 0.72]} />
        <meshStandardMaterial
          color="#16202C"
          emissive={fuelGlow || '#00D9FF'}
          emissiveIntensity={fuelGlow ? 1.1 : 0.12}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}
