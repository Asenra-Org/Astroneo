'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FeaturedStar } from '@/types/star';

// ─── Shader source (simplex noise + plasma + planet) ─────────────────────────
const VERT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`;

const PLANET_FRAG = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform int uPlanetType;
  varying vec3 vNormal;
  varying vec3 vPosition;
  float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float f=0.0;f+=0.5*noise(p);p*=2.02;f+=0.25*noise(p);p*=2.03;f+=0.125*noise(p);p*=2.01;f+=0.0625*noise(p);return f;}
  void main(){
    float n=0.0;vec3 color=uColor;float roughness=0.8;float specularIntensity=0.2;
    if(uPlanetType==2){vec3 p=vPosition*vec3(1.5,5.0,1.5);n=fbm(p+vec3(uTime*0.02,0.0,uTime*0.02));float band=sin(vPosition.y*12.0+n*2.5);color=mix(uColor,uColor2,smoothstep(-0.5,0.5,band));specularIntensity=0.1;}
    else if(uPlanetType==3){n=fbm(vPosition*3.0);if(n<0.45){color=uColor;specularIntensity=0.8;}else{color=mix(uColor2,vec3(0.8,0.7,0.5),smoothstep(0.45,0.7,n));specularIntensity=0.1;}float clouds=fbm(vPosition*4.0+vec3(uTime*0.01));if(clouds>0.55){color=mix(color,vec3(1.0),(clouds-0.55)*2.5);}}
    else if(uPlanetType==1){n=fbm(vPosition*3.0);color=mix(uColor,uColor2,n);float craters=fbm(vPosition*8.0);color*=mix(0.6,1.0,smoothstep(0.3,0.6,craters));specularIntensity=0.05;}
    else if(uPlanetType==4){n=fbm(vPosition*10.0);float craters=fbm(vPosition*20.0);color=mix(uColor,uColor2,n);color*=mix(0.4,1.0,smoothstep(0.2,0.8,craters));specularIntensity=0.1;}
    else if(uPlanetType==5){vec3 p=vPosition*vec3(2.0,4.0,2.0);n=fbm(p+vec3(uTime*0.015,0.0,-uTime*0.01));float band=sin(vPosition.y*8.0+n*3.0);color=mix(uColor,uColor2,smoothstep(-0.4,0.4,band));specularIntensity=0.05;}
    else if(uPlanetType==6){n=fbm(vPosition*2.0);float craters=fbm(vPosition*15.0);color=mix(uColor,uColor2,smoothstep(0.3,0.7,n));color*=mix(0.5,1.0,smoothstep(0.4,0.6,craters));specularIntensity=0.02;}
    else if(uPlanetType==7){vec3 p=vPosition*vec3(1.0,6.0,1.0);n=fbm(p+vec3(0.0,uTime*0.005,0.0));float band=sin(vPosition.y*15.0+n*0.5);color=mix(uColor,uColor2,smoothstep(-0.8,0.8,band));specularIntensity=0.15;}
    else if(uPlanetType==8){n=fbm(vPosition*vec3(1.0,8.0,1.0));color=mix(uColor,uColor2,n*0.2);specularIntensity=0.2;}
    else if(uPlanetType==9){vec3 p=vPosition*vec3(1.5,4.0,1.5);n=fbm(p+vec3(uTime*0.04,0.0,0.0));float band=sin(vPosition.y*10.0+n);color=mix(uColor,uColor2,smoothstep(-0.5,0.5,band));float storm=fbm(vPosition*5.0-vec3(uTime*0.08));if(storm>0.65){color=mix(color,vec3(1.0),(storm-0.65)*3.0);}specularIntensity=0.2;}
    else if(uPlanetType==10){n=fbm(vPosition*3.5);color=mix(uColor,uColor2,smoothstep(0.3,0.6,n));specularIntensity=0.1;}
    else{n=fbm(vPosition*3.0+vec3(uTime*0.01));color=mix(uColor,uColor2,n);}
    vec3 lightDir=normalize(vec3(1.0,0.5,1.0));vec3 viewDir=normalize(cameraPosition-vPosition);vec3 halfVec=normalize(lightDir+viewDir);
    float diff=max(dot(vNormal,lightDir),0.0);float spec=pow(max(dot(vNormal,halfVec),0.0),128.0*(1.0-roughness))*specularIntensity;
    float rim=1.0-max(dot(viewDir,vNormal),0.0);rim=smoothstep(0.5,1.0,rim);vec3 rimColor=mix(uColor2,vec3(1.0),0.5);
    vec3 ambient=vec3(0.02,0.02,0.05);
    vec3 finalColor=color*diff+ambient;finalColor+=vec3(1.0)*spec*diff;finalColor+=rimColor*rim*diff*0.8;
    gl_FragColor=vec4(finalColor,1.0);
  }
`;

