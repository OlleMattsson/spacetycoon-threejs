import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';
import { initUniverse } from "./universe";
import { initSolarSystem, solarSystem} from "./solarsystem";
import { p2pPos, drawPlanetToPlanetLine } from "./drawPlanetToPlanetLine";
import shiftNPush from "./shiftNPush";
import { Planet } from "./planet";
import { createStarField } from "./starfield";
import {shipLine as planet2planetLine} from './drawPlanetToPlanetLine'
import {deg2Rad} from './helpers'
import {calculateAngleBetweenOrbiters} from './calculateAngleBetweenOrbiters'

// GUI
const gui = new GUI();
const guiDomElement = gui.domElement;
guiDomElement.style.position = 'absolute';
guiDomElement.style.top = '0px';
guiDomElement.style.left = '0px';
guiDomElement.style.removeProperty('right');
const planetsFolder = gui.addFolder("Planets").close()
planetsFolder.add({addPlanet: () => addPlanetHandler()}, "addPlanet").name("Add Planet")

// Scene 
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
camera.position.x = 20;
camera.position.y = 20;
camera.position.z = 40;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Set the look at point to the center of the star
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.update(); // Must be called after any manual changes to the camera's transform
  
// init assets & gui elements
initUniverse(gui, scene, renderer, camera)
initSolarSystem(gui, scene, renderer, camera)

// add planet assets 
const dynPlanets = []
const planet1 = new Planet({a: 11, omega: 270, trailLength: 1000, mass: 200000, size: 2, drawCone: true, solarSystem})
const moon1 = new Planet({a: 4, orbitalParent: planet1, trailLength: 0, trailColor: 0x0000ff, i: 20,size: 0.5})

const planet2 = new Planet({a: 30, i: 5, trailLength: 2000, mass: 1000000, size: 3, drawCone: true})
const moon2 = new Planet({a: 5, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.5})
const moon3 = new Planet({a: 8, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.6})
const moon4 = new Planet({a: 10, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 90, size: 0.3})


dynPlanets.push(planet1, planet2, moon1,  moon2, moon3, moon4)

dynPlanets.forEach(p => {
    p.initPlanetUI(planetsFolder, scene, camera, renderer)
    solarSystem.add(p.planetMesh)
    solarSystem.add(p.trailLine)
    //solarSystem.add(p.cone)
    solarSystem.add(p.parentLine)
})

function addPlanetHandler() {
    const newPlanet = new Planet({})
    newPlanet.initPlanetUI(planetsFolder, scene, camera, renderer)
    dynPlanets.push(newPlanet)
    solarSystem.add(newPlanet.planetMesh)
    solarSystem.add(newPlanet.trailLine)
}
  
scene.add(solarSystem);
//solarSystem.add(planet2planetLine)

// X = red
// Y = green
// Z = blue
const axesHelper = new THREE.AxesHelper( 15 );
axesHelper.position.set(0,0,0)
scene.add( axesHelper );

//scene.add(planet1.cone)

// Create 10000 stars within a spread of 2000 units
const stars = createStarField(4500, 2000, 300);

// Add the star field to the scene
scene.add(stars);


// placeholder ship object
const geometry = new THREE.SphereGeometry(0.5, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const shipObject = new THREE.Mesh(geometry, material);

// line that displays ship's current path
const geometry1 = new THREE.BufferGeometry()
const material1 = new THREE.LineBasicMaterial({color: 0xff0000});  
const linePos = new Float32Array(2*3) // we need two points with three coordinates each
geometry1.setAttribute(
    'position', 
    new THREE.BufferAttribute(linePos, 3)
)
const line = new THREE.Line(geometry1, material1)


// ship trail
const shipTrailMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff, // Change the color as needed
});

const shipTrailGeo = new THREE.BufferGeometry();
const shipTrailMaxPoints = 500; // adjust length of orbital path trail
let shipTrailPositions = new Float32Array(shipTrailMaxPoints * 3); // Each point requires x, y, z coordinates
shipTrailGeo.setAttribute("position", new THREE.BufferAttribute(shipTrailPositions, 3));
let shipTrailPointIndex = 0; // Keep track of the last point added to the orbit path
const shipTrailLine = new THREE.Line(shipTrailGeo, shipTrailMaterial);




