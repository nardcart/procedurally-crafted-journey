import * as THREE from 'three';
import type { NoiseFunction2D } from 'simplex-noise';

export const generateTerrain = (noise2D: NoiseFunction2D) => {
  const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  
  // Generate height map using noise
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 25;
    const z = vertices[i + 2] / 25;
    
    // Combine multiple noise layers for more natural terrain
    const elevation = 
      noise2D(x, z) * 5 + // Base terrain
      noise2D(x * 2, z * 2) * 2.5 + // Medium details
      noise2D(x * 4, z * 4) * 1.25; // Fine details
    
    vertices[i + 1] = elevation;
  }

  // Update normals for proper lighting
  geometry.computeVertexNormals();

  // Create material with grass-like appearance
  const material = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    metalness: 0.1,
    roughness: 0.8,
    flatShading: true,
  });

  return new THREE.Mesh(geometry, material);
};

// Helper function to get height at position
export const getHeightAtPosition = (noise2D: NoiseFunction2D, x: number, z: number): number => {
  const scaledX = x / 25;
  const scaledZ = z / 25;
  
  return (
    noise2D(scaledX, scaledZ) * 5 +
    noise2D(scaledX * 2, scaledZ * 2) * 2.5 +
    noise2D(scaledX * 4, scaledZ * 4) * 1.25
  );
};