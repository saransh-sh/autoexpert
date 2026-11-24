import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Recursively disposes Three.js geometries, materials, and attached textures
 * across an Object3D subtree to prevent WebGL resource leaks on unmount.
 */
export function disposeObjectTree(root) {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((obj) => {
    if (obj.geometry) {
      geometries.add(obj.geometry);
    }
    if (obj.material) {
      const matList = Array.isArray(obj.material) ? obj.material : [obj.material];
      matList.forEach((mat) => {
        if (!mat) return;
        materials.add(mat);
        Object.values(mat).forEach((val) => {
          if (val && val.isTexture) {
            textures.add(val);
          }
        });
      });
    }
  });

  geometries.forEach((geo) => geo.dispose());
  materials.forEach((mat) => mat.dispose());
  textures.forEach((tex) => tex.dispose());
}

/**
 * Generates a soft circular radial sprite texture on an offscreen canvas
 * for crisp anti-aliased telemetry particles without external texture requests.
 */
function createParticleSpriteTexture() {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.28, 'rgba(220, 248, 255, 0.85)');
  gradient.addColorStop(0.65, 'rgba(0, 217, 255, 0.28)');
  gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an offscreen grayscale alphaMap for the volumetric scan veil so
 * left/right edges and the upper boundary feather cleanly to 0 opacity.
 */