const STAR_FRAG = `
  uniform float uTime;uniform vec3 uColor;uniform vec3 uGlowColor;uniform float uNoiseScale;uniform float uSpeed;uniform float uActivity;
  varying vec3 vNormal;varying vec3 vPosition;
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
  float fbm(vec3 p){float f=0.0;f+=0.5*snoise(p);f+=0.25*snoise(p*2.0);f+=0.125*snoise(p*4.0);return f;}
  void main(){
    float spd=uSpeed*(1.0+uActivity);
    vec3 p=vPosition*uNoiseScale+vec3(0.0,uTime*spd,uTime*(spd*0.8));
    float n=fbm(p);n+=snoise(p*2.0-vec3(uTime*spd*2.0))*0.3;n=n*0.5+0.5;
    vec3 hotColor=min(uColor*2.5,vec3(1.0));vec3 deepColor=uGlowColor*0.5;
    vec3 color=mix(deepColor,hotColor,smoothstep(0.2,0.8,n));
    vec3 viewDir=normalize(cameraPosition-vPosition);float intensity=max(dot(vNormal,viewDir),0.0);
    float fresnel=pow(1.0-intensity,2.5);color+=uGlowColor*fresnel*1.5;
    gl_FragColor=vec4(color*1.8,1.0);
  }
`;

// ─── Build a planet type int from name ───────────────────────────────────────
function getPlanetType(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('mars')) return 1;
  if (n.includes('jupiter')) return 2;
  if (n.includes('earth')) return 3;
  if (n.includes('mercury')) return 4;
  if (n.includes('venus')) return 5;
  if (n.includes('moon')) return 6;
  if (n.includes('saturn')) return 7;
  if (n.includes('uranus')) return 8;
  if (n.includes('neptune')) return 9;
  if (n.includes('pluto')) return 10;
  return 0;
}

