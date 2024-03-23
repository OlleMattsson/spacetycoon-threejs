import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';
import { initUniverse } from "./universe";
import { initSolarSystem, solarSystem} from "./solarsystem";
import { p2pPos } from "./drawPlanetToPlanetLine";
import shiftNPush from "./shiftNPush";
import { Planet } from "./planet";
import { createStarField } from "./starfield";

// GUI
const gui = new GUI();
const guiDomElement = gui.domElement;
guiDomElement.style.position = 'absolute';
guiDomElement.style.top = '0px';
guiDomElement.style.left = '0px';
guiDomElement.style.removeProperty('right');
const planetsFolder = gui.addFolder("Planets")//.close()
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
camera.position.x = 10;
camera.position.y = 25;
camera.position.z = 30

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
const planet1 = new Planet({a: 20, omega: 90, trailLength: 1000, mass: 200000})
const planet2 = new Planet({a: 30, i: 5, trailLength: 2000, mass: 1000000})

const moon1 = new Planet({a: 4, orbitalParent: planet1, trailLength: 0, trailColor: 0x0000ff, i: 20})
const moon2 = new Planet({a: 3, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10})
const moon3 = new Planet({a: 6, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10})
const moon4 = new Planet({a: 9, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 90})

const planet1Group = new THREE.Group();

planet1Group.add(moon1.planetMesh)
planet1Group.add(planet1.planetMesh)

solarSystem.add(planet1Group)



dynPlanets.push(planet1, moon1, planet2, moon2, moon3, moon4)

dynPlanets.forEach(p => {
    p.initPlanetUI(planetsFolder, scene, camera, renderer)
    solarSystem.add(p.planetMesh)
    solarSystem.add(p.trailLine)
})

function addPlanetHandler() {
    const newPlanet = new Planet({})
    newPlanet.initPlanetUI(planetsFolder, scene, camera, renderer)
    dynPlanets.push(newPlanet)
    solarSystem.add(newPlanet.planetMesh)
    solarSystem.add(newPlanet.trailLine)
}
  
scene.add(solarSystem);


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


function animate(time = 0) {    // default to 0, otherwise time is undefined on the very first frame
    requestAnimationFrame(animate);

    const dT = (time - pT);     // calculate deltaTime in milliseconds, dT
    pT = time;                  // Update lastTime for the next frame  
    elapsedTime += dT;

    //updatePlanetPositions(dT, planets)
    //drawOrbitalPaths() 
    //drawPlanetToPlanetLine(planets[0], planets[1])

    //planet2Mesh.position.set(planets[0].X, planets[0].Y, planets[0].Z);

    
    dynPlanets.forEach((p) => {
        //console.log(p.getProperties())

        p.updatePlanetPosition(dT)
        p.drawPlanetTrail()

    })

// THIS IS ALL ABOUT COLLISION DETECTION
/*
    planet2Mesh.geometry.computeBoundingSphere();
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
        const center2 = planet2Mesh.geometry.boundingSphere.center.clone().add(planet2Mesh.position);
                
                //const distance2 = planet2Mesh.geometry.boundingSphere.center.distanceTo(shipObject.geometry.boundingSphere.center);
        const distance2 = center1.distanceTo(center2);
        //console.log(center1, center2, distance2)

        const sumOfRadii = planet2Mesh.geometry.boundingSphere.radius + shipObject.geometry.boundingSphere.radius;
        
        if (distance2 < sumOfRadii) {
            console.log("WE MADE IT!");
            solarSystem.remove(shipObject);
            solarSystem.remove(line);
            solarSystem.remove(shipTrailLine)
            updateShipPosition = false
        }

    }
*/
        controls.update();
        renderer.render(scene, camera);
    }

animate();


document.addEventListener('keydown', launchShip)

let updateShipPosition = false




function launchShip(event) {
    if (event.key !== ' ' && event.code !== 'Space') {
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