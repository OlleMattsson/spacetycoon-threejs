import * as THREE from "three";
import { initUniverse } from "./universe";
import { initSolarSystem, solarSystem} from "./solarsystem";
import { Planet } from "./planet";
import { createStarField } from "./starfield";
import {Ship} from './Ship'
import { SceneManager } from "./SceneManager";

const {MathUtils: {radToDeg}, Clock} = THREE

const clock = new Clock();
const sm = new SceneManager()
const {gui, camera, scene, composer} = sm
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

// first planetary system
const olmia = new Planet({texturePath: './bitmaps/2k_earth_daymap.jpg', a: 20, omega: 270, e: 0, i: 0, trailLength: 1000, mass: 200000, size: 2, solarSystem, planetColor: 0x0000ff, name: "Olmia"})
const moon1 = new Planet({texturePath: './bitmaps/2k_moon.jpg', a: 4, orbitalParent: olmia, trailLength: 0, trailColor: 0xffffff, i: 20,size: 0.5, planetColor: 0xb09278, name: "Aave"})

// second planetary system
const pandora = new Planet({texturePath: './bitmaps/2k_neptune.jpg',a: 40, i: 0, e: 0, trailLength: 2000, mass: 1000000, size: 3, planetColor: 0x6e138f, name: "Pandora"})
const titan = new Planet({a: 5, orbitalParent: pandora, trailLength: 0, trailColor: 0xffffff, i: 0, size: 0.5, name: "Titan"})
const perseus = new Planet({a: 8, orbitalParent: pandora, trailLength: 0, trailColor: 0xffffff, i: 10, size: 0.6, planetColor: 0x754e00, name: "Perseus"})
const styx = new Planet({a: 10, orbitalParent: pandora, trailLength: 0, trailColor: 0xffffff, i: 80, size: 0.3, planetColor: 0xff7700, name: "Styx"})

dynPlanets.push(olmia, pandora, moon1,  titan, perseus, styx)
//dynPlanets.push(olmia, pandora, moon1)

// add all planetary assets to scene
dynPlanets.forEach(p => {
    p.initPlanetUI(planetsFolder, scene, camera, composer)
    solarSystem.add(p.planetMesh)
    solarSystem.add(p.trailLine)
    solarSystem.add(p.parentLine)
    solarSystem.add(p.orbitLine)
    //solarSystem.add(p.transferLine)
    solarSystem.add(p.ghostPlanetMesh)
})

function addPlanetHandler() {
    const newPlanet = new Planet({})
    newPlanet.initPlanetUI(planetsFolder, scene, camera, composer)
    dynPlanets.push(newPlanet)
    solarSystem.add(newPlanet.planetMesh)
    solarSystem.add(newPlanet.trailLine)
    solarSystem.add(p.orbitLine)
}
   
scene.add(solarSystem);
//scene.add(sm.cameraMesh) // debug camera mesh

// Create 10000 stars within a spread of 2000 units
const stars = createStarField(4500, 2000, 300);

// Add the star field to the scene
scene.add(stars);

// A list of all the ships currently in the world
const ships = []
const hohmannShips = []

document.addEventListener('keydown', (event) => {
    if (event && event.key !== ' ' && event.code !== 'Space') {
        return
    }

    //launchShip({from: planet2, to: planet1, speed: 0.002})
    launchShipHohmann({departure: olmia, destination: pandora}) 
})

function launchShip({from, to, speed}) {

    //console.log("Launching ship!")

    const newShip = new Ship({from, to, speed})
    ships.push(newShip)
    solarSystem.add(newShip.shipObject)
    solarSystem.add(newShip.shipTrailLine)
}

function launchShipHohmann({departure, destination}) {
    // calculate orbit
    const transferOrbit = departure.calculateHohmannTransferOrbit(departure.orbit, destination.orbit, 5)

    const {a, e, i, omega, w} = transferOrbit
    const newShip = new Planet({a, e, i, omega, w, trailColor: 0x0000ff, planetColor: 0x00ff00, size: 0.3, trailLength: 1000, orbitalParent: departure.orbitalParent}) // with orbital elements

    console.log("launch, ETA:", transferOrbit.transferTime / 1000)
    console.log("dV:", transferOrbit.totalDeltaV / 1000)

    hohmannShips.push(newShip)
    solarSystem.add(newShip.planetMesh)
    //solarSystem.add(newShip.trailLine )
    //solarSystem.add(newShip.orbitLine )
}

