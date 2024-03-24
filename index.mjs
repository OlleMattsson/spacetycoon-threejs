import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';
import { initUniverse } from "./universe";
import { initSolarSystem, solarSystem} from "./solarsystem";
import { Planet } from "./planet";
import { createStarField } from "./starfield";
import {calculateAngleBetweenOrbiters} from './calculateAngleBetweenOrbiters'
import {Ship} from './Ship'
import { SceneManager } from "./SceneManager";

const sm = new SceneManager()

const {gui, renderer, camera, scene, controls, composer} = sm


/**
 * INITIALIZE GAME STUFF
 */

// init assets & gui elements
const planetsFolder = gui.addFolder("Planets").close()
planetsFolder.add({addPlanet: () => addPlanetHandler()}, "addPlanet").name("Add Planet")
initUniverse(gui, scene, composer, camera)
initSolarSystem(gui, scene, composer, camera)

// planets & moons 
const dynPlanets = []
const planet1 = new Planet({a: 12, omega: 270, trailLength: 1000, mass: 200000, size: 2, drawCone: true, solarSystem, planetColor: 0x0000ff, name: "Olmia"})
const moon1 = new Planet({a: 4, orbitalParent: planet1, trailLength: 0, trailColor: 0x0000ff, i: 20,size: 0.5, planetColor: 0xb09278, name: "Aave"})

const planet2 = new Planet({a: 35, i: 5, trailLength: 2000, mass: 1000000, size: 3, drawCone: true, planetColor: 0x6e138f, name: "Pandora"})
const moon2 = new Planet({a: 5, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.5, name: "Titan"})
const moon3 = new Planet({a: 8, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 10, size: 0.6, planetColor: 0x754e00, name: "Perseus"})
const moon4 = new Planet({a: 10, orbitalParent: planet2, trailLength: 0, trailColor: 0x0000ff, i: 90, size: 0.3, planetColor: 0xff7700, name: "Styx"})


dynPlanets.push(planet1, planet2, moon1,  moon2, moon3, moon4)

dynPlanets.forEach(p => {
    p.initPlanetUI(planetsFolder, scene, camera, composer)
    solarSystem.add(p.planetMesh)
    solarSystem.add(p.trailLine)
    //solarSystem.add(p.cone)
    solarSystem.add(p.parentLine)
})

function addPlanetHandler() {
    const newPlanet = new Planet({})
    newPlanet.initPlanetUI(planetsFolder, scene, camera, composer)
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

setInterval(updateSimulation, 1000); // Update game state every second
function updateSimulation() {
    //console.log("simulation tick")
}

/**
 * ANIMATION LOOP
 */

let pT = 0;                     // Timestamp of previous frame, previousTime
function animate(time = 0) {    // default to 0, otherwise time is undefined on the very first frame
    const dT = (time - pT);     // calculate deltaTime in milliseconds, dT
    pT = time;                  // Update lastTime for the next frame  

    // update planets
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

        // mark ship for removal from scene if the journey has been completed
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

    // game mechanics

    // auto ship launcher from planet1 to planet 2
    const angle = calculateAngleBetweenOrbiters(dynPlanets[0], dynPlanets[1])
    if (angle < 100 && angle > 40 && cooledDown) {
       // console.log(angle)
        launchShip({from: planet1, to: planet2, speed: 0.002})
        startCooldown(3)
    }

    controls.update();
    composer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