function createScanVeilTexture() {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y += 1) {
    // Canvas y=0 maps to UV v=1 (top of plane); y=size-1 maps to UV v=0 (floor)
    const yNorm = y / (size - 1);
    const vy = Math.pow(Math.max(0, (yNorm - 0.1) / 0.9), 2.15);

    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const hx = Math.pow(Math.sin(u * Math.PI), 1.8);
      const lum = Math.round(255 * hx * vy);
      const idx = (y * size + x) * 4;
      data[idx] = lum;
      data[idx + 1] = lum;
      data[idx + 2] = lum;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds deterministic radial calibration tick marks for the ground telemetry ring.
 */
function buildTickGeometry(radius, tickCount, innerOffset, outerOffset) {
  const positions = new Float32Array(tickCount * 6);
  for (let i = 0; i < tickCount; i += 1) {
    const angle = (i / tickCount) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const r0 = radius - (isMajor ? innerOffset * 1.8 : innerOffset);
    const r1 = radius + (isMajor ? outerOffset * 1.6 : outerOffset);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const idx = i * 6;
    positions[idx] = cos * r0;
    positions[idx + 1] = 0;
    positions[idx + 2] = sin * r0;
    positions[idx + 3] = cos * r1;
    positions[idx + 4] = 0;
    positions[idx + 5] = sin * r1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

export default function HologramEffects({
  vehicleType = 'car',
  scannerActive = true,
  reducedMotion = false,
  isMobile = false,
}) {
  const effectsRootRef = useRef(null);
  const scanGateRef = useRef(null);
  const scanMatRef = useRef(null);
  const scanBeamMatRef = useRef(null);
  const outerRingRef = useRef(null);
  const innerRingRef = useRef(null);
  const pointsRef = useRef(null);

  const isMoto = vehicleType === 'motorcycle';
  const scanSpan = isMoto ? 1.45 : 2.38;
  const scanHeight = isMoto ? 1.38 : 1.44;
  const scanDepth = isMoto ? 1.05 : 2.15;
  const ringRadius = isMoto ? 1.62 : 2.52;
  const particleCount = reducedMotion ? 24 : isMobile ? 42 : 120;

  const {
    outerTicksGeo,
    innerTicksGeo,
    particleGeo,
    particleSeeds,
    particleTexture,
    scanVeilTexture,
    tickMaterial,
    innerTickMaterial,
    particleMaterial,
  } = useMemo(() => {
    const outerTicks = buildTickGeometry(ringRadius, 72, 0.04, 0.05);
    const innerTicks = buildTickGeometry(ringRadius * 0.72, 36, 0.03, 0.03);

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color('#00D9FF');
    const lime = new THREE.Color('#C7FF4A');
    const coolWhite = new THREE.Color('#E8EDF3');

    for (let i = 0; i < particleCount; i += 1) {
      // Deterministic quasi-random distribution around the hologram turntable
      const t1 = ((i * 73.13 + 17.7) % 100) / 100;
      const t2 = ((i * 37.91 + 43.3) % 100) / 100;
      const t3 = ((i * 91.57 + 11.1) % 100) / 100;

      const angle = t1 * Math.PI * 2;
      const radial = (isMoto ? 0.7 : 1.05) + t2 * (isMoto ? 1.6 : 2.35);
      const y = 0.08 + t3 * 1.95;

      const idx = i * 3;
      positions[idx] = Math.cos(angle) * radial;
      positions[idx + 1] = y;
      positions[idx + 2] = Math.sin(angle) * radial;

      seeds[idx] = angle;
      seeds[idx + 1] = radial;
      seeds[idx + 2] = 0.25 + t2 * 0.55;

      const tone = i % 11 === 0 ? lime : i % 4 === 0 ? coolWhite : cyan;
      colors[idx] = tone.r;
      colors[idx + 1] = tone.g;
      colors[idx + 2] = tone.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const tex = createParticleSpriteTexture();
    const veilTex = createScanVeilTexture();

    const tMat = new THREE.LineBasicMaterial({
      color: '#00D9FF',
      transparent: true,
      opacity: 0.26,
    });
    const itMat = new THREE.LineBasicMaterial({
      color: '#8B96A5',
      transparent: true,
      opacity: 0.18,
    });

    const pMat = new THREE.PointsMaterial({
      size: isMobile ? 0.08 : 0.065,
      map: tex,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return {
      outerTicksGeo: outerTicks,
      innerTicksGeo: innerTicks,
      particleGeo: pGeo,
      particleSeeds: seeds,
      particleTexture: tex,
      scanVeilTexture: veilTex,
      tickMaterial: tMat,
      innerTickMaterial: itMat,
      particleMaterial: pMat,
    };
  }, [isMobile, isMoto, particleCount, ringRadius]);

  useEffect(() => {
    if (particleTexture) {
      particleTexture.needsUpdate = true;
    }
    if (scanVeilTexture) {
      scanVeilTexture.needsUpdate = true;
    }
    const rootSnapshot = effectsRootRef.current;
    return () => {
      outerTicksGeo.dispose();
      innerTicksGeo.dispose();
      particleGeo.dispose();
      tickMaterial.dispose();
      innerTickMaterial.dispose();
      particleMaterial.dispose();
      if (particleTexture) {
        particleTexture.dispose();
      }
      if (scanVeilTexture) {
        scanVeilTexture.dispose();
      }
      disposeObjectTree(rootSnapshot);
    };
  }, [
    outerTicksGeo,
    innerTicksGeo,
    particleGeo,
    tickMaterial,
    innerTickMaterial,
    particleMaterial,
    particleTexture,
    scanVeilTexture,
  ]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;

    if (scanGateRef.current && scanMatRef.current && scanBeamMatRef.current) {
      if (!scannerActive) {
        scanMatRef.current.opacity = THREE.MathUtils.lerp(scanMatRef.current.opacity, 0, dt * 6);
        scanBeamMatRef.current.opacity = THREE.MathUtils.lerp(
          scanBeamMatRef.current.opacity,
          0,
          dt * 6
        );
      } else if (reducedMotion) {
        scanGateRef.current.position.x = 0.18;
        scanMatRef.current.opacity = 0.18;
        scanBeamMatRef.current.opacity = 0.6;
      } else {
        const sweep = Math.sin(elapsed * 0.88);
        scanGateRef.current.position.x = sweep * scanSpan;
        const edgeFade = 1 - Math.pow(Math.abs(sweep), 3.5);
        scanMatRef.current.opacity = 0.06 + edgeFade * 0.18;
        scanBeamMatRef.current.opacity = 0.22 + edgeFade * 0.65;
      }
    }

    if (!reducedMotion) {
      if (outerRingRef.current) {
        outerRingRef.current.rotation.y += dt * 0.045;
      }
      if (innerRingRef.current) {
        innerRingRef.current.rotation.y -= dt * 0.07;
      }
      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position;
        const arr = posAttr.array;
        for (let i = 0; i < particleCount; i += 1) {
          const idx = i * 3;
          const baseAngle = particleSeeds[idx];
          const radial = particleSeeds[idx + 1];
          const speed = particleSeeds[idx + 2];

          const angle = baseAngle + elapsed * 0.06 * speed;
          arr[idx] = Math.cos(angle) * radial;
          arr[idx + 2] = Math.sin(angle) * radial;

          let y = arr[idx + 1] + dt * 0.09 * speed;
          if (y > 2.08) y = 0.08;
          arr[idx + 1] = y;
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={effectsRootRef} name="nexus-hologram-effects">
      {/* #07090C Atmospheric Depth Fog */}
      <fog attach="fog" args={['#07090C', 6.8, 16.5]} />

      {/* Studio 3-Point + Cyan Rim Lighting */}
      <ambientLight intensity={0.5} color="#B8CCE0" />
      <hemisphereLight args={['#A9C8E8', '#07090C', 0.62]} />
      <directionalLight position={[5.2, 7.2, 4.4]} intensity={1.75} color="#E8EDF3" />
      <directionalLight position={[-5.4, 3.8, -4.2]} intensity={1.45} color="#00D9FF" />
      <pointLight position={[0, 0.55, 2.9]} intensity={0.85} distance={6.5} color="#00D9FF" />
      <pointLight position={[-2.8, 2.2, 2.2]} intensity={0.65} distance={6.5} color="#7CE8FF" />

      {/* Subtle Obsidian Studio Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow={false}>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial
          color="#07090C"
          metalness={0.85}
          roughness={0.38}
          transparent
          opacity={0.94}
        />
      </mesh>

      {/* Telemetry Concentric Ground Rings */}
      <group ref={outerRingRef} position={[0, 0.004, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringRadius - 0.012, ringRadius + 0.012, 96]} />
          <meshBasicMaterial
            color="#00D9FF"
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments geometry={outerTicksGeo} material={tickMaterial} />
      </group>

      <group ref={innerRingRef} position={[0, 0.005, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringRadius * 0.72 - 0.008, ringRadius * 0.72 + 0.008, 72]} />
          <meshBasicMaterial
            color="#8B96A5"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments geometry={innerTicksGeo} material={innerTickMaterial} />
      </group>

      {/* Inner Static Floor Anchor Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[ringRadius * 0.42 - 0.006, ringRadius * 0.42 + 0.006, 64]} />
        <meshBasicMaterial
          color="#00D9FF"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Sweeping Cyan Lidar Scan Veil */}
      <group ref={scanGateRef} position={[0, scanHeight * 0.5, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[scanDepth, scanHeight]} />
          <meshBasicMaterial
            ref={scanMatRef}
            color="#00D9FF"
            alphaMap={scanVeilTexture}
            transparent
            opacity={scannerActive ? 0.22 : 0}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* Floor Laser Filament */}
        <mesh position={[0, -scanHeight * 0.495, 0]}>
          <boxGeometry args={[0.014, 0.012, scanDepth * 0.92]} />
          <meshBasicMaterial
            ref={scanBeamMatRef}
            color="#00D9FF"
            transparent
            opacity={scannerActive ? 0.65 : 0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Ambient Floating Telemetry Particles */}
      <points ref={pointsRef} geometry={particleGeo} material={particleMaterial} />
    </group>
  );
}
