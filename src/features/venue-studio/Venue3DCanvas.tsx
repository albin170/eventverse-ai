import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Venue3DConfig } from '@/types';

interface Venue3DCanvasProps {
  config: Venue3DConfig;
  onConfigChange?: (newConfig: Venue3DConfig) => void;
  onError?: (err: Error) => void;
}

export const Venue3DCanvas: React.FC<Venue3DCanvasProps> = ({
  config,
  onConfigChange: _onConfigChange,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // References to keep Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tableGroupRef = useRef<THREE.Group | null>(null);
  const stageMeshRef = useRef<THREE.Mesh | null>(null);
  const danceFloorRef = useRef<THREE.Mesh | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);

  // Camera angles
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 5, radius: 24 });
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Update camera position from spherical angles
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAnglesRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 1, 0);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        onError?.(new Error('WebGL not supported'));
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      onError?.(e instanceof Error ? e : new Error('WebGL initialization error'));
      return;
    }

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0c0e18);
    scene.fog = new THREE.FogExp2(0x0c0e18, 0.025);

    // 2. Camera setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      setWebglSupported(false);
      onError?.(e instanceof Error ? e : new Error('Failed to create WebGLRenderer'));
      return;
    }

    // 4. Ground / Floor with Grid
    const floorGeo = new THREE.PlaneGeometry(30, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111422,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x8b5cf6, 0x1f253e);
    grid.position.y = 0.01;
    scene.add(grid);

    // 5. Lighting
    const lightsGroup = new THREE.Group();
    lightsGroupRef.current = lightsGroup;
    scene.add(lightsGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, config.ambientBrightness);
    lightsGroup.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 2.5);
    mainSpot.position.set(0, 15, 10);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.4;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    lightsGroup.add(mainSpot);

    // Colored accent uplights
    const accentColor = new THREE.Color(config.accentColor || '#06B6D4');
    const themeColor = new THREE.Color(config.themeColor || '#8B5CF6');

    const uplight1 = new THREE.PointLight(themeColor, 3, 15);
    uplight1.position.set(-8, 3, -6);
    lightsGroup.add(uplight1);

    const uplight2 = new THREE.PointLight(accentColor, 3, 15);
    uplight2.position.set(8, 3, -6);
    lightsGroup.add(uplight2);

    // 6. Stage
    const stageGeo = new THREE.BoxGeometry(10, 0.8, 4);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e35,
      roughness: 0.5,
      metalness: 0.3,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.4, -7);
    stage.castShadow = true;
    stage.receiveShadow = true;
    stageMeshRef.current = stage;
    scene.add(stage);

    // Podium / Backdrop banner on stage
    const backdropGeo = new THREE.BoxGeometry(9, 3.5, 0.2);
    const backdropMat = new THREE.MeshStandardMaterial({
      color: themeColor,
      roughness: 0.4,
      metalness: 0.1,
    });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(0, 2.2, -8.8);
    scene.add(backdrop);

    // 7. Dance floor
    const danceFloorGeo = new THREE.BoxGeometry(6, 0.05, 6);
    const danceFloorMat = new THREE.MeshStandardMaterial({
      color: 0x161a2d,
      roughness: 0.2,
      metalness: 0.8,
    });
    const danceFloor = new THREE.Mesh(danceFloorGeo, danceFloorMat);
    danceFloor.position.set(0, 0.03, -1);
    danceFloor.receiveShadow = true;
    danceFloorRef.current = danceFloor;
    scene.add(danceFloor);

    // 8. Tables group
    const tableGroup = new THREE.Group();
    tableGroupRef.current = tableGroup;
    scene.add(tableGroup);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update dynamic elements when config changes
  useEffect(() => {
    if (!sceneRef.current || !tableGroupRef.current) return;

    // 1. Rebuild tables based on tableCount and tableLayout
    const tableGroup = tableGroupRef.current;
    while (tableGroup.children.length > 0) {
      tableGroup.remove(tableGroup.children[0]);
    }

    const tableColor = new THREE.Color(config.themeColor || '#8B5CF6');
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x222744,
      roughness: 0.6,
    });
    const centerpieceMat = new THREE.MeshStandardMaterial({
      color: tableColor,
      roughness: 0.3,
      emissive: tableColor,
      emissiveIntensity: 0.4,
    });

    const isBanquet = config.tableLayout === 'banquet';
    const radius = isBanquet ? 0.9 : 0.6;
    const height = 0.75;
    const tableGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
    const centerpieceGeo = new THREE.SphereGeometry(0.18, 12, 12);

    const count = Math.min(30, config.tableCount);
    const cols = Math.ceil(Math.sqrt(count * 1.5));
    const spacingX = 3.2;
    const spacingZ = 2.8;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = (col - cols / 2 + 0.5) * spacingX;
      const z = row * spacingZ + 3.0; // Place tables in audience area

      const tableMesh = new THREE.Mesh(tableGeo, tableMat);
      tableMesh.position.set(x, height / 2, z);
      tableMesh.castShadow = true;
      tableMesh.receiveShadow = true;

      // Centerpiece glowing orb
      const cp = new THREE.Mesh(centerpieceGeo, centerpieceMat);
      cp.position.set(0, height / 2 + 0.15, 0);
      tableMesh.add(cp);

      // Add chairs around table
      const chairCount = isBanquet ? 6 : 4;
      const chairGeo = new THREE.BoxGeometry(0.3, 0.45, 0.3);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x161a2d });
      for (let c = 0; c < chairCount; c++) {
        const angle = (c / chairCount) * Math.PI * 2;
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(Math.cos(angle) * (radius + 0.35), 0.22, Math.sin(angle) * (radius + 0.35));
        chair.rotation.y = -angle;
        tableMesh.add(chair);
      }

      tableGroup.add(tableMesh);
    }

    // 2. Update Stage visibility and position
    if (stageMeshRef.current) {
      if (config.stagePosition === 'none') {
        stageMeshRef.current.visible = false;
      } else if (config.stagePosition === 'center') {
        stageMeshRef.current.visible = true;
        stageMeshRef.current.position.set(0, 0.4, 0);
      } else {
        stageMeshRef.current.visible = true;
        stageMeshRef.current.position.set(0, 0.4, -7);
      }
    }

    // 3. Update Dance Floor
    if (danceFloorRef.current) {
      danceFloorRef.current.visible = config.danceFloor;
    }
  }, [config]);

  // Mouse drag Orbit Controls handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsOrbiting(true);
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    cameraAnglesRef.current.theta -= deltaX * 0.008;
    cameraAnglesRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI / 2.1, cameraAnglesRef.current.phi - deltaY * 0.008)
    );
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsOrbiting(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAnglesRef.current.radius = Math.max(
      10,
      Math.min(40, cameraAnglesRef.current.radius + e.deltaY * 0.02)
    );
    updateCameraPosition();
  };

  const resetCamera = () => {
    cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 5, radius: 24 };
    updateCameraPosition();
  };

  if (!webglSupported) {
    return null;
  }

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-surface-border bg-midnight-950 group">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          isOrbiting ? 'cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        role="region"
        aria-label="Interactive 3D Venue Studio Viewport. Click and drag to orbit, scroll to zoom."
        tabIndex={0}
      />

      {/* Orbit Controls Overlay & HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-midnight-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="font-medium">3D Spatial Studio</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Drag to Orbit • Scroll to Zoom</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 bg-midnight-900/80 hover:bg-midnight-800 text-xs text-slate-300 rounded-lg border border-white/10 backdrop-blur-md transition-colors focus:ring-2 focus:ring-violet-500"
          title="Reset Camera View"
        >
          Reset View
        </button>
      </div>

      {/* Lighting Preset & Stats Badge */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-midnight-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs">
        <div>
          <span className="text-slate-400">Layout: </span>
          <span className="text-cyan-400 font-semibold capitalize">
            {config.tableLayout}
          </span>
        </div>
        <span className="text-slate-600">•</span>
        <div>
          <span className="text-slate-400">Tables: </span>
          <span className="text-white font-semibold">{config.tableCount}</span>
        </div>
        <span className="text-slate-600">•</span>
        <div>
          <span className="text-slate-400">Stage: </span>
          <span className="text-violet-400 font-semibold capitalize">
            {config.stagePosition}
          </span>
        </div>
      </div>
    </div>
  );
};
