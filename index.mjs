import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';


const G = 6.67430e-11; // Gravitational constant
const gui = new GUI();
const guiDomElement = gui.domElement;
guiDomElement.style.position = 'absolute';
guiDomElement.style.top = '0px';
guiDomElement.style.left = '0px';
guiDomElement.style.removeProperty('right');

// SolarSystem
const folder = gui.addFolder( 'Solar System' );
const solarSystemControls = {
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0
}
folder.add( solarSystemControls, 'rotateX', -180, 180, 1 ).onChange(v => {
    solarSystemControls.rotateX = Number(v)
    solarSystem.rotation.x = solarSystemControls.rotateX * (Math.PI / 180);
    renderer.render(scene, camera);
});
folder.add( solarSystemControls, 'rotateY', -180, 180, 1 ).onChange(v => {
    solarSystemControls.rotateY = Number(v)
    solarSystem.rotation.y = solarSystemControls.rotateY * (Math.PI / 180);
    renderer.render(scene, camera);
});
folder.add( solarSystemControls, 'rotateZ', -180, 180, 1 ).onChange(v => {
    solarSystemControls.rotateZ = Number(v)
    solarSystem.rotation.z = solarSystemControls.rotateZ * (Math.PI / 180);
    renderer.render(scene, camera);
});


// Scene setup
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


/*
    CAMERA
*/
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
camera.position.x = 10;
camera.position.y = 25;
camera.position.z = 30
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Set the look at point to the center of the star
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.update(); // Must be called after any manual changes to the camera's transform
  


/* 
    UNIVERSE GRID 

    This is a reference grid that lies flat across the universe, the solar system incliation
    is in reference to the universe grid

*/

// Grid properties
const size = 200;
const divisions = size / 10;
const gridColor = 0x707070;
const centerLineColor = 0x303030; // Can be the same or different

const universeGrid = new THREE.GridHelper(size, divisions, gridColor, centerLineColor);
scene.add(universeGrid);


/**
 * SOLAR SYSTEM
 */

const solarSystem = new THREE.Group();
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // 0xffffff is the color (white), 1.0 is the intensity



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


// Equatorial Plane (Simple Plane aligned with the star's equator)
/*
const planeGeometry = new THREE.PlaneGeometry(50, 50); // Width and height of the plane
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00, 
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.05, 
});
const equatorialPlane = new THREE.Mesh(planeGeometry, planeMaterial);
equatorialPlane.rotation.x = Math.PI / 2; // Align with equator
*/

// Sunlight
const sunLight = new THREE.PointLight(0xffffff, 100, 1000);
sunLight.position.set(0, 0, 0);









/**
    PLANET 1
 */

// orbital elements
const planet1 = {
    mass: 1000000,
    a: 10, // Semi-major axis in meters 
    e: 0.3, // eccentricity
    i: 2, // inclination in degrees
    omega: 1 * Math.PI / 180, // Longitude of the Ascending Node in radians
    w: 0.5 * Math.PI / 180, // Argument of Periapsis in radians
    M: 0.5 * Math.PI / 180, // Mean Anomaly in radians,       
}

// planet mesh
const planet1Geometry = new THREE.SphereGeometry(1, 32, 32);
const planet1Material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const planet1Mesh = new THREE.Mesh(planet1Geometry, planet1Material);    

// orbit path line
const orbitMaterial1 = new THREE.LineBasicMaterial({
  color: 0xffffff, // Change the color as needed
});


/**
 
The orbit path is a line consisting of points that have XYZ positions.
The points are stored in the array positions1
The XYZ positions are determined by the planet's position during animation function
Ie. on each frame, a position is added to the positions array
As positions for the line points are added the the array, the animate function draws ut a longer and longer line behind the planet
Until the maxPoints1 number is reached, at which point we have drawn the entire path of the planet and no more points are added the the geometry
 
 */
const maxPoints1 = 500; // Maximum number of points in the orbit path, the path being draw in to short, increase this number
const orbitGeometry1 = new THREE.BufferGeometry(); // contains the positions used for drawing the line
const positions1 = new Float32Array(maxPoints1 * 3); // Each point requires x, y, z coordinates
orbitGeometry1.setAttribute("position", new THREE.BufferAttribute(positions1, 3));
let pointIndex1 = 0; // Keep track of the last point added to the orbit path
const orbitLine1 = new THREE.Line(orbitGeometry1, orbitMaterial1); // orbitLine is eventually placed in the scene


