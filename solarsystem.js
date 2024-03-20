import * as THREE from "three";
import { createPolarGrid } from "./polarGrid";

const solarSystemProperties = {
    rotateX: 10,
    rotateY: 10,
    rotateZ: 10,
    showEquatorialGrid: false
}

export const solarSystem = new THREE.Group();
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // 0xffffff is the color (white), 1.0 is the intensity
const polarGrid = createPolarGrid(50)


export function initSolarSystem(gui, scene, renderer, camera) {
    const solarSystemFolder = gui.addFolder( 'Solar System' );

    solarSystemFolder.add( solarSystemProperties, 'rotateX', -180, 180, 1 ).onChange(v => {
        solarSystemProperties.rotateX = Number(v)
        solarSystem.rotation.x = solarSystemProperties.rotateX * (Math.PI / 180);
        renderer.render(scene, camera);
    });
    solarSystemFolder.add( solarSystemProperties, 'rotateY', -180, 180, 1 ).onChange(v => {
        solarSystemProperties.rotateY = Number(v)
        solarSystem.rotation.y = solarSystemProperties.rotateY * (Math.PI / 180);
        renderer.render(scene, camera);
    });
    solarSystemFolder.add( solarSystemProperties, 'rotateZ', -180, 180, 1 ).onChange(v => {
        solarSystemProperties.rotateZ = Number(v)
        solarSystem.rotation.z = solarSystemProperties.rotateZ * (Math.PI / 180);
        renderer.render(scene, camera);
    });
    solarSystemFolder.add( solarSystemProperties, 'showEquatorialGrid' ).onChange(v => {
        solarSystemProperties.showEquatorialGrid = v
    
        if (v === true) {
            solarSystem.add( polarGrid );
        } else {
            solarSystem.remove( polarGrid );
        }
    
        renderer.render(scene, camera);
    });
}

/**
    SUN
*/

// Star (Sun)
const starGeometry = new THREE.SphereGeometry(5, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const star = new THREE.Mesh(starGeometry, starMaterial);

// Define the geometry for the poles
const poleGeometry = new THREE.BufferGeometry();
const poleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); 
const polePoints = [];
polePoints.push(new THREE.Vector3(0, -20, 0)); // Adjust length as needed
polePoints.push(new THREE.Vector3(0, 20, 0));  // Adjust length as needed
poleGeometry.setFromPoints(polePoints);
const poleLine = new THREE.Line(poleGeometry, poleMaterial);

// Sunlight
const sunLight = new THREE.PointLight(0xffffff, 100, 1000);
sunLight.position.set(0, 0, 0);

// apply the axial tilt to the entire solarsystem
solarSystem.rotation.x = solarSystemProperties.rotateX * (Math.PI / 180);
solarSystem.rotation.y = solarSystemProperties.rotateY * (Math.PI / 180);
solarSystem.rotation.z = solarSystemProperties.rotateZ * (Math.PI / 180);


solarSystem.add(star);
solarSystem.add(ambientLight);
solarSystem.add(poleLine);
solarSystem.add(sunLight);

// solar system grid
solarSystemProperties.showEquatorialGrid ? solarSystem.add(polarGrid): null;
