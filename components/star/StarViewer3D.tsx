'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import GLBModelViewer from './GLBModelViewer';

// Map planet names → GLB paths + viewer config.
const PLANET_GLB_CONFIG: Record<string, {
  path: string;
  atmosphereColor: string;
  showAtmosphere?: boolean;
  rotationSpeed?: number;
  modelScale?: number;
  cameraZ?: number;
}> = {
  earth:   { path: '/models/earth.glb', atmosphereColor: '#3a8fff', showAtmosphere: false, rotationSpeed: 0.12, modelScale: 1.8, cameraZ: 5 },
  mars:    { path: '/models/mars.glb',    atmosphereColor: '#cc4422', rotationSpeed: 0.10, modelScale: 1.8, cameraZ: 5 },
  saturn:  { path: '/models/saturn.glb',  atmosphereColor: '#d4b070', rotationSpeed: 0.08, modelScale: 2.0, cameraZ: 6 },
  jupiter: { path: '/models/jupiter.glb', atmosphereColor: '#d4906a', rotationSpeed: 0.20, modelScale: 2.0, cameraZ: 6 },
  moon:    { path: '/models/moon.glb',    atmosphereColor: '#888888', showAtmosphere: false, rotationSpeed: 0.05, modelScale: 1.6, cameraZ: 5 },
  sun:     { path: '/models/sun.glb',     atmosphereColor: '#ffaa00', rotationSpeed: 0.05, modelScale: 2.0, cameraZ: 6 },
  venus:   { path: '/models/venus.glb',   atmosphereColor: '#e3bb76', rotationSpeed: 0.06, modelScale: 1.8, cameraZ: 5 },
  mercury: { path: '/models/mercury.glb', atmosphereColor: '#999999', showAtmosphere: false, rotationSpeed: 0.04, modelScale: 1.5, cameraZ: 5 },
  uranus:  { path: '/models/uranus.glb',  atmosphereColor: '#7de8e8', rotationSpeed: 0.10, modelScale: 1.8, cameraZ: 5 },
  neptune: { path: '/models/neptune.glb', atmosphereColor: '#4455dd', rotationSpeed: 0.12, modelScale: 1.8, cameraZ: 5 },
  'solar system': { path: '/models/solar_system_animation.glb', atmosphereColor: '#ffffff', showAtmosphere: false, rotationSpeed: 0.05, modelScale: 4.5, cameraZ: 5.5 },
};

interface StarViewer3DProps {
  spectralClass?: string;
  starType?: string;
  name?: string;
  fullScreen?: boolean;
}