// ─── Derive colors + shader params from star data ────────────────────────────
function getStarColors(star: FeaturedStar) {
  const name = star.commonName.toLowerCase();
  const cls = star.spectralClass?.[0]?.toUpperCase() ?? 'G';
  const isPlanet = star.type === 'Planet' || star.type === 'Moon' || star.type === 'Dwarf Planet';

  let coreColor = 0xFFF4D4, glowColor = 0xFFD297;
  let uNoiseScale = 0.8, uSpeed = 0.05;
  let bloomIntensity = 1.2;

  if (isPlanet) {
    if (name.includes('mars'))    { coreColor = 0xC1440E; glowColor = 0x8B3A3A; }
    else if (name.includes('jupiter')) { coreColor = 0xd39c7e; glowColor = 0xe0c9a6; }
    else if (name.includes('earth'))   { coreColor = 0x1E90FF; glowColor = 0x228B22; }
    else if (name.includes('mercury')) { coreColor = 0xaaaaaa; glowColor = 0x888888; }
    else if (name.includes('venus'))   { coreColor = 0xe3bb76; glowColor = 0xc9a05b; }
    else if (name.includes('moon'))    { coreColor = 0x999999; glowColor = 0x555555; }
    else if (name.includes('saturn'))  { coreColor = 0xe3cdb2; glowColor = 0xd4b499; }
    else if (name.includes('uranus'))  { coreColor = 0xadd8e6; glowColor = 0x87ceeb; }
    else if (name.includes('neptune')) { coreColor = 0x4b70dd; glowColor = 0x3a57b5; }
    else if (name.includes('pluto'))   { coreColor = 0xddc4b0; glowColor = 0x9c8978; }
    bloomIntensity = 0;
  } else {
    if (name.includes('vega'))      { coreColor = 0xF5F8FF; glowColor = 0xC4D8FF; uSpeed = 0.08; uNoiseScale = 1.1; bloomIntensity = 2.5; }
    else if (name.includes('sirius'))   { coreColor = 0xDEE9FF; glowColor = 0x9CBBFF; uSpeed = 0.12; uNoiseScale = 1.3; bloomIntensity = 1.8; }
    else if (name.includes('arcturus')) { coreColor = 0xFFBA8A; glowColor = 0xFF7633; uSpeed = 0.02; uNoiseScale = 0.4; bloomIntensity = 1.5; }
    else if (name.includes('betelgeuse') || name.includes('antares')) { coreColor = 0xFF9E6B; glowColor = 0xFF3B00; uSpeed = 0.015; uNoiseScale = 0.3; bloomIntensity = 1.8; }
    else if (name.includes('rigel')) { coreColor = 0xC4D8FF; glowColor = 0x6A9EFF; uSpeed = 0.15; uNoiseScale = 0.9; bloomIntensity = 2.0; }
    else {
      switch (cls) {
        case 'O': coreColor = 0xC4D8FF; glowColor = 0x6A9EFF; uNoiseScale = 1.2; uSpeed = 0.15; bloomIntensity = 2.0; break;
        case 'B': coreColor = 0xDDEBFF; glowColor = 0x9CBBFF; uNoiseScale = 1.0; uSpeed = 0.12; bloomIntensity = 1.8; break;
        case 'A': coreColor = 0xF5F8FF; glowColor = 0xCCDEFF; uNoiseScale = 0.9; uSpeed = 0.1;  bloomIntensity = 1.6; break;
        case 'F': coreColor = 0xFFFBEA; glowColor = 0xFFEAC8; uNoiseScale = 0.8; uSpeed = 0.08; bloomIntensity = 1.5; break;
        case 'G': coreColor = 0xFFF4D4; glowColor = 0xFFD297; uNoiseScale = 0.7; uSpeed = 0.06; bloomIntensity = 1.2; break;
        case 'K': coreColor = 0xFFD0A1; glowColor = 0xFF9C63; uNoiseScale = 0.6; uSpeed = 0.04; bloomIntensity = 1.1; break;
        case 'M': coreColor = 0xFFB38A; glowColor = 0xFF5511; uNoiseScale = 0.4; uSpeed = 0.02; bloomIntensity = 1.4; break;
      }
    }
  }
  return { coreColor, glowColor, uNoiseScale, uSpeed, bloomIntensity, isPlanet };
}

// ─── Compute display scales based on radiusSOL ───────────────────────────────
const BASE = 1.5;

const PLANET_RADII_SOL: Record<string, number> = {
  'the sun': 1, 'sun': 1,
  'jupiter': 0.10045, 'saturn': 0.0838, 'uranus': 0.0363, 'neptune': 0.0352,
  'earth': 0.00917, 'venus': 0.0087, 'mars': 0.00486, 'mercury': 0.0035,
  'moon': 0.0025, 'pluto': 0.0017
};

