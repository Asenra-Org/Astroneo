'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface StarViewer3DProps {
  spectralClass?: string;
  starType?: string;
  name?: string;
}

export default function StarViewer3D({ spectralClass, starType, name = '' }: StarViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

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
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;

    // Core Sphere
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    
    // --- SHADERS FOR REALISTIC STARS ---
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
        // Complex swirling noise for plasma
        vec3 p = vPosition * 2.5 + vec3(0.0, uTime * 0.15, uTime * 0.1);
        float n1 = fbm(p);
        float n2 = fbm(p * 2.0 - vec3(uTime * 0.2));
        
        // Combine noise layers for turbulence
        float n = mix(n1, n2, 0.5);
        
        // Generate sunspots (low frequency, slow moving)
        float spots = smoothstep(0.4, 0.8, fbm(vPosition * 1.5 + vec3(uTime * 0.05)));
        
        // Color palette based on the star's core color
        vec3 baseColor = uColor;
        // White-hot ridges
        vec3 hotColor = min(uColor * 2.5 + vec3(0.2), vec3(1.0)); 
        // Deep dark spots
        vec3 darkColor = uColor * 0.15; 
        
        // Base plasma mixing
        vec3 color = mix(baseColor, hotColor, smoothstep(0.3, 0.8, n));
        
        // Apply deep sunspots
        color = mix(color, darkColor, spots * 0.7);
        
        // Strong Limb darkening (edges get darker, center gets brighter)
        float intensity = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        color *= mix(0.4, 1.3, pow(intensity, 0.8));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const coronaVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const coronaFragmentShader = `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
        gl_FragColor = vec4(uColor, 1.0) * intensity * 1.5;
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
        
        if (uPlanetType == 2) {
            // Jupiter
            vec3 p = vPosition * vec3(1.5, 5.0, 1.5);
            n = fbm(p + vec3(uTime * 0.05, 0.0, uTime * 0.05));
            float band = sin(vPosition.y * 12.0 + n * 2.5);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 4.0 - vec3(uTime * 0.1));
            color = mix(color, vec3(0.8, 0.5, 0.3), smoothstep(0.7, 1.0, storm) * 0.5);
        } else if (uPlanetType == 3) {
            // Earth
            n = fbm(vPosition * 3.0);
            if (n < 0.45) { color = uColor; }
            else { color = mix(uColor2, vec3(0.8, 0.7, 0.5), smoothstep(0.45, 0.7, n)); }
            float clouds = fbm(vPosition * 4.0 + vec3(uTime * 0.02));
            if (clouds > 0.55) { color = mix(color, vec3(1.0), (clouds - 0.55) * 2.5); }
        } else if (uPlanetType == 1) {
            // Mars
            n = fbm(vPosition * 3.0);
            color = mix(uColor, uColor2, n);
            float craters = fbm(vPosition * 8.0);
            color *= mix(0.7, 1.0, smoothstep(0.3, 0.6, craters));
        } else if (uPlanetType == 4) {
            // Mercury
            n = fbm(vPosition * 10.0);
            float craters = fbm(vPosition * 20.0);
            color = mix(uColor, uColor2, n);
            color *= mix(0.5, 1.0, smoothstep(0.2, 0.8, craters));
        } else if (uPlanetType == 5) {
            // Venus
            vec3 p = vPosition * vec3(2.0, 4.0, 2.0);
            n = fbm(p + vec3(uTime * 0.03, 0.0, -uTime * 0.02));
            float band = sin(vPosition.y * 8.0 + n * 3.0);
            color = mix(uColor, uColor2, smoothstep(-0.4, 0.4, band));
        } else if (uPlanetType == 6) {
            // Moon
            n = fbm(vPosition * 2.0);
            float craters = fbm(vPosition * 15.0);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.7, n));
            color *= mix(0.6, 1.0, smoothstep(0.4, 0.6, craters));
        } else if (uPlanetType == 7) {
            // Saturn
            vec3 p = vPosition * vec3(1.0, 6.0, 1.0);
            n = fbm(p + vec3(0.0, uTime * 0.01, 0.0));
            float band = sin(vPosition.y * 15.0 + n * 0.5);
            color = mix(uColor, uColor2, smoothstep(-0.8, 0.8, band));
        } else if (uPlanetType == 8) {
            // Uranus
            n = fbm(vPosition * vec3(1.0, 8.0, 1.0));
            color = mix(uColor, uColor2, n * 0.2); 
        } else if (uPlanetType == 9) {
            // Neptune
            vec3 p = vPosition * vec3(1.5, 4.0, 1.5);
            n = fbm(p + vec3(uTime * 0.08, 0.0, 0.0));
            float band = sin(vPosition.y * 10.0 + n);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 5.0 - vec3(uTime * 0.15));
            if (storm > 0.65) { color = mix(color, vec3(1.0), (storm - 0.65) * 3.0); }
        } else if (uPlanetType == 10) {
            // Pluto
            n = fbm(vPosition * 3.5);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.6, n));
        } else {
            // Generic planet
            n = fbm(vPosition * 3.0 + vec3(uTime * 0.02));
            color = mix(uColor, uColor2, n);
        }
        
        // Simple directional lighting
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float light = max(dot(vNormal, lightDir), 0.05);
        
        // Ambient light
        light += 0.15;
        
        gl_FragColor = vec4(color * light, 1.0);
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
      // Store reference to planet uniforms so we can animate it
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

    // If it's a star, add corona
    if (!isPlanet) {
      const coronaGeometry = new THREE.SphereGeometry(1.8, 64, 64);
      const coronaMaterial = new THREE.ShaderMaterial({
        vertexShader: coronaVertexShader,
        fragmentShader: coronaFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(glowColor) }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
      scene.add(corona);
    }

    // Saturn rings
    if (isSaturn) {
      const ringGeometry = new THREE.RingGeometry(1.8, 2.5, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4b499,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 - 0.2;
      scene.add(ring);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    if (!isPlanet) {
      const starLight = new THREE.PointLight(coreColor, 2, 50);
      scene.add(starLight);
    }

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Auto-rotation
      if (isPlanet) {
        sphere.rotation.y += 0.005;
      } else {
        sphere.rotation.y += 0.001; // slower spin for star itself since surface boils
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [spectralClass, starType, name]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '400px', cursor: 'grab' }} />;
}
