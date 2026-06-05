'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface GLBModelViewerProps {
  modelPath: string;
  planetName?: string;
  atmosphereColor?: string;
  showAtmosphere?: boolean;
  rotationSpeed?: number;
  modelScale?: number;
  cameraZ?: number;
  enableZoom?: boolean;
}

export default function GLBModelViewer({
  modelPath,
  atmosphereColor = '#4488ff',
  showAtmosphere = false,
  rotationSpeed = 0.12,
  enableZoom = true,
  modelScale = 1.5,
  cameraZ = 4.5,
}: GLBModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 400;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
    camera.position.set(0, 0, 5);

    // ── Controls ──────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = enableZoom;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.0));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(5000 * 3);
    for (let i = 0; i < 15000; i++) starPos[i] = (Math.random() - 0.5) * 400;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));

    // ── Group that rotates ─────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    // ── Load GLB ──────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;

      // Centre on bounding box
      const box = new THREE.Box3().setFromObject(model);
      const centre = box.getCenter(new THREE.Vector3());
      model.position.sub(centre);

      // Scale to target radius using modelScale
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetRadius = modelScale || 1.5;
      model.scale.setScalar((targetRadius * 2) / maxDim);
      group.add(model);

      // Fit camera
      camera.position.set(0, 0, cameraZ || 4.5);
      controls.minDistance = 2;
      controls.maxDistance = 15;

      // Atmosphere after model is sized
      if (showAtmosphere) {
        const atmoMesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.65, 48, 48),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(atmosphereColor),
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
          })
        );
        group.add(atmoMesh);
      }

      // Play animations if present
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          mixer!.clipAction(clip).play();
        });
      }
      setIsModelLoaded(true);
    });

    // ── Animate ────────────────────────────────────────────────────────────────
    let raf: number;
    let prev = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = (performance.now() - prev) / 1000;
      prev = performance.now();
      group.rotation.y += dt * rotationSpeed;
      if (mixer) mixer.update(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      starGeo.dispose();
    };
  }, [modelPath, atmosphereColor, showAtmosphere, rotationSpeed, enableZoom, modelScale, cameraZ]);

  return (
    <div className="relative w-full h-full">
      {!isModelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 backdrop-blur-sm transition-opacity duration-500">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted text-sm uppercase tracking-widest animate-pulse">Loading 3D Model...</p>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