function computeScales(starA: FeaturedStar, starB: FeaturedStar | null): { scaleA: number; scaleB: number; isCompressed: boolean } {
  if (!starB) return { scaleA: BASE, scaleB: BASE, isCompressed: false };
  
  const getRadius = (star: FeaturedStar) => {
    const name = star.commonName.toLowerCase();
    if (PLANET_RADII_SOL[name]) return PLANET_RADII_SOL[name];
    return star.radiusSOL ?? 1;
  };

  const rA = getRadius(starA);
  const rB = getRadius(starB);
  if (rA === rB) return { scaleA: BASE, scaleB: BASE, isCompressed: false };
  
  // Use true scale ratio for accurate physical comparison
  const trueRatio = Math.max(rA, rB) / Math.min(rA, rB);
  
  let ratio = trueRatio;
  let isCompressed = false;
  
  // If the size difference is extremely massive, compress the scale logarithmically 
  // so the smaller object doesn't become completely invisible and we can still see 
  // relative differences between tiny objects (e.g. Earth vs Sun against Betelgeuse).
  if (trueRatio > 25) {
    ratio = 25 + Math.pow(trueRatio - 25, 0.35) * 6;
    isCompressed = true;
  }
  
  if (rA >= rB) return { scaleA: BASE, scaleB: BASE / ratio, isCompressed };
  return { scaleA: BASE / ratio, scaleB: BASE, isCompressed };
}

// ─── Build a Three.js Group for a star/planet ────────────────────────────────
interface StarObject {
  group: THREE.Group;
  tick: (dt: number) => void;
  dispose: () => void;
}

function buildStarObject(star: FeaturedStar, scale: number, scene: THREE.Scene): StarObject {
  const group = new THREE.Group();
  const name = star.commonName.toLowerCase();
  
  const solarSystemBodies = ['the sun', 'sun', 'moon', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'solar system'];
  const isSolarSystemBody = solarSystemBodies.includes(name);

  let tickFn = (dt: number) => {};
  let disposeFn = () => { scene.remove(group); };

  if (isSolarSystemBody) {
    let glbName = name === 'solar system' ? 'solar_system_animation' : name;
    if (glbName === 'the sun') glbName = 'sun';
    
    let rotSpeed = 0.15;
    if (glbName === 'sun') rotSpeed = 0.02;
    if (glbName === 'moon') rotSpeed = 0.05;

    const loader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    let modelMesh: THREE.Object3D | null = null;

    loader.load(`/models/${glbName}.glb`, (gltf) => {
      const model = gltf.scene;
      modelMesh = model;
      
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      model.scale.setScalar((scale * 2) / maxDim);
      
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          mixer!.clipAction(clip).play();
        });
      }
      
      group.add(model);
    });

    scene.add(group);
    tickFn = (dt: number) => {
      group.rotation.y += dt * rotSpeed;
      if (mixer) mixer.update(dt);
    };
    disposeFn = () => {
      scene.remove(group);
      if (modelMesh) {
        modelMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            if (m.geometry) m.geometry.dispose();
            if (m.material) {
              if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
              else m.material.dispose();
            }
          }
        });
      }
    };
  } else {
    const { coreColor, glowColor, uNoiseScale, uSpeed, isPlanet } = getStarColors(star);
    const geo = new THREE.SphereGeometry(scale, 96, 96);
    let mat: THREE.ShaderMaterial;
    let rotSpeed = 0.2;

    if (isPlanet) {
      const pType = getPlanetType(name);
      mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: PLANET_FRAG,
        uniforms: {
          uTime:       { value: 0 },
          uColor:      { value: new THREE.Color(coreColor) },
          uColor2:     { value: new THREE.Color(glowColor) },
          uPlanetType: { value: pType },
        },
      });
      rotSpeed = 0.15;
    } else {
      mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: STAR_FRAG,
        uniforms: {
          uTime:       { value: 0 },
          uColor:      { value: new THREE.Color(coreColor) },
          uGlowColor:  { value: new THREE.Color(glowColor) },
          uNoiseScale: { value: uNoiseScale },
          uSpeed:      { value: uSpeed },
          uActivity:   { value: 0 },
        },
      });
      rotSpeed = 0;
    }

    const sphere = new THREE.Mesh(geo, mat);
    group.add(sphere);

    scene.add(group);

    tickFn = (dt: number) => {
      mat.uniforms.uTime.value += dt;
      if (isPlanet) sphere.rotation.y += dt * rotSpeed;
    };

    disposeFn = () => {
      scene.remove(group);
      geo.dispose();
      mat.dispose();
    };
  }

  return { group, tick: tickFn, dispose: disposeFn };
}

