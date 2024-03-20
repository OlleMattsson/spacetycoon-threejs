import * as THREE from "three";

export function createPolarGrid(
    radius = 20,     // size of grid
    radials = 16,    // number of radial lines (ie "spokes")
    circles = 10,    // number of concentric cirles
    divisions = 64,   // number of segments per concentric circle, higher => rounder
    color = 0x3d3d3d,
    opacity = 0.1
) {
    const material = new THREE.LineBasicMaterial({ color, opacity});
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    // Create radials
    for (let i = 0; i <= radials; i++) {
        const theta = (i / radials) * Math.PI * 2;
        vertices.push(0, 0, 0);
        vertices.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    }
    
    // Create concentric circles
    for (let i = 0; i <= circles; i++) {
        const r = (radius / circles) * i;
        for (let j = 0; j < divisions; j++) {
            const theta1 = (j / divisions) * Math.PI * 2;
            const theta2 = ((j + 1) / divisions) * Math.PI * 2;
            vertices.push(Math.cos(theta1) * r, 0, Math.sin(theta1) * r);
            vertices.push(Math.cos(theta2) * r, 0, Math.sin(theta2) * r);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    //const line = new THREE.LineSegments(geometry, material);
    //scene.add(line);
    
    return new THREE.LineSegments(geometry, material);
}