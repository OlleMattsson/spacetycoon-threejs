import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
camera.position.z = 30;
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
const planeGeometry = new THREE.PlaneGeometry(50, 50); // Width and height of the plane
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00, 
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.1, 
});
const equatorialPlane = new THREE.Mesh(planeGeometry, planeMaterial);
equatorialPlane.rotation.x = Math.PI / 2; // Align with equator


// Sunlight
const sunLight = new THREE.PointLight(0xffffff, 50, 1000);
sunLight.position.set(0, 0, 0);

solarSystem.add(star);
solarSystem.add(poleLine);
solarSystem.add(equatorialPlane);
solarSystem.add(sunLight);







/**
    PLANET
 */

// Orbital elements
const semiMajorAxis = 10;
const eccentricity = 1;
const inclination = 0; // degrees
const longitudeAscendingNode = 0; // position of ascending node in degrees from reference direction (eg vernal equinox)
const argumentPeriapsis = 0; // position of periapsis in degrees from ascending node
const trueAnomaly = 0; // body's current position in degrees from argument of periapsis


const planetGeometry = new THREE.SphereGeometry(1, 32, 32);
const planetMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
solarSystem.add(planet);

// inclination
const inclinationDegrees = 20;

// Elliptical orbit parameters, in radii from sun center
// equal axis = circular orbit, ie eccentricity = 0
const majorAxis = 30; // Semi-major axis
const minorAxis = 30; // Semi-minor axis

// somewhat similar to the true anomaly
let angle = 0; // radians


// Orbit Path of planet
const orbitMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff, // Change the color as needed
});

const orbitGeometry = new THREE.BufferGeometry();
const maxPoints = 1000; // Maximum number of points in the orbit path
const positions = new Float32Array(maxPoints * 3); // Each point requires x, y, z coordinates
orbitGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
let pointIndex = 0; // Keep track of the last point added to the orbit path


const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
solarSystem.add(orbitLine);






// apply the axial tilt to the entire solarsystem
solarSystem.rotation.x = 0;
solarSystem.rotation.y = 0;
solarSystem.rotation.z = 0;


scene.add(solarSystem);





const G = 6.67430e-11; // Gravitational constant
const M_earth = 10000000000000; // Mass of Earth, used to calculate gravitational parameter (μ)

// Assuming we're orbiting Earth for this example, so we use Earth's gravitational parameter
const mu = G * M_earth; 

// Orbital elements
const a = 15; // Semi-major axis in meters (e.g., a low Earth orbit)
const e = 0.3; // Eccentricity
const i = 45 ; // Inclination in degrees
const omega = 0 * Math.PI / 180; // Longitude of the Ascending Node in radians
const w = 0 * Math.PI / 180; // Argument of Periapsis in radians
let M = 0 * Math.PI / 180; // Mean Anomaly in radians, initialized for example

// Calculate the mean motion (n) - the rate at which the mean anomaly increases
const n = Math.sqrt(mu / Math.pow(a, 3));

let lastTime = 0; // Initialize a variable to store the time of the last frame


function animate(time = 0) {
  requestAnimationFrame(animate);

  // update mean anomaly
  const deltaTime = (time - lastTime) * 0.001; // Calculate delta time in seconds
  lastTime = time; // Update lastTime for the next frame

  M += n * deltaTime; // Update M based on delta time




    // Simplified conversion from mean anomaly to true anomaly (ν)
    // This is a very rough approximation for small eccentricities
    let E = M + e * Math.sin(M); // Eccentric anomaly, approximate
    let nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); // True anomaly, approximate

    // Calculate position in the orbit plane
    let r = a * (1 - e * Math.cos(E)); // Distance from the central body
    let x = r * Math.cos(nu);
    let y = r * Math.sin(nu);

    // Convert to 3D coordinates
// Correctly include 'y' in the 3D coordinate transformation
const _i = (i - 90) * Math.PI / 180

let X = x * (Math.cos(omega) * Math.cos(omega) - Math.sin(omega) * Math.sin(w) * Math.cos(_i)) + 
        y * (-Math.cos(omega) * Math.sin(w) - Math.sin(omega) * Math.cos(w) * Math.cos(_i));

let Y = x * (Math.sin(omega) * Math.cos(w) + Math.cos(omega) * Math.sin(w) * Math.cos(_i)) + 
        y * (-Math.sin(omega) * Math.sin(w) + Math.cos(omega) * Math.cos(w) * Math.cos(_i));

let Z = x * (Math.sin(w) * Math.sin(_i)) + y * (Math.cos(w) * Math.sin(_i));

    //planet.position.set(X, Y, Z);

    planet.position.x = X
    planet.position.y = Y
    planet.position.z = Z




  // Calculate the elliptical orbit
  /*
  angle += 0.01;
  let inclinationRad = (inclinationDegrees - 90) * Math.PI / 180
  planet.position.x = majorAxis * Math.cos(angle);
  planet.position.y = minorAxis * Math.sin(angle) * Math.cos(inclinationRad);
  planet.position.z = minorAxis * Math.sin(angle) * Math.sin(inclinationRad);
*/

  // Add the current planet position to the orbit path
  
  if (pointIndex < maxPoints) {
    positions[pointIndex * 3] = planet.position.x;
    positions[pointIndex * 3 + 1] = planet.position.y;
    positions[pointIndex * 3 + 2] = planet.position.z;
    orbitGeometry.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
    pointIndex++;
  }

  orbitGeometry.setDrawRange(0, pointIndex); // Only draw the part of the geometry that has been updated
  

  controls.update();

  renderer.render(scene, camera);
}

animate();




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
