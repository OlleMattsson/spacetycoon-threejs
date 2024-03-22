import * as THREE from "three";
import { createPolarGrid } from "./polarGrid";

export const solarSystemProperties = {
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    showEquatorialGrid: false,
    showPole: true,
    poleLength: 25,
    sunMass: 1000000
}

export const solarSystem = new THREE.Group();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); 



export function initSolarSystem(gui, scene, renderer, camera) {
    const solarSystemFolder = gui.addFolder( 'Solar System' ).close();

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

    solarSystemFolder.add( solarSystemProperties, 'showPole' ).onChange(v => {
        solarSystemProperties.showPole = v
    
        if (v === true) {
            solarSystem.add( poleLine );
        } else {
            solarSystem.remove( poleLine );
        }
    
        renderer.render(scene, camera);
    });

    solarSystemFolder.add( solarSystemProperties, 'poleLength', 0, 50, 1 ).onChange(v => {
        solarSystemProperties.poleLength = Number(v)
        console.log(solarSystemProperties.poleLength)
        polePoints = []
        polePoints.push(new THREE.Vector3(0, -(solarSystemProperties.poleLength / 2), 0));
        polePoints.push(new THREE.Vector3(0, (solarSystemProperties.poleLength / 2), 0));
        poleGeometry.setFromPoints(polePoints);        
        renderer.render(scene, camera);
    });    
}

// Sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

// Sun's poles
const poleLength = 40 // =)
const poleGeometry = new THREE.BufferGeometry();
const poleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); 
let polePoints = [];
polePoints.push(new THREE.Vector3(0, -(solarSystemProperties.poleLength / 2), 0));
polePoints.push(new THREE.Vector3(0, (solarSystemProperties.poleLength / 2), 0)); 
poleGeometry.setFromPoints(polePoints);
const poleLine = new THREE.Line(poleGeometry, poleMaterial);

// Sunlight
const sunLight = new THREE.PointLight(0xffffff, 100, 1000);
sunLight.position.set(0, 0, 0);

// apply rotation
solarSystem.rotation.x = solarSystemProperties.rotateX * (Math.PI / 180);
solarSystem.rotation.y = solarSystemProperties.rotateY * (Math.PI / 180);
solarSystem.rotation.z = solarSystemProperties.rotateZ * (Math.PI / 180);

// solar system grid
const polarGrid = createPolarGrid(50)

// add objects to group
solarSystem.add(sunMesh);
solarSystem.add(ambientLight);
solarSystem.add(sunLight);
solarSystemProperties.showEquatorialGrid ? solarSystem.add(polarGrid): null;
solarSystemProperties.showPole ? solarSystem.add(poleLine): null;
