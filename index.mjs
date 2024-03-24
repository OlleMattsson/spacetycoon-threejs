import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';
import { initUniverse } from "./universe";
import { initSolarSystem, solarSystem} from "./solarsystem";
import { Planet } from "./planet";
import { createStarField } from "./starfield";
import {calculateAngleBetweenOrbiters} from './calculateAngleBetweenOrbiters'
import {Ship} from './Ship'

/**
 * BOILER PLATE
 */
// GUI
const gui = new GUI();
const guiDomElement = gui.domElement;
guiDomElement.style.position = 'absolute';
guiDomElement.style.top = '0px';
guiDomElement.style.left = '0px';
guiDomElement.style.removeProperty('right');


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
const planetsFolder = gui.addFolder("Planets").close()
planetsFolder.add({addPlanet: () => addPlanetHandler()}, "addPlanet").name("Add Planet")
initUniverse(gui, scene, renderer, camera)
initSolarSystem(gui, scene, renderer, camera)



/**
 * INITIALIZE GAME STUFF
 */

// planets & moons 
const dynPlanets = []
const planet1 = new Planet({a: 12, omega: 270, trailLength: 1000, mass: 200000, size: 2, drawCone: true, solarSystem, planetColor: 0x0000ff})
const moon1 = new Planet({a: 4, orbitalParent: planet1, trailLength: 0, trailColor: 0x0000ff, i: 20,size: 0.5, planetColor: 0xb09278})

const planet2 = new Planet({a: 35, i: 5, trailLength: 2000, mass: 1000000, size: 3, drawCone: true, planetColor: 0x6e138f})
const moon2 = new Planet({a: 5, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.5})
const moon3 = new Planet({a: 8, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.6, planetColor: 0x754e00})
const moon4 = new Planet({a: 10, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 90, size: 0.3, planetColor: 0xff7700})


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

// Create 10000 stars within a spread of 2000 units
const stars = createStarField(4500, 2000, 300);

// Add the star field to the scene
scene.add(stars);

// A list of all the ships currently in the world
const ships = []

document.addEventListener('keydown', (event) => {
    if (event && event.key !== ' ' && event.code !== 'Space') {
        return
    }

    launchShip({from: planet2, to: planet1, speed: 0.002})
})

function launchShip({from, to, speed}) {

    console.log("Launching ship!")

    const newShip = new Ship({from, to, speed})
    ships.push(newShip)
    solarSystem.add(newShip.shipObject)
    solarSystem.add(newShip.shipTrailLine)
}

// Define the global variable to track cooldown state
let cooledDown = true;

function startCooldown(duration) {
    if (cooledDown) {
        cooledDown = false; // Mark as in cooldown
        
        console.log("Cooldown started.");

        setTimeout(() => {
            cooledDown = true; // Reset back to cooled down after duration
            console.log("Cooldown complete. Ready again.");
        }, duration * 1000); // Convert duration from seconds to milliseconds
    } else {
        console.log("Cooldown already in progress.");
    }
}

/**
 * ANIMATION LOOP
 */

let pT = 0;                     // Timestamp of previous frame, previousTime

function animate(time = 0) {    // default to 0, otherwise time is undefined on the very first frame
    requestAnimationFrame(animate);
    const dT = (time - pT);     // calculate deltaTime in milliseconds, dT
    pT = time;                  // Update lastTime for the next frame  


    // update plantes
    dynPlanets.forEach((p) => {
        p.updatePlanetPosition(dT)
        p.drawPlanetTrail()
        //p.drawLineToParent()
    })

    // update ships
    ships.forEach(s => {
        s.geometry.computeBoundingSphere();
        s.updateShipPosition(dT)
        s.drawShipTrail()
        if (s.checkJourneyComplete()) {
            console.log(`Journey took ${s.elapsedTime / 1000} seconds `);
            solarSystem.remove(s.shipObject);
            solarSystem.remove(s.shipTrailLine);
            s.removeFromWorld = true
        }
    })

    // remove ships from scene
    for (let i = ships.length - 1; i >= 0; i--) {
        if (ships[i].removeFromWorld) {
            ships.splice(i, 1);
        }
    }

    // auto ship launcher from planet1 to planet 2
    const angle = calculateAngleBetweenOrbiters(dynPlanets[0], dynPlanets[1])
    if (angle < 100 && angle > 40 && cooledDown) {
       // console.log(angle)
        launchShip({from: planet1, to: planet2, speed: 0.002})
        startCooldown(3)
    }




    

    controls.update();
    renderer.render(scene, camera);
}

animate();