/**
    PLANET 2
 */
const planet2 = {
    mass: 1000000,
    a: 20, // Semi-major axis in meters 
    e: 0.5, // eccentricity
    i: 20, // inclination in degrees
    omega: 0 * Math.PI / 180, // Longitude of the Ascending Node in radians
    w: 0 * Math.PI / 180, // Argument of Periapsis in radians
    M: 0 * Math.PI / 180, // Mean Anomaly in radians       
}

const planet2Geometry = new THREE.SphereGeometry(1, 32, 32);
const planet2Material = new THREE.MeshLambertMaterial({ color: 0xdb5f00 });
const planet2Mesh = new THREE.Mesh(planet2Geometry, planet2Material);    

// orbit path line
const orbitMaterial2 = new THREE.LineBasicMaterial({
    color: 0xffffff, // Change the color as needed
});

const orbitGeometry2 = new THREE.BufferGeometry();
const maxPoints2 = 1000; // adjust length of orbital path trail
const positions2 = new Float32Array(maxPoints2 * 3); // Each point requires x, y, z coordinates
orbitGeometry2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
let pointIndex2 = 0; // Keep track of the last point added to the orbit path
const orbitLine2 = new THREE.Line(orbitGeometry2, orbitMaterial2);
  

    
const planets = [planet1, planet2]


planets.forEach((p, i) => {
    const mu = G * p.mass
    planets[i].n = Math.sqrt(mu / Math.pow(p.a, 3));
})

// apply the axial tilt to the entire solarsystem
solarSystem.rotation.x = solarSystemControls.rotateX * (Math.PI / 180);
solarSystem.rotation.y = solarSystemControls.rotateY * (Math.PI / 180);
solarSystem.rotation.z = solarSystemControls.rotateZ * (Math.PI / 180);

console.log(solarSystemControls.x)

solarSystem.add(star);
solarSystem.add(ambientLight);
solarSystem.add(poleLine);
//solarSystem.add(equatorialPlane);
solarSystem.add(sunLight);
solarSystem.add(planet1Mesh);
solarSystem.add(planet2Mesh);
solarSystem.add(orbitLine1);
solarSystem.add(orbitLine2);
scene.add(solarSystem);





function updatePlanetPositions(deltaTime) {
    planets.forEach((p, i) => {
        // update mean anomaly
        p.M += p.n * deltaTime; 

        // Simplified conversion from mean anomaly to true anomaly (ν)
        // This is a very rough approximation for small eccentricities
        let E = p.M + p.e * Math.sin(p.M); // Eccentric anomaly, approximate
        let nu = 2 * Math.atan2(Math.sqrt(1 + p.e) * Math.sin(E / 2), Math.sqrt(1 - p.e) * Math.cos(E / 2)); // True anomaly, approximate

        // Calculate position in the orbit plane
        let r = p.a * (1 - p.e * Math.cos(E)); // Distance from the central body
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);

        // convert inclination degrees to radians, 
        // subtracting 90 so that inclination of 0 degrees is an orbit around the equator
        const _i = (p.i - 90) * Math.PI / 180

        // Convert to 3D coordinates
        p.X = x * (Math.cos(p.omega) * Math.cos(p.omega) - Math.sin(p.omega) * Math.sin(p.w) * Math.cos(_i)) + 
                y * (-Math.cos(p.omega) * Math.sin(p.w) - Math.sin(p.omega) * Math.cos(p.w) * Math.cos(_i));

        p.Y = x * (Math.sin(p.omega) * Math.cos(p.w) + Math.cos(p.omega) * Math.sin(p.w) * Math.cos(_i)) + 
                y * (-Math.sin(p.omega) * Math.sin(p.w) + Math.cos(p.omega) * Math.cos(p.w) * Math.cos(_i));

        p.Z = x * (Math.sin(p.w) * Math.sin(_i)) + y * (Math.cos(p.w) * Math.sin(_i));
    })


    planet1Mesh.position.set(planets[0].X, planets[0].Y, planets[0].Z);
    planet2Mesh.position.set(planets[1].X, planets[1].Y, planets[1].Z);
}

