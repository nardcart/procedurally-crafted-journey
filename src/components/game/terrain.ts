import * as THREE from 'three';
import type { NoiseFunction2D } from 'simplex-noise';

const TERRAIN_COLORS = {
  GRASS: 0x4ade80,
  DIRT: 0x92400e,
  STONE: 0x64748b,
  SNOW: 0xffffff,
};

export const generateTerrain = (noise2D: NoiseFunction2D) => {
  const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  const colors = new Float32Array(vertices.length);
  
  // Generate height map using noise
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 25;
    const z = vertices[i + 2] / 25;
    
    // Combine multiple noise layers for more natural terrain
    const elevation = 
      noise2D(x * 0.5, z * 0.5) * 10 + // Base terrain (mountains)
      noise2D(x * 2, z * 2) * 2.5 + // Medium details (hills)
      noise2D(x * 4, z * 4) * 1.25 + // Fine details (rocks)
      noise2D(x * 8, z * 8) * 0.6; // Micro details (roughness)
    
    vertices[i + 1] = elevation;

    // Set vertex colors based on height
    const color = new THREE.Color();
    if (elevation > 8) {
      color.setHex(TERRAIN_COLORS.SNOW);
    } else if (elevation > 5) {
      color.setHex(TERRAIN_COLORS.STONE);
    } else if (elevation > 0) {
      color.setHex(TERRAIN_COLORS.GRASS);
    } else {
      color.setHex(TERRAIN_COLORS.DIRT);
    }

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  // Update normals for proper lighting
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Create material with vertex colors
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.1,
    roughness: 0.8,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return mesh;
};

export const getHeightAtPosition = (noise2D: NoiseFunction2D, x: number, z: number): number => {
  const scaledX = x / 25;
  const scaledZ = z / 25;
  
  return (
    noise2D(scaledX * 0.5, scaledZ * 0.5) * 10 +
    noise2D(scaledX * 2, scaledZ * 2) * 2.5 +
    noise2D(scaledX * 4, scaledZ * 4) * 1.25 +
    noise2D(scaledX * 8, scaledZ * 8) * 0.6
  );
};