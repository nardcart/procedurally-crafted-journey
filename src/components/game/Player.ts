import * as THREE from 'three';

export class Player {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  speed: number;

  constructor() {
    // Create a more detailed player model
    const geometry = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3366ff,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(6, 0.2, 1.5);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244cc,
      flatShading: true,
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = 0.7;
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(1, 0.5, 1.5);
    const tailMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244cc,
      flatShading: true,
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = -1.5;
    tail.position.y = 0.7;

    // Combine all parts
    const playerMesh = new THREE.Group();
    playerMesh.add(body);
    playerMesh.add(wings);
    playerMesh.add(tail);

    this.mesh = playerMesh;
    this.mesh.position.set(0, 10, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.velocity = new THREE.Vector3();
    this.speed = 0.3; // Increased speed
  }

  update(keys: Set<string>) {
    // Enhanced movement with better physics
    const friction = 0.95;
    const acceleration = 0.05;

    if (keys.has('ArrowUp') || keys.has('w')) {
      this.velocity.z -= this.speed * acceleration;
    }
    if (keys.has('ArrowDown') || keys.has('s')) {
      this.velocity.z += this.speed * acceleration;
    }
    if (keys.has('ArrowLeft') || keys.has('a')) {
      this.velocity.x -= this.speed * acceleration;
    }
    if (keys.has('ArrowRight') || keys.has('d')) {
      this.velocity.x += this.speed * acceleration;
    }

    // Apply velocity with improved damping
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    this.velocity.multiplyScalar(friction);

    // Enhanced rotation with banking effect
    if (this.velocity.length() > 0.01) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      const targetRotation = new THREE.Euler(
        this.velocity.z * 0.1, // Bank forward/backward
        angle, // Turn left/right
        -this.velocity.x * 0.1 // Bank left/right
      );
      
      // Smooth rotation
      this.mesh.rotation.x += (targetRotation.x - this.mesh.rotation.x) * 0.1;
      this.mesh.rotation.y += (targetRotation.y - this.mesh.rotation.y) * 0.1;
      this.mesh.rotation.z += (targetRotation.z - this.mesh.rotation.z) * 0.1;
    }
  }
}