// Define the global variable to track cooldown state
let cooledDown = true;

function startCooldown(duration) {
    if (cooledDown) {
        // cooldown started
        cooledDown = false; 
        

        setTimeout(() => {
            // cooldown complete
            cooledDown = true; 
        }, duration * 1000); 
    } else {
        // handle cooldown already in progress
    }
}

setInterval(updateSimulation, 1000); // Update game state every second
function updateSimulation() {
    //console.log("simulation tick")
}

/**
 * ANIMATION LOOP
 */
function animate() {

    const delta = clock.getDelta();  
    const dT = delta * 1000 // delta in secods for some code

    sm.updateFocusedCamera()


    sm.cameraMesh.position.copy(sm.mainCamera.position) // update the camera mesh for the debug view

    // update planets
    dynPlanets.forEach((p, i) => {
        p.updatePlanetPosition(dT)
        p.drawOrbit()
        //p.drawLineToParent()
        //p.drawPlanetTrail()

        // example update transfer intersections and predictions
        // the idea works but logic is hardcoded

        if (p.properties.name === "Olmia") {

            const destinationPlanet = pandora

            // draw transfer orbit from planet1 to planet2
            const transferOrbit = p.drawTransferOrbit(destinationPlanet)

            const orbitIntersection = p.findOrbitIntersections({
                a1: transferOrbit.a,
                e1: transferOrbit.e,
                a2: destinationPlanet.orbit.a,
                M1: p.orbit.M
            })
                    
            if (orbitIntersection)    {
                const correctionDegrees = 0 // the intersection preiction is a few degrees of for some reason
                const intersectionPosition = p.getPlanetPositionFromMeanAnomalyAndElements({
                    meanAnomalyDegrees: radToDeg(orbitIntersection ) + correctionDegrees,
                    ...transferOrbit
                })


                p.ghostPlanetMesh.position.copy(intersectionPosition)

                // calculate transfer time
                const transferTime = p.calculateTravelTimeToMeanAnomaly(transferOrbit.a, orbitIntersection)
    
                // draw target planet at T = transferOrbit.transferTime
                destinationPlanet.updateGhostPlanetPosition(dT + transferTime)            
            }


        }

    })

    // hohmann ships
    hohmannShips.forEach(s =>  {
        s.planetMesh.geometry.computeBoundingSphere();
        s.updatePlanetPosition(dT)
        s.drawPlanetTrail()        
        s.drawOrbit()    
        
        if (s.checkJourneyComplete({from: olmia, to: pandora })) {
            console.log(`Journey took ${s.elapsedTime / 1000} seconds `);
            solarSystem.remove(s.planetMesh);
            solarSystem.remove(s.trailLine);
            solarSystem.remove(s.orbitLine);
            s.removeFromWorld = true
        }        
    })

    /*
    // update ships
    ships.forEach(s => {

        s.geometry.computeBoundingSphere();
        s.updateShipPosition(dT)
        s.drawShipTrail()

        // mark ship for removal from scene if the journey has been completed
        if (s.checkJourneyComplete()) {
            //console.log(`Journey took ${s.elapsedTime / 1000} seconds `);
            solarSystem.remove(s.shipObject);
            solarSystem.remove(s.shipTrailLine);
            s.removeFromWorld = true
        }
    })
    */

    // remove ships from scene
    for (let i = hohmannShips.length - 1; i >= 0; i--) {
        if (hohmannShips[i].removeFromWorld) {
            hohmannShips.splice(i, 1);
        }
    }

    // game mechanics

    // auto ship launcher from planet1 to planet 2
    /*
    const angle = calculateAngleBetweenOrbiters(dynPlanets[0], dynPlanets[1])
    if (angle < 85 && angle > 75 && cooledDown) {
        console.log(angle)
        //launchShip({from: planet1, to: planet2, speed: 0.002})
        launchShipHohmann()
        startCooldown(3)
    }
    */
    

    sm.controls.update( delta );
    composer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