// store positions of planets as XYZ points and use that to update a Line geometry
function drawOrbitalPaths() {
   
   // ship
    if (shipTrailPointIndex < shipTrailMaxPoints) {
        shipTrailPositions[shipTrailPointIndex * 3] = shipObject.position.x;
        shipTrailPositions[shipTrailPointIndex * 3 + 1] = shipObject.position.y;
        shipTrailPositions[shipTrailPointIndex * 3 + 2] = shipObject.position.z;
        shipTrailGeo.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
        shipTrailPointIndex++;
        shipTrailGeo.setDrawRange(1, shipTrailPointIndex -1); // Only draw the part of the geometry that has been updated
    } else {
        shiftNPush(shipObject.position.x, shipTrailPositions, shipTrailMaxPoints * 3)
        shiftNPush(shipObject.position.y, shipTrailPositions, shipTrailMaxPoints * 3)
        shiftNPush(shipObject.position.z, shipTrailPositions, shipTrailMaxPoints * 3)
        shipTrailGeo.attributes.position.needsUpdate = true;
        shipTrailGeo.setDrawRange(0, shipTrailMaxPoints); // Only draw the part of the geometry that has been updated        
    }
}

let pT = 0;                     // Timestamp of previous frame, previousTime

let elapsedTime = 0; // Track the elapsed time since the start of the movement
let start, end
let journeyFraction
document.addEventListener('keydown', launchShip)
let updateShipPosition = false

function animate(time = 0) {    // default to 0, otherwise time is undefined on the very first frame
    requestAnimationFrame(animate);

    const dT = (time - pT);     // calculate deltaTime in milliseconds, dT
    pT = time;                  // Update lastTime for the next frame  
    elapsedTime += dT;

    drawOrbitalPaths() 
    drawPlanetToPlanetLine(dynPlanets[0], dynPlanets[1])
    const angle = calculateAngleBetweenOrbiters(dynPlanets[0], dynPlanets[1])
   
    if (angle < 60 && !updateShipPosition) {
        launchShip()
    }

    dynPlanets.forEach((p) => {
        p.updatePlanetPosition(dT)
        p.drawPlanetTrail()
        p.drawLineToParent()
    })

// THIS IS ALL ABOUT COLLISION DETECTION

    dynPlanets[1].planetGeometry.computeBoundingSphere();
    shipObject.geometry.computeBoundingSphere();

    if(start && end && updateShipPosition) {

        // update end position of ship trajectory line
        linePos[3] = p2pPos[3]
        linePos[4] = p2pPos[4]
        linePos[5] = p2pPos[5]

        geometry1.setAttribute(
            'position', 
            new THREE.BufferAttribute(linePos, 3)
        )

        // update end point of ship
        end = new THREE.Vector3(p2pPos[3], p2pPos[4], p2pPos[5])    


        const speed = 0.002; // Units per second
        const distance = start.distanceTo(end);
        const travelTime = distance / speed;

        // Calculate the fraction of the journey completed
        journeyFraction = (elapsedTime % travelTime) / travelTime;

        // Update object position
        shipObject.position.lerpVectors(start, end, journeyFraction);   
        
        // Update the boundingSphere centers based on current world positions
        const center1 = shipObject.geometry.boundingSphere.center.clone().add(shipObject.position);
        const center2 = dynPlanets[1].planetMesh.geometry.boundingSphere.center.clone().add(dynPlanets[1].planetMesh.position);
                
        //const distance2 = planet2Mesh.geometry.boundingSphere.center.distanceTo(shipObject.geometry.boundingSphere.center);
        const distance2 = center1.distanceTo(center2);
        //console.log(center1, center2, distance2)

        const sumOfRadii = dynPlanets[1].planetMesh.geometry.boundingSphere.radius + shipObject.geometry.boundingSphere.radius;
        
        if (distance2 < sumOfRadii) {
            console.log(`Journey took ${elapsedTime / 1000} seconds `);
            solarSystem.remove(shipObject);
            solarSystem.remove(line);
            solarSystem.remove(shipTrailLine)
            updateShipPosition = false
        }

    }

    controls.update();
    renderer.render(scene, camera);
}

animate();







function launchShip(event) {
    if (event && event.key !== ' ' && event.code !== 'Space') {
        return
    }


    updateShipPosition = !updateShipPosition

    if (updateShipPosition) {

        solarSystem.add(shipObject);
        elapsedTime = 0
        shipTrailPointIndex = 0


        linePos[0] = p2pPos[0]
        linePos[1] = p2pPos[1]
        linePos[2] = p2pPos[2]
        linePos[3] = p2pPos[3]
        linePos[4] = p2pPos[4]
        linePos[5] = p2pPos[5]

        geometry1.setAttribute(
            'position', 
            new THREE.BufferAttribute(linePos, 3)
        )

        //solarSystem.add(line);
        solarSystem.add(shipTrailLine)

    } else {
        solarSystem.remove(shipObject);
        solarSystem.remove(line);
        solarSystem.remove(shipTrailLine)
    }

    start = new THREE.Vector3(p2pPos[0], p2pPos[1], p2pPos[2])
    end = new THREE.Vector3(p2pPos[3], p2pPos[4], p2pPos[5])    
}