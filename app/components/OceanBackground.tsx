'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uElevation;
  uniform vec2 uCursor;
  uniform float uImpactRadius;
  uniform float uImpactStrength;
  uniform float uProgress; // [REVISI] Tambahan uniform untuk transisi awal
  
  varying float vElevation;
  varying vec2 vUv;
  
  // Classic Perlin 3D Noise 
  // by Stefan Gustavson
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }

  void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Multi-octave Perlin ocean waves
    float elevation = cnoise(vec3(modelPosition.xz * 1.5, uTime * uSpeed)) * uElevation;
    elevation += cnoise(vec3(modelPosition.xz * 3.0, uTime * uSpeed * 1.5)) * (uElevation * 0.5);
    
    // [REVISI] Kalikan gelombang utama dengan uProgress agar tidak langsung menyentak saat awal render
    elevation *= uProgress;
    
    // Interactive mouse waves displacement
    float distToCursor = distance(modelPosition.xz, uCursor);
    float cursorEffect = smoothstep(1.8, 0.0, distToCursor) * 0.08;
    elevation += cursorEffect;
    
    // Sinking bottle impact ripples (concentric waves expanding)
    float distToCenter = length(modelPosition.xz);
    float waveRing = sin((distToCenter - uImpactRadius) * 12.0);
    float ringDecay = smoothstep(0.8, 0.0, abs(distToCenter - uImpactRadius)) * smoothstep(5.0, 0.0, distToCenter);
    elevation += waveRing * ringDecay * uImpactStrength * 0.12;
    
    modelPosition.y += elevation;
    
    vElevation = elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uDepthColor;
  uniform vec3 uSurfaceColor;
  uniform float uColorOffset;
  uniform float uColorMultiplier;
  
  varying float vElevation;
  varying vec2 vUv;
  
  void main() {
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // Add wave crest highlights (foam)
    float crest = smoothstep(0.12, 0.28, vElevation);
    color += crest * vec3(0.12, 0.22, 0.32);
    
    // Add subtle gradient to fade out at the edges
    float fade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    
    gl_FragColor = vec4(color, fade * 0.8);
  }
`;

const oceanThemes = {
  day: {
    depth: '#0d1d2d',
    surface: '#2260a8',
  },
  dusk: {
    depth: '#061224',
    surface: '#1b4e96',
  },
  night: {
    depth: '#020617',
    surface: '#06b6d4',
  }
};

interface WaveMeshProps {
  isStormy: boolean;
  timeOfDay: string;
  mousePos: { x: number; y: number };
  gridSegments: [number, number];
}

function WaveMesh({ isStormy, timeOfDay, mousePos, gridSegments }: WaveMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const tempColorDepth = useMemo(() => new THREE.Color(), []);
  const tempColorSurface = useMemo(() => new THREE.Color(), []);
  const impactRadiusRef = useRef(0.0);
  const impactStrengthRef = useRef(0.0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.28 },     // [REVISI] Samakan initial value dengan target biar lebih smooth
      uElevation: { value: 0.14 }, // [REVISI] Samakan initial value dengan target
      uDepthColor: { value: new THREE.Color(oceanThemes.night.depth) },
      uSurfaceColor: { value: new THREE.Color(oceanThemes.night.surface) },
      uColorOffset: { value: 0.08 },
      uColorMultiplier: { value: 4.0 },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uImpactRadius: { value: 0 },
      uImpactStrength: { value: 0 },
      uProgress: { value: 0.0 } // [REVISI] Set progress awal 0
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // [REVISI] Naikkan progress dari 0 ke 1 secara bertahap saat komponen muncul
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        1.0,
        0.02 // Kamu bisa kecilkan angkanya kalau mau lebih pelan naiknya, misal 0.01
      );

      // Always keep speed and elevation at serene, calm constants
      const targetSpeed = 0.28;
      const targetElevation = 0.14;

      materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uSpeed.value,
        targetSpeed,
        0.05
      );
      materialRef.current.uniforms.uElevation.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uElevation.value,
        targetElevation,
        0.05
      );

      // Smoothly lerp depth and surface colors
      const themeColors = oceanThemes[timeOfDay as keyof typeof oceanThemes] || oceanThemes.night;
      tempColorDepth.set(themeColors.depth);
      tempColorSurface.set(themeColors.surface);

      materialRef.current.uniforms.uDepthColor.value.lerp(tempColorDepth, 0.03);
      materialRef.current.uniforms.uSurfaceColor.value.lerp(tempColorSurface, 0.03);

      // Interpolate cursor coords to avoid coordinate jumps
      // Map [-1, 1] to [-5, 5]
      const targetCursorX = mousePos.x * 5.0;
      const targetCursorZ = -mousePos.y * 5.0; // Y on screen maps to Z in WebGL vertical

      materialRef.current.uniforms.uCursor.value.x = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uCursor.value.x,
        targetCursorX,
        0.08
      );
      materialRef.current.uniforms.uCursor.value.y = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uCursor.value.y,
        targetCursorZ,
        0.08
      );

      // Sinking bottle impact ripples are disabled to keep waves perfectly serene
      impactRadiusRef.current = 0.0;
      impactStrengthRef.current = 0.0;

      materialRef.current.uniforms.uImpactRadius.value = impactRadiusRef.current;
      materialRef.current.uniforms.uImpactStrength.value = impactStrengthRef.current;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[24, 12, gridSegments[0], gridSegments[1]]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        wireframe={false}
      />
    </mesh>
  );
}

interface OceanBackgroundProps {
  stage: string;
  timeOfDay: string;
  mousePos: { x: number; y: number };
  fogColor: string;
}

export default function OceanBackground({ stage, timeOfDay, mousePos, fogColor }: OceanBackgroundProps) {
  const isStormy = stage === 'releasing';
  const [gridSegments, setGridSegments] = useState<[number, number]>([128, 128]);
  const [dpr, setDpr] = useState<number>(2);

  useEffect(() => {
    // Perform performance checks on mount to adjust vertex complexity
    const isMobile = window.innerWidth < 768;
    setGridSegments(isMobile ? [64, 64] : [128, 128]);
    setDpr(isMobile ? 1.5 : 2);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[50vh] z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0.6, 2.5], fov: 45 }} dpr={dpr}>
        <fog attach="fog" args={[fogColor, 1.0, 3.8]} />
        <WaveMesh
          isStormy={isStormy}
          timeOfDay={timeOfDay}
          mousePos={mousePos}
          gridSegments={gridSegments}
        />
      </Canvas>
    </div>
  );
}