export default function StarViewer3D({ spectralClass, starType, name = '', fullScreen = false }: StarViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const isPlanetType = starType === 'Planet' || starType === 'Dwarf Planet';
  const planetKey = Object.keys(PLANET_GLB_CONFIG).find((key) => name.toLowerCase().includes(key));
  const glbConfig = planetKey ? PLANET_GLB_CONFIG[planetKey] : undefined;

  if (glbConfig) {
    return (
      <GLBModelViewer
        modelPath={glbConfig.path}
        planetName={name}
        atmosphereColor={glbConfig.atmosphereColor}
        showAtmosphere={!!glbConfig.showAtmosphere}
        rotationSpeed={glbConfig.rotationSpeed}
        modelScale={glbConfig.modelScale}
        cameraZ={glbConfig.cameraZ}
        enableZoom={!fullScreen}
      />
    );
  }

  useEffect(() => {
    if (!mountRef.current) return;

    const isPlanet = starType === 'Planet' || starType === 'Dwarf Planet';
    const planetName = name.toLowerCase();
    const cls = spectralClass ? spectralClass[0].toUpperCase() : 'G';

    let coreColor = 0xFFF4D4;
    let glowColor = 0xFFD297;
    let isSaturn = false;
    
    // Shader Uniforms
    let uNoiseScale = 0.8; 
    let uSpeed = 0.05;
    let coreScale = 1.5;
    let bloomIntensity = 1.0;
    let bloomRadius = 0.8;
    let bloomThreshold = 0.0;

    if (isPlanet) {
      if (planetName.includes('mars')) { coreColor = 0xC1440E; glowColor = 0x8B3A3A; }
      else if (planetName.includes('jupiter')) { coreColor = 0xd39c7e; glowColor = 0xe0c9a6; }
      else if (planetName.includes('earth')) { coreColor = 0x1E90FF; glowColor = 0x228B22; }
      else if (planetName.includes('mercury')) { coreColor = 0xaaaaaa; glowColor = 0x888888; }
      else if (planetName.includes('venus')) { coreColor = 0xe3bb76; glowColor = 0xc9a05b; }
      else if (planetName.includes('moon')) { coreColor = 0x999999; glowColor = 0x555555; }
      else if (planetName.includes('saturn')) { coreColor = 0xe3cdb2; glowColor = 0xd4b499; isSaturn = true; }
      else if (planetName.includes('uranus')) { coreColor = 0xadd8e6; glowColor = 0x87ceeb; }
      else if (planetName.includes('neptune')) { coreColor = 0x4b70dd; glowColor = 0x3a57b5; }
      else if (planetName.includes('pluto')) { coreColor = 0xddc4b0; glowColor = 0x9c8978; }
      else { coreColor = 0x999999; glowColor = 0x333333; }
    } else {
      // PER-STAR PERSONALITIES
      if (planetName.includes('vega')) {
        coreColor = 0xF5F8FF; glowColor = 0xC4D8FF;
        coreScale = 1.2; bloomIntensity = 2.5; bloomRadius = 1.5; uSpeed = 0.08; uNoiseScale = 1.1;
      } else if (planetName.includes('sirius')) {
        coreColor = 0xDEE9FF; glowColor = 0x9CBBFF; 
        coreScale = 1.3; bloomIntensity = 3.0; bloomRadius = 1.8; uSpeed = 0.12; uNoiseScale = 1.3;
      } else if (planetName.includes('arcturus')) {
        coreColor = 0xFFBA8A; glowColor = 0xFF7633; 
        coreScale = 2.3; bloomIntensity = 1.5; bloomRadius = 1.0; uSpeed = 0.02; uNoiseScale = 0.4;
      } else if (planetName.includes('betelgeuse') || planetName.includes('antares')) {
        coreColor = 0xFF9E6B; glowColor = 0xFF3B00; 
        coreScale = 2.8; bloomIntensity = 1.8; bloomRadius = 1.2; uSpeed = 0.015; uNoiseScale = 0.3;
      } else if (planetName.includes('alnitak') || planetName.includes('rigel')) {
        coreColor = 0xC4D8FF; glowColor = 0x6A9EFF;
        coreScale = 2.0; bloomIntensity = 2.8; bloomRadius = 1.6; uSpeed = 0.15; uNoiseScale = 0.9;
      } else {
        // Fallbacks for spectral classes
        switch (cls) {
          case 'O': coreColor = 0xC4D8FF; glowColor = 0x6A9EFF; uNoiseScale = 1.2; uSpeed = 0.15; bloomIntensity = 2.8; bloomRadius = 1.6; break;
          case 'B': coreColor = 0xDDEBFF; glowColor = 0x9CBBFF; uNoiseScale = 1.0; uSpeed = 0.12; bloomIntensity = 2.5; bloomRadius = 1.5; break;
          case 'A': coreColor = 0xF5F8FF; glowColor = 0xCCDEFF; uNoiseScale = 0.9; uSpeed = 0.1; bloomIntensity = 2.0; bloomRadius = 1.2; break;
          case 'F': coreColor = 0xFFFBEA; glowColor = 0xFFEAC8; uNoiseScale = 0.8; uSpeed = 0.08; bloomIntensity = 1.5; bloomRadius = 0.8; break;
          case 'G': coreColor = 0xFFF4D4; glowColor = 0xFFD297; uNoiseScale = 0.7; uSpeed = 0.06; bloomIntensity = 1.2; bloomRadius = 0.6; break;
          case 'K': coreColor = 0xFFD0A1; glowColor = 0xFF9C63; uNoiseScale = 0.6; uSpeed = 0.04; bloomIntensity = 1.1; bloomRadius = 0.7; break;
          case 'M': coreColor = 0xFFB38A; glowColor = 0xFF5511; uNoiseScale = 0.4; uSpeed = 0.02; bloomIntensity = 1.4; bloomRadius = 0.9; break;
          default: coreColor = 0xFFF4D4; glowColor = 0xFFD297; uNoiseScale = 0.7; uSpeed = 0.06; bloomIntensity = 1.2; bloomRadius = 0.6; break;
        }
      }
    }

    const scene = new THREE.Scene();
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const fov = aspect < 1 ? 65 : 45;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.z = aspect < 1 ? 14 : 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isPlanet ? 1.2 : 1.4; 
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'none';
    mountRef.current.appendChild(renderer.domElement);

    // UNREAL BLOOM POSTPROCESSING 
    let composer: EffectComposer | null = null;
    if (!isPlanet) {
      const renderScene = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
        bloomIntensity,   // strength
        bloomRadius,      // radius
        bloomThreshold    // threshold
      );
      
      composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 25;

    let userActivity = 0.0;
    const maxActivity = 2.5;
    
    controls.addEventListener('change', () => {
      userActivity = Math.min(userActivity + 0.15, maxActivity);
    });

    // --- LAYER 1 & 2: CORE SPHERE + ANIMATED PLASMA SHADER ---
    const geometry = new THREE.SphereGeometry(coreScale, 128, 128);
    
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uGlowColor;
      uniform float uNoiseScale;
      uniform float uSpeed;
      uniform float uActivity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      // 3 octaves for violent boiling plasma
      float fbm(vec3 p) {
        float f = 0.0;
        f += 0.5 * snoise(p);
        f += 0.25 * snoise(p * 2.0);
        f += 0.125 * snoise(p * 4.0);
        return f;
      }

      void main() {
        float currentSpeed = uSpeed * (1.0 + uActivity);
        
        vec3 p = vPosition * uNoiseScale + vec3(0.0, uTime * currentSpeed, uTime * (currentSpeed * 0.8));
        
        // Large, boiling convection cells
        float n = fbm(p);
        
        // Add violent turbulence
        n += snoise(p * 2.0 - vec3(uTime * currentSpeed * 2.0)) * 0.3;

        n = n * 0.5 + 0.5; // 0 to 1
        
        // Hotter, glowing plasma
        vec3 hotColor = min(uColor * 2.5, vec3(1.0));
        vec3 deepColor = uGlowColor * 0.5; // Increased contrast for power feel
        
        // Sharp interpolation for boiling energy
        vec3 color = mix(deepColor, hotColor, smoothstep(0.2, 0.8, n));
        
        // Ensure the star appears emissive
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = max(dot(vNormal, viewDir), 0.0);
        
        // Fresnel Cinematic Glow (Edges very bright, center softer)
        float fresnel = pow(1.0 - intensity, 2.5);
        color += uGlowColor * fresnel * 1.5;
        
        // Final HDR-like emission multiplication
        gl_FragColor = vec4(color * 1.8, 1.0);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(coreColor) },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uNoiseScale: { value: uNoiseScale },
      uSpeed: { value: uSpeed },
      uActivity: { value: 0.0 },
    };

    let material;
    if (isPlanet) {
      const planetFragmentShader = `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uColor2;
        uniform int uPlanetType;
        varying vec3 vNormal;
        varying vec3 vPosition;
        float hash(vec3 p) { p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float noise(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float f = 0.0; f += 0.5000 * noise(p); p = p * 2.02; f += 0.2500 * noise(p); p = p * 2.03; f += 0.1250 * noise(p); p = p * 2.01; f += 0.0625 * noise(p); return f; }
        void main() {
          float n = 0.0; vec3 color = uColor; float roughness = 0.8; float specularIntensity = 0.2;
          if (uPlanetType == 2) { vec3 p = vPosition * vec3(1.5, 5.0, 1.5); n = fbm(p + vec3(uTime * 0.02, 0.0, uTime * 0.02)); float band = sin(vPosition.y * 12.0 + n * 2.5); color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band)); float storm = fbm(vPosition * 4.0 - vec3(uTime * 0.05)); color = mix(color, vec3(0.8, 0.5, 0.3), smoothstep(0.7, 1.0, storm) * 0.5); specularIntensity = 0.1; }
          else if (uPlanetType == 3) { n = fbm(vPosition * 3.0); if (n < 0.45) { color = uColor; specularIntensity = 0.8; roughness = 0.2; } else { color = mix(uColor2, vec3(0.8, 0.7, 0.5), smoothstep(0.45, 0.7, n)); specularIntensity = 0.1; roughness = 0.9; } float clouds = fbm(vPosition * 4.0 + vec3(uTime * 0.01)); if (clouds > 0.55) { color = mix(color, vec3(1.0), (clouds - 0.55) * 2.5); specularIntensity = 0.05; } }
          else if (uPlanetType == 1) { n = fbm(vPosition * 3.0); color = mix(uColor, uColor2, n); float craters = fbm(vPosition * 8.0); color *= mix(0.6, 1.0, smoothstep(0.3, 0.6, craters)); specularIntensity = 0.05; }
          else if (uPlanetType == 4) { n = fbm(vPosition * 10.0); float craters = fbm(vPosition * 20.0); color = mix(uColor, uColor2, n); color *= mix(0.4, 1.0, smoothstep(0.2, 0.8, craters)); specularIntensity = 0.1; }
          else if (uPlanetType == 5) { vec3 p = vPosition * vec3(2.0, 4.0, 2.0); n = fbm(p + vec3(uTime * 0.015, 0.0, -uTime * 0.01)); float band = sin(vPosition.y * 8.0 + n * 3.0); color = mix(uColor, uColor2, smoothstep(-0.4, 0.4, band)); specularIntensity = 0.05; }
          else if (uPlanetType == 6) { n = fbm(vPosition * 2.0); float craters = fbm(vPosition * 15.0); color = mix(uColor, uColor2, smoothstep(0.3, 0.7, n)); color *= mix(0.5, 1.0, smoothstep(0.4, 0.6, craters)); specularIntensity = 0.02; }
          else if (uPlanetType == 7) { vec3 p = vPosition * vec3(1.0, 6.0, 1.0); n = fbm(p + vec3(0.0, uTime * 0.005, 0.0)); float band = sin(vPosition.y * 15.0 + n * 0.5); color = mix(uColor, uColor2, smoothstep(-0.8, 0.8, band)); specularIntensity = 0.15; }
          else if (uPlanetType == 8) { n = fbm(vPosition * vec3(1.0, 8.0, 1.0)); color = mix(uColor, uColor2, n * 0.2); specularIntensity = 0.2; }
          else if (uPlanetType == 9) { vec3 p = vPosition * vec3(1.5, 4.0, 1.5); n = fbm(p + vec3(uTime * 0.04, 0.0, 0.0)); float band = sin(vPosition.y * 10.0 + n); color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band)); float storm = fbm(vPosition * 5.0 - vec3(uTime * 0.08)); if (storm > 0.65) { color = mix(color, vec3(1.0), (storm - 0.65) * 3.0); } specularIntensity = 0.2; }
          else if (uPlanetType == 10) { n = fbm(vPosition * 3.5); color = mix(uColor, uColor2, smoothstep(0.3, 0.6, n)); specularIntensity = 0.1; }
          else { n = fbm(vPosition * 3.0 + vec3(uTime * 0.01)); color = mix(uColor, uColor2, n); specularIntensity = 0.1; }
          
          vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0)); vec3 viewDir = normalize(cameraPosition - vPosition); vec3 halfVector = normalize(lightDir + viewDir);
          float diff = max(dot(vNormal, lightDir), 0.0);
          float spec = pow(max(dot(vNormal, halfVector), 0.0), 128.0 * (1.0 - roughness)) * specularIntensity;
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0); rim = smoothstep(0.5, 1.0, rim); vec3 rimColor = mix(uColor2, vec3(1.0), 0.5);
          vec3 ambient = vec3(0.02, 0.02, 0.05);
          vec3 finalColor = color * diff + ambient; finalColor += vec3(1.0) * spec * diff; 
          if (uPlanetType != 6 && uPlanetType != 4 && uPlanetType != 10) { finalColor += rimColor * rim * diff * 0.8; }
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      let pType = 0; let color2 = glowColor;
      if (planetName.includes('mars')) pType = 1; else if (planetName.includes('jupiter')) pType = 2; else if (planetName.includes('earth')) pType = 3; else if (planetName.includes('mercury')) pType = 4; else if (planetName.includes('venus')) pType = 5; else if (planetName.includes('moon')) pType = 6; else if (planetName.includes('saturn')) pType = 7; else if (planetName.includes('uranus')) pType = 8; else if (planetName.includes('neptune')) pType = 9; else if (planetName.includes('pluto')) pType = 10;
      
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: planetFragmentShader,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(coreColor) }, uColor2: { value: new THREE.Color(color2) }, uPlanetType: { value: pType } }
      });
      uniforms.uTime = material.uniforms.uTime;
    } else {
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms
      });
    }
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // --- LAYER 3: ADDITIVE GLOW SPHERE (OPACITY REDUCED BY 80%) ---
    // Now heavily reliant on UnrealBloomPass for real light bleeding. This is just an atmospheric haze.
    let glowMesh: THREE.Mesh | null = null;
    if (!isPlanet) {
      const glowScale = coreScale * 1.25;
      const glowGeo = new THREE.SphereGeometry(glowScale, 64, 64);
      const glowMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float intensity = max(dot(vNormal, viewDir), 0.0);
            
            // Fades from bright center to transparent edge
            float alpha = pow(intensity, 2.5);
            
            // Ultra-low opacity haze (0.05) - let UnrealBloom do the heavy lifting
            gl_FragColor = vec4(uColor, alpha * 0.05);
          }
        `,
        uniforms: uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide // Render inside out so it bleeds around the core
      });
      glowMesh = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glowMesh);
    }

    // --- LAYER 4: PARTICLE CORONA ---
    // Tiny floating particles around the star in slow motion
    let particlesMesh: THREE.Points | null = null;
    if (!isPlanet) {
      const particleCount = 1200; // Increased density
      const particlesGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const randomArray = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        // Random spherical distribution, clustered near the core
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        // Distribution
        const r = coreScale + (Math.pow(Math.random(), 2.0) * 2.0); 

        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posArray[i * 3 + 2] = r * Math.cos(phi);

        randomArray[i] = Math.random();
      }

      particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

      const particleMat = new THREE.ShaderMaterial({
        vertexShader: `
          uniform float uTime;
          attribute float aRandom;
          varying float vAlpha;
          void main() {
            // Slow motion orbital drift
            vec3 pos = position;
            float angle = uTime * 0.05 * aRandom;
            float c = cos(angle);
            float s = sin(angle);
            pos.x = position.x * c - position.z * s;
            pos.z = position.x * s + position.z * c;
            
            // Add slight pulsing based on time and random offset
            pos += normalize(pos) * sin(uTime * 1.5 + aRandom * 10.0) * 0.08;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Twinkle effect
            vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + aRandom * 20.0);
            
            // Give particles emissive boost
            gl_PointSize = (10.0 * aRandom + 6.0) * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            // Make particles soft circles
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float softEdge = 1.0 - (dist * 2.0);
            // Emissive multiplier for UnrealBloom
            gl_FragColor = vec4(uColor * 2.0, softEdge * vAlpha * 0.8);
          }
        `,
        uniforms: uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      particlesMesh = new THREE.Points(particlesGeo, particleMat);
      scene.add(particlesMesh);
    }

    // Saturn rings
    if (isSaturn) {
      const ringGeometry = new THREE.RingGeometry(2.2, 4.0, 128);
      const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; varying vec3 vPosition; void main() { vUv = uv; vPosition = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0); }`,
        fragmentShader: `varying vec2 vUv; varying vec3 vPosition; void main() { float dist = distance(vUv, vec2(0.5)); float alpha = smoothstep(0.4, 0.45, dist) * smoothstep(0.5, 0.48, dist); alpha += smoothstep(0.25, 0.28, dist) * smoothstep(0.38, 0.35, dist) * 0.8; vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0)); vec3 viewDir = normalize(cameraPosition - vPosition); float scatter = max(dot(viewDir, lightDir), 0.0); vec3 ringColor = vec3(0.83, 0.7, 0.6); vec3 finalColor = ringColor * (0.4 + pow(scatter, 4.0) * 0.6); gl_FragColor = vec4(finalColor, alpha * 0.85); }`,
        transparent: true, side: THREE.DoubleSide, depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 - 0.2;
      scene.add(ring);
    }

    const currentMount = mountRef.current;
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      if (composer) {
        composer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      uniforms.uTime.value += delta;

      if (userActivity > 0) {
        userActivity = Math.max(0, userActivity - delta * 0.5);
        uniforms.uActivity.value = userActivity;
      }

      if (isPlanet) {
        sphere.rotation.y += delta * 0.2;
      } else {
        // Star surface no longer rotates! Only the particles orbit slowly
        if (particlesMesh) particlesMesh.rotation.y += delta * 0.04;
      }
      
      controls.update();
      
      if (composer && !isPlanet) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      geometry.dispose();
      if (material) material.dispose();
    };
  }, [spectralClass, starType, name]);

  return <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', cursor: 'grab', touchAction: 'pan-y', pointerEvents: 'auto' }} />;
}