// ─── Main component ───────────────────────────────────────────────────────────
interface CompareTwoViewerProps {
  starA: FeaturedStar;
  starB: FeaturedStar | null;
  onClear?: () => void;
}

export default function CompareTwoViewer({ starA, starB, onClear }: CompareTwoViewerProps) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const labelARef = useRef<HTMLDivElement>(null);
  const labelBRef = useRef<HTMLDivElement>(null);
  // camera ref so animation loop can share it with label updater
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // We store mutable animation state in refs so the effect doesn't need to re-run
  const stateRef = useRef<{
    objA: StarObject | null;
    objB: StarObject | null;
    targetXA: number;
    targetXB: number;
    currentXA: number;
    currentXB: number;
    scaleA: number;
    scaleB: number;
    isCompressed: boolean;
  }>({
    objA: null, objB: null,
    targetXA: 0, targetXB: 999,
    currentXA: 0, currentXB: 999,
    scaleA: BASE, scaleB: BASE,
    isCompressed: false,
  });

  const [isScaleCompressed, setIsScaleCompressed] = useState(false);

  // Ref to latest starB so we can access it in the animation loop
  const starBRef = useRef<FeaturedStar | null>(starB);
  const starBuildNeededRef = useRef<FeaturedStar | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Track if starB changed
  useEffect(() => {
    starBRef.current = starB;
    const s = stateRef.current;

    if (starB) {
      // Compute new scales
      const { scaleA, scaleB, isCompressed } = computeScales(starA, starB);
      s.scaleA = scaleA;
      s.scaleB = scaleB;
      s.isCompressed = isCompressed;
      setIsScaleCompressed(isCompressed);
      const sep = scaleA + scaleB + 4.5;  // Extra gap so blooms don't merge
      s.targetXA = -sep / 2;
      s.targetXB = sep / 2;

      // Update scaleA on objA group
      if (s.objA) s.objA.group.scale.setScalar(scaleA / BASE);

      // Mark that we need to build objB
      starBuildNeededRef.current = starB;
    } else {
      // Clear compare
      if (s.objB) {
        s.objB.dispose();
        s.objB = null;
      }
      const { scaleA, isCompressed } = computeScales(starA, null);
      s.scaleA = scaleA;
      s.isCompressed = isCompressed;
      setIsScaleCompressed(isCompressed);
      if (s.objA) s.objA.group.scale.setScalar(1);
      s.targetXA = 0;
      s.targetXB = 999;
      s.currentXB = 999;
      starBuildNeededRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starB]);

  // Main Three.js setup — runs once on mount
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene setup ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const aspect = mount.clientWidth / mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(aspect < 1 ? 65 : 45, aspect, 0.1, 1000);
    camera.position.z = aspect < 1 ? 14 : 8;
    cameraRef.current = camera;
    
    // Add lighting for GLTF models
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.0));
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    Object.assign(renderer.domElement.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'auto', touchAction: 'none',
    });
    mount.appendChild(renderer.domElement);

    // Bloom
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      1.0, 0.7, 0.0,
    );
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 30;

    // Build initial object A
    const { scaleA } = computeScales(starA, null);
    stateRef.current.scaleA = scaleA;
    stateRef.current.currentXA = 0;
    stateRef.current.targetXA = 0;
    const objA = buildStarObject(starA, BASE, scene);
    stateRef.current.objA = objA;

    // Background stars
    const bgCount = 2000;
    const bgPos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount; i++) {
      const r = 60 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      bgPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(bgGeo, bgMat));

    // Resize
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      composer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────────────────────────
    let lastTime = performance.now();
    let rafId: number;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const LERP_SPEED = 0.025; // Slow, smooth movement

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const s = stateRef.current;

      // Build starB object if needed (deferred to animation loop so scene is ready)
      if (starBuildNeededRef.current) {
        const sb = starBuildNeededRef.current;
        starBuildNeededRef.current = null;
        if (s.objB) { s.objB.dispose(); s.objB = null; }
        const newObjB = buildStarObject(sb, BASE, scene);
        s.objB = newObjB;
        // Start far off to the right
        // Start far off to the RIGHT and slide in
        s.currentXB = s.targetXB + 12;
        newObjB.group.position.x = s.currentXB;
      }

      // Lerp positions
      s.currentXA = lerp(s.currentXA, s.targetXA, LERP_SPEED);
      s.currentXB = lerp(s.currentXB, s.targetXB, LERP_SPEED);

      if (s.objA) {
        s.objA.group.position.x = s.currentXA;
        s.objA.group.scale.setScalar(s.scaleA / BASE);
        s.objA.tick(dt);
      }
      if (s.objB) {
        s.objB.group.position.x = s.currentXB;
        s.objB.group.scale.setScalar(s.scaleB / BASE);
        s.objB.tick(dt);
      }

      controls.update();
      composer.render();

      // ── Project 3D positions → screen coords for floating labels ──────
      const w = mount.clientWidth;
      const h = mount.clientHeight;

      const projectLabel = (
        el: HTMLDivElement | null,
        worldX: number,
        visualScale: number,
      ) => {
        if (!el) return;
        // Point just above the star (top of sphere)
        const p = new THREE.Vector3(worldX, visualScale + 0.35, 0);
        p.project(camera);
        const sx = (p.x *  0.5 + 0.5) * w;
        const sy = (p.y * -0.5 + 0.5) * h;
        // Hide if behind camera
        if (p.z > 1) { el.style.opacity = '0'; return; }
        el.style.opacity = '1';
        el.style.left = `${sx}px`;
        el.style.top  = `${sy}px`;
      };

      if (s.objA) projectLabel(labelARef.current, s.currentXA, s.scaleA);
      if (s.objB) projectLabel(labelBRef.current, s.currentXB, s.scaleB);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      stateRef.current.objA?.dispose();
      stateRef.current.objB?.dispose();
      stateRef.current.objA = null;
      stateRef.current.objB = null;
      bgGeo.dispose(); bgMat.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starA.slug]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        cursor: 'grab',
        touchAction: 'pan-y',
      }}
    >
      {/* ── Floating label for Star A — tracks 3D position every frame ── */}
      <div
        ref={labelARef}
        style={{
          position: 'absolute',
          transform: 'translateX(-50%)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 20,
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {starB && (
          <>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 999,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontFamily: 'inherit',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}>
              {starA.commonName}
            </span>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 4 }}>
              <path d="M12 2v20M19 15l-7 7-7-7"/>
            </svg>
          </>
        )}
      </div>

      {/* ── Floating label for Star B + X button ── */}
      <div
        ref={labelBRef}
        style={{
          position: 'absolute',
          transform: 'translateX(-50%)',
          opacity: 0,
          zIndex: 20,
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {starB && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block',
                padding: '3px 10px',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 999,
                color: 'rgba(255,255,255,0.85)',
                fontSize: 11,
                fontFamily: 'inherit',
                letterSpacing: '0.04em',
                fontWeight: 500,
                pointerEvents: 'none',
              }}>
                {starB.commonName}
              </span>
              {onClear && (
                <button
                  onClick={onClear}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  title="Remove comparison"
                >
                  ✕
                </button>
              )}
            </div>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 4 }}>
              <path d="M12 2v20M19 15l-7 7-7-7"/>
            </svg>
          </>
        )}
      </div>

      {/* ── Compression Disclaimer ── */}
      {isScaleCompressed && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          zIndex: 10,
        }}>
          *Sizes adjusted for visibility due to extreme physical differences
        </div>
      )}
    </div>
  );
}
