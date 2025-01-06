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

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb); // Sky blue
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Initialize noise generator
    noiseRef.current = createNoise2D();

    // Generate initial terrain chunk
    const initialTerrain = generateTerrain(noiseRef.current);
    scene.add(initialTerrain);
    chunksRef.current.set('0,0', initialTerrain);

    // Create player
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
      const renderDistance = 2;
      
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

      // Remove chunks outside render distance
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update player
      if (playerRef.current && noiseRef.current) {
        playerRef.current.update(keysRef.current);
        
        // Get height at player position
        const playerPos = playerRef.current.mesh.position;
        const groundHeight = getHeightAtPosition(noiseRef.current, playerPos.x, playerPos.z);
        playerPos.y = groundHeight + 1; // Keep player slightly above ground

        // Update terrain chunks
        updateTerrainChunks(playerPos);
        
        // Update camera to follow player
        camera.position.x = playerPos.x;
        camera.position.y = playerPos.y + 10;
        camera.position.z = playerPos.z + 20;
        camera.lookAt(playerPos);
      }

      // Update grass animation for visible chunks
      const time = performance.now() * 0.001;
      chunksRef.current.forEach((chunk) => {
        const vertices = chunk.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
          const x = vertices[i];
          const z = vertices[i + 2];
          vertices[i + 1] += Math.sin(time + x * 0.5 + z * 0.5) * 0.01;
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