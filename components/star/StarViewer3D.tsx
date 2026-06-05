'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GLBModelViewer from './GLBModelViewer';

// Map planet names → GLB paths + viewer config.
// Add more entries here as you download more models.
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
  // Check if we have a model for this celestial body by matching its name against our config keys
  const planetKey = Object.keys(PLANET_GLB_CONFIG).find((key) => name.toLowerCase().includes(key));
  const glbConfig = planetKey ? PLANET_GLB_CONFIG[planetKey] : undefined;

  // ── If a real GLB model exists for this body, render it instead ──────────
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

  // ── Fallback: shader-based renderer for stars and bodies without a model ──
  useEffect(() => {
    if (!mountRef.current) return;

    // Determine colors
    const isPlanet = starType === 'Planet' || starType === 'Dwarf Planet';
    const cls = spectralClass ? spectralClass[0].toUpperCase() : 'G';
    const planetName = name.toLowerCase();

    let coreColor = 0xFFD700;
    let glowColor = 0xFFA500;
    let isEarth = false;
    let isSaturn = false;

    if (isPlanet) {
      if (planetName.includes('mars')) { coreColor = 0xC1440E; glowColor = 0x8B3A3A; }
      else if (planetName.includes('jupiter')) { coreColor = 0xd39c7e; glowColor = 0xe0c9a6; }
      else if (planetName.includes('earth')) { coreColor = 0x1E90FF; glowColor = 0x228B22; isEarth = true; }
      else if (planetName.includes('mercury')) { coreColor = 0xaaaaaa; glowColor = 0x888888; }
      else if (planetName.includes('venus')) { coreColor = 0xe3bb76; glowColor = 0xc9a05b; }
      else if (planetName.includes('moon')) { coreColor = 0x999999; glowColor = 0x555555; }
      else if (planetName.includes('saturn')) { coreColor = 0xe3cdb2; glowColor = 0xd4b499; isSaturn = true; }
      else if (planetName.includes('uranus')) { coreColor = 0xadd8e6; glowColor = 0x87ceeb; }
      else if (planetName.includes('neptune')) { coreColor = 0x4b70dd; glowColor = 0x3a57b5; }
      else if (planetName.includes('pluto')) { coreColor = 0xddc4b0; glowColor = 0x9c8978; }
      else { coreColor = 0x999999; glowColor = 0x333333; }
    } else {
      switch (cls) {
        case 'O': coreColor = 0x9BB0FF; glowColor = 0x6496FF; break;
        case 'B': coreColor = 0xAABFFF; glowColor = 0x78AAFF; break;
        case 'A': coreColor = 0xFFFFFF; glowColor = 0xFFFFFF; break;
        case 'F': coreColor = 0xFFF4EA; glowColor = 0xFFF0C8; break;
        case 'G': coreColor = 0xFFD700; glowColor = 0xFFA500; break;
        case 'K': coreColor = 0xFF8C42; glowColor = 0xFF6432; break;
        case 'M': coreColor = 0xFF4500; glowColor = 0xFF0000; break;
        default: coreColor = 0xFFD700; glowColor = 0xFFA500; break;
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isPlanet ? 1.2 : 1.5;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'none'; // Force no-scroll over the canvas
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // Core Sphere
    const geometry = new THREE.SphereGeometry(1.5, 128, 128); // Higher poly for better rim lighting
    
    // --- SHADERS FOR REALISTIC STARS ---
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
      varying vec3 vNormal;
      varying vec3 vPosition;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + .1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }
      float fbm(vec3 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f;
      }

      void main() {
        vec3 p = vPosition * 2.5 + vec3(0.0, uTime * 0.15, uTime * 0.1);
        float n1 = fbm(p);
        float n2 = fbm(p * 2.0 - vec3(uTime * 0.2));
        
        float n = mix(n1, n2, 0.5);
        
        float spots = smoothstep(0.4, 0.8, fbm(vPosition * 1.5 + vec3(uTime * 0.05)));
        
        vec3 baseColor = uColor;
        vec3 hotColor = min(uColor * 3.0 + vec3(0.3), vec3(1.0)); // Overbright for bloom
        vec3 darkColor = uColor * 0.15; 
        
        vec3 color = mix(baseColor, hotColor, smoothstep(0.3, 0.8, n));
        color = mix(color, darkColor, spots * 0.8);
        
        // Dynamic flares on the surface
        float flares = fbm(vPosition * 5.0 - vec3(uTime * 0.3));
        color += hotColor * smoothstep(0.7, 1.0, flares) * 1.5;

        // Limb darkening (edges get darker, center gets brighter)
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = max(dot(vNormal, viewDir), 0.0);
        color *= mix(0.4, 1.5, pow(intensity, 0.6));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const coronaVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
      }
    `;

    const coronaFragmentShader = `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = pow(0.7 - max(dot(vNormal, viewDir), 0.0), 3.0);
        gl_FragColor = vec4(uColor, 1.0) * intensity * 2.0;
      }
    `;

    const planetFragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uColor2;
      uniform int uPlanetType;
      varying vec3 vNormal;
      varying vec3 vPosition;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + .1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }
      float fbm(vec3 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f;
      }

      void main() {
        float n = 0.0;
        vec3 color = uColor;
        float roughness = 0.8;
        float specularIntensity = 0.2;
        
        if (uPlanetType == 2) {
            // Jupiter
            vec3 p = vPosition * vec3(1.5, 5.0, 1.5);
            n = fbm(p + vec3(uTime * 0.02, 0.0, uTime * 0.02));
            float band = sin(vPosition.y * 12.0 + n * 2.5);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 4.0 - vec3(uTime * 0.05));
            color = mix(color, vec3(0.8, 0.5, 0.3), smoothstep(0.7, 1.0, storm) * 0.5);
            specularIntensity = 0.1;
        } else if (uPlanetType == 3) {
            // Earth
            n = fbm(vPosition * 3.0);
            if (n < 0.45) { 
              color = uColor; // Ocean
              specularIntensity = 0.8; 
              roughness = 0.2;
            } else { 
              color = mix(uColor2, vec3(0.8, 0.7, 0.5), smoothstep(0.45, 0.7, n)); // Land
              specularIntensity = 0.1;
              roughness = 0.9;
            }
            float clouds = fbm(vPosition * 4.0 + vec3(uTime * 0.01));
            if (clouds > 0.55) { 
              color = mix(color, vec3(1.0), (clouds - 0.55) * 2.5); 
              specularIntensity = 0.05;
            }
        } else if (uPlanetType == 1) {
            // Mars
            n = fbm(vPosition * 3.0);
            color = mix(uColor, uColor2, n);
            float craters = fbm(vPosition * 8.0);
            color *= mix(0.6, 1.0, smoothstep(0.3, 0.6, craters));
            specularIntensity = 0.05;
        } else if (uPlanetType == 4) {
            // Mercury
            n = fbm(vPosition * 10.0);
            float craters = fbm(vPosition * 20.0);
            color = mix(uColor, uColor2, n);
            color *= mix(0.4, 1.0, smoothstep(0.2, 0.8, craters));
            specularIntensity = 0.1;
        } else if (uPlanetType == 5) {
            // Venus
            vec3 p = vPosition * vec3(2.0, 4.0, 2.0);
            n = fbm(p + vec3(uTime * 0.015, 0.0, -uTime * 0.01));
            float band = sin(vPosition.y * 8.0 + n * 3.0);
            color = mix(uColor, uColor2, smoothstep(-0.4, 0.4, band));
            specularIntensity = 0.05;
        } else if (uPlanetType == 6) {
            // Moon
            n = fbm(vPosition * 2.0);
            float craters = fbm(vPosition * 15.0);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.7, n));
            color *= mix(0.5, 1.0, smoothstep(0.4, 0.6, craters));
            specularIntensity = 0.02;
        } else if (uPlanetType == 7) {
            // Saturn
            vec3 p = vPosition * vec3(1.0, 6.0, 1.0);
            n = fbm(p + vec3(0.0, uTime * 0.005, 0.0));
            float band = sin(vPosition.y * 15.0 + n * 0.5);
            color = mix(uColor, uColor2, smoothstep(-0.8, 0.8, band));
            specularIntensity = 0.15;
        } else if (uPlanetType == 8) {
            // Uranus
            n = fbm(vPosition * vec3(1.0, 8.0, 1.0));
            color = mix(uColor, uColor2, n * 0.2); 
            specularIntensity = 0.2;
        } else if (uPlanetType == 9) {
            // Neptune
            vec3 p = vPosition * vec3(1.5, 4.0, 1.5);
            n = fbm(p + vec3(uTime * 0.04, 0.0, 0.0));
            float band = sin(vPosition.y * 10.0 + n);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 5.0 - vec3(uTime * 0.08));
            if (storm > 0.65) { color = mix(color, vec3(1.0), (storm - 0.65) * 3.0); }
            specularIntensity = 0.2;
        } else if (uPlanetType == 10) {
            // Pluto
            n = fbm(vPosition * 3.5);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.6, n));
            specularIntensity = 0.1;
        } else {
            // Generic planet
            n = fbm(vPosition * 3.0 + vec3(uTime * 0.01));
            color = mix(uColor, uColor2, n);
            specularIntensity = 0.1;
        }
        
        // Realistic Lighting Calculation
        vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0)); // Directional light from top right
        vec3 viewDir = normalize(cameraPosition - vPosition);
        vec3 halfVector = normalize(lightDir + viewDir);
        
        // Diffuse
        float diff = max(dot(vNormal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        float spec = pow(max(dot(vNormal, halfVector), 0.0), 128.0 * (1.0 - roughness)) * specularIntensity;
        
        // Rim Light (Atmosphere scattering)
        float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
        rim = smoothstep(0.5, 1.0, rim);
        vec3 rimColor = mix(uColor2, vec3(1.0), 0.5);
        
        // Ambient Light (Simulating starlight/galaxy background)
        vec3 ambient = vec3(0.02, 0.02, 0.05);
        
        // Combine lighting
        vec3 finalColor = color * diff + ambient;
        finalColor += vec3(1.0) * spec * diff; // Specular only on lit side
        
        // Add glowing rim only if there's an atmosphere (rough heuristic)
        if (uPlanetType != 6 && uPlanetType != 4 && uPlanetType != 10) {
          finalColor += rimColor * rim * diff * 0.8;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Uniforms object so we can update time
    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(coreColor) }
    };

    let material;
    if (isPlanet) {
      let pType = 0;
      let color2 = glowColor;
      
      if (planetName.includes('mars')) pType = 1;
      else if (planetName.includes('jupiter')) pType = 2;
      else if (planetName.includes('earth')) pType = 3;
      else if (planetName.includes('mercury')) pType = 4;
      else if (planetName.includes('venus')) pType = 5;
      else if (planetName.includes('moon')) pType = 6;
      else if (planetName.includes('saturn')) pType = 7;
      else if (planetName.includes('uranus')) pType = 8;
      else if (planetName.includes('neptune')) pType = 9;
      else if (planetName.includes('pluto')) pType = 10;
      
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: planetFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(coreColor) },
          uColor2: { value: new THREE.Color(color2) },
          uPlanetType: { value: pType }
        }
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

    // Removed the corona layer as requested

    // Saturn rings
    if (isSaturn) {
      const ringGeometry = new THREE.RingGeometry(1.8, 3.2, 128);
      
      // Simple custom shader for realistic ring scattering
      const ringVertex = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
        }
      `;
      const ringFragment = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          // Create gaps in the rings
          float alpha = smoothstep(0.4, 0.45, dist) * smoothstep(0.5, 0.48, dist);
          alpha += smoothstep(0.25, 0.28, dist) * smoothstep(0.38, 0.35, dist) * 0.8;
          
          vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float scatter = max(dot(viewDir, lightDir), 0.0);
          
          vec3 ringColor = vec3(0.83, 0.7, 0.6);
          // Forward scattering makes rings brighter when looking toward the light
          vec3 finalColor = ringColor * (0.4 + pow(scatter, 4.0) * 0.6);
          
          gl_FragColor = vec4(finalColor, alpha * 0.85);
        }
      `;
      
      const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
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
    };
    window.addEventListener('resize', handleResize);

    // Using performance.now() to avoid THREE.Clock deprecation warnings/issues
    let lastTime = performance.now();

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update uniform time continuously 
      uniforms.uTime.value += delta;

      // Auto-rotation
      if (isPlanet) {
        sphere.rotation.y += delta * 0.2;
      } else {
        sphere.rotation.y += delta * 0.05; // slower spin for star
      }
      
      controls.update();
      renderer.render(scene, camera);
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
      
      // Explicitly clean up WebGL contexts and geometries/materials
      geometry.dispose();
      if (material) {
        material.dispose();
      }
    };
  }, [spectralClass, starType, name]);

  return <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', cursor: 'grab', touchAction: 'pan-y', pointerEvents: 'auto' }} />;
}

