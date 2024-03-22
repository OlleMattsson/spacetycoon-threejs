import * as THREE from "three";

export function createStarField(numberOfStars, spread, minDistance) {
    // Create an empty buffer geometry
    const geometry = new THREE.BufferGeometry();
  
    // Create a Float32Array to hold the star positions
    const positions = new Float32Array(numberOfStars * 3); // Each star needs x, y, z coordinates
  
    for (let i = 0; i < numberOfStars; i++) {
      let x, y, z, distance;
      do {
        x = Math.random() * spread - spread / 2;
        y = Math.random() * spread - spread / 2;
        z = Math.random() * spread - spread / 2;
        distance = Math.sqrt(x * x + y * y + z * z);
      } while (distance < minDistance);
  
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
  
    // Attach the positions to the geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
    // Create a material for the stars using PointsMaterial
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  
    // Create the Points object
    const starField = new THREE.Points(geometry, material);
  
    return starField;
  }