import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { generateTerrain, getHeightAtPosition } from './terrain';
import { Player } from './Player';

export const GameWorld = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<Player | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const noiseRef = useRef<ReturnType<typeof createNoise2D>>();
  const chunksRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene with fog for depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);
    sceneRef.current = scene;

    // Setup camera with better initial position
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer with better shadows
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb); // Sky blue
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Add hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4ade80, 0.6);
    scene.add(hemisphereLight);

    // Initialize noise generator
    noiseRef.current = createNoise2D();

    // Generate initial terrain chunk
    const initialTerrain = generateTerrain(noiseRef.current);
    scene.add(initialTerrain);
    chunksRef.current.set('0,0', initialTerrain);

    // Create player with enhanced visuals
    const player = new Player();
    scene.add(player.mesh);
    playerRef.current = player;

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const updateTerrainChunks = (playerPos: THREE.Vector3) => {
      const chunkSize = 100;
      const renderDistance = 3; // Increased render distance
      
      const currentChunkX = Math.floor(playerPos.x / chunkSize);
      const currentChunkZ = Math.floor(playerPos.z / chunkSize);

      // Generate new chunks in render distance
      for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
          const chunkX = currentChunkX + x;
          const chunkZ = currentChunkZ + z;
          const key = `${chunkX},${chunkZ}`;

          if (!chunksRef.current.has(key) && noiseRef.current) {
            const chunk = generateTerrain(noiseRef.current);
            chunk.position.set(chunkX * chunkSize, 0, chunkZ * chunkSize);
            scene.add(chunk);
            chunksRef.current.set(key, chunk);
          }
        }
      }

      // Remove chunks outside render distance with fade effect
      for (const [key, chunk] of chunksRef.current.entries()) {
        const [x, z] = key.split(',').map(Number);
        if (
          Math.abs(x - currentChunkX) > renderDistance ||
          Math.abs(z - currentChunkZ) > renderDistance
        ) {
          scene.remove(chunk);
          chunksRef.current.delete(key);
        }
      }
    };

    // Animation loop with enhanced effects
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (playerRef.current && noiseRef.current) {
        playerRef.current.update(keysRef.current);
        
        const playerPos = playerRef.current.mesh.position;
        const groundHeight = getHeightAtPosition(noiseRef.current, playerPos.x, playerPos.z);
        playerPos.y = groundHeight + 1;

        updateTerrainChunks(playerPos);
        
        // Smooth camera following
        const targetCameraPos = new THREE.Vector3(
          playerPos.x,
          playerPos.y + 15,
          playerPos.z + 25
        );
        camera.position.lerp(targetCameraPos, 0.1);
        camera.lookAt(playerPos);
      }

      // Enhanced grass animation
      const time = performance.now() * 0.001;
      chunksRef.current.forEach((chunk) => {
        const vertices = chunk.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
          const x = vertices[i];
          const z = vertices[i + 2];
          const originalY = vertices[i + 1];
          vertices[i + 1] = originalY + 
            Math.sin(time + x * 0.5 + z * 0.5) * 0.1 * // Main wave
            Math.sin(time * 1.5 + x * 0.3) * 0.05; // Secondary wave
        }
        chunk.geometry.attributes.position.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};