// store positions of planets as XYZ points and use that to update a Line geometry
function drawOrbitalPaths() {
    // planet 1

    if (pointIndex1 < maxPoints1) { // store position if there is still space in the array
        positions1[pointIndex1 * 3] = planet1Mesh.position.x;       // store the position of the planet
        positions1[pointIndex1 * 3 + 1] = planet1Mesh.position.y;
        positions1[pointIndex1 * 3 + 2] = planet1Mesh.position.z;
        orbitGeometry1.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
        pointIndex1++;
        orbitGeometry1.setDrawRange(0, pointIndex1); 
    } else {
        pushToFixedArray(planet1Mesh.position.x, positions1, maxPoints1 * 3)
        pushToFixedArray(planet1Mesh.position.y, positions1, maxPoints1 * 3)
        pushToFixedArray(planet1Mesh.position.z, positions1, maxPoints1 * 3)
        orbitGeometry1.attributes.position.needsUpdate = true;
        orbitGeometry1.setDrawRange(0, maxPoints1); // Only draw the part of the geometry that has been updated        
    }
    
     
    // planet 2
    if (pointIndex2 < maxPoints2) {
        positions2[pointIndex2 * 3] = planet2Mesh.position.x;
        positions2[pointIndex2 * 3 + 1] = planet2Mesh.position.y;
        positions2[pointIndex2 * 3 + 2] = planet2Mesh.position.z;
        orbitGeometry2.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
        pointIndex2++;
        orbitGeometry2.setDrawRange(0, pointIndex2); // Only draw the part of the geometry that has been updated
    } else {
        pushToFixedArray(planet2Mesh.position.x, positions2, maxPoints2 * 3)
        pushToFixedArray(planet2Mesh.position.y, positions2, maxPoints2 * 3)
        pushToFixedArray(planet2Mesh.position.z, positions2, maxPoints2 * 3)
        orbitGeometry2.attributes.position.needsUpdate = true;
        orbitGeometry2.setDrawRange(0, maxPoints2); // Only draw the part of the geometry that has been updated        
    }
}


let pT = 0;                     // Timestamp of previous frame, previousTime

function animate(time = 0) {    // default to 0, otherwise time is undefined on the very first frame
    requestAnimationFrame(animate);

    const dT = (time - pT);     // calculate deltaTime in milliseconds, dT
    pT = time;                  // Update lastTime for the next frame  

    updatePlanetPositions(dT)
    drawOrbitalPaths() 

    controls.update();
    renderer.render(scene, camera);
}

animate();


/*
// Function to update the axial tilt based on the input value
function updateAxialTilt() {
    const axialTiltInputX = document.getElementById('axialTiltInputX');
    const axialTiltDegreesX = parseFloat(axialTiltInputX.value);
    const axialTiltRadiansX = axialTiltDegreesX * (Math.PI / 180);

    const axialTiltInputY = document.getElementById('axialTiltInputY');
    const axialTiltDegreesY = parseFloat(axialTiltInputY.value);
    const axialTiltRadiansY = axialTiltDegreesY * (Math.PI / 180);

    const axialTiltInputZ = document.getElementById('axialTiltInputZ');
    const axialTiltDegreesZ = parseFloat(axialTiltInputZ.value);
    const axialTiltRadiansZ = axialTiltDegreesZ * (Math.PI / 180);

    // Update the sun group's rotation to reflect the new axial tilt
    solarSystem.rotation.x = axialTiltRadiansX;
    solarSystem.rotation.y = axialTiltRadiansY;
    solarSystem.rotation.z = axialTiltRadiansZ;

    // Since the scene has changed, we need to render it again
    renderer.render(scene, camera);
}

// Add an event listener to the input box to update the tilt on change
document.getElementById('axialTiltInputX').addEventListener('change', updateAxialTilt);
document.getElementById('axialTiltInputY').addEventListener('change', updateAxialTilt);
document.getElementById('axialTiltInputZ').addEventListener('change', updateAxialTilt);

// Initial rendering of the scene
updateAxialTilt();
*/

function pushToFixedArray(item, array, maxLength) {
    if (array.length >= maxLength) {
        // Shift all elements to the left if the array has reached its max length
        for (let i = 1; i < maxLength; i++) {
            array[i - 1] = array[i];
        }
        // Replace the last element with the new item
        array[maxLength - 1] = item;
    } else {
        // If the array hasn't reached its max length yet, simply push the item
        array.push(item);
    }
}