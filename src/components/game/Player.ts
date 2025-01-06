import * as THREE from 'three';

export class Player {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  speed: number;

  constructor() {
    // Create a simple plane geometry
    const geometry = new THREE.BoxGeometry(2, 0.5, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x3366ff,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 10, 0); // Start position above the terrain
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.velocity = new THREE.Vector3();
    this.speed = 0.2;
  }

  update(keys: Set<string>) {
    // Handle movement based on key input
    if (keys.has('ArrowUp') || keys.has('w')) {
      this.velocity.z -= this.speed;
    }
    if (keys.has('ArrowDown') || keys.has('s')) {
      this.velocity.z += this.speed;
    }
    if (keys.has('ArrowLeft') || keys.has('a')) {
      this.velocity.x -= this.speed;
    }
    if (keys.has('ArrowRight') || keys.has('d')) {
      this.velocity.x += this.speed;
    }

    // Apply velocity with damping
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    this.velocity.multiplyScalar(0.95); // Damping

    // Rotate the plane in the direction of movement
    if (this.velocity.length() > 0.01) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
    }
  }
}