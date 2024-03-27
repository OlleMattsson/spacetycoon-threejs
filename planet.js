import * as THREE from "three";
import {solarSystemProperties} from './solarsystem'
import { universeProperties } from './universe';
import shiftNPush from "./shiftNPush";
import {deg2Rad, rad2Deg} from './helpers'

export class Planet {
    mass 
    n       // mean motion
    planetColor
    planetGeometry
    planetMaterial
    planetMesh
    trailColor
    trailLength // number of points in trail, increase for longer trail
    trailMaterial
    trailGeometry
    trailPositions // an arry of points with coordinates: [p1x, p1y, p1z, p2x, p2y, p2z... pNx, pNy, pNz]
    trailLine
    pointIndex // keep track of the
    properties
    parent // parent body of orbit
    size
    name
    texturePath

    constructor({
        mass = 1000, 
        a = 15, 
        e = 0,
        i = 0, 
        omega = 0, 
        w = 0, 
        M = 0, 
        planetColor = 0xffffff, 
        trailColor = 0xffffff,
        trailLength = 500, 
        orbitalParent = null,
        size = 1,
        drawCone = false,
        solarSystem = null, // group
        name = "",
        texturePath = null
    }){
        this.mass = mass
        this.planetColor = planetColor
        this.trailColor = trailColor
        this.orbitalParent = orbitalParent
        this.drawCone = drawCone
        this.solarSystem = solarSystem

        this.properties = {
            // Keplerian motion
            i, // inclination in degrees
            a, // Semi-major axis in meters 
            e, // eccentricity 0 = circular, 0 < e < 1 =  elliptic, 1 = parabolic, e > 1 hyperbolic
            M, // Mean Anomaly in radians, 
            omega, // Longitude of the Ascending Node in degrees
            w,  // Argument of Periapsis in degrees



            trailLength,
            size,
            name
        }

        this.lastPosition = new THREE.Vector3()

        const loader = new THREE.TextureLoader();
        let planetTexture
        if (texturePath) {
            console.log(texturePath)
            planetTexture = loader.load(texturePath);
            this.planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
        } else {
            this.planetMaterial = new THREE.MeshLambertMaterial({ color: this.planetColor });
        }



        // planet mesh
        this.planetGeometry = new THREE.SphereGeometry(this.properties.size, 32, 32);
        this.planetMesh = new THREE.Mesh(this.planetGeometry, this.planetMaterial);   
        this.planetMesh.userData.planet = this; // Store a reference to the instance

        // ghost planet used to display orbitPredictions
        this.ghostPlanetGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        this.ghostPlanetMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        this.ghostPlanetMesh = new THREE.Mesh(this.ghostPlanetGeometry, this.ghostPlanetMaterial);   
        this.ghostPlanetMesh.userData.planet = this; // Store a reference to the instance


        // planet trail
        this.trailGeometry = new THREE.BufferGeometry();        
        this.trailMaterial = new THREE.LineBasicMaterial({ color: this.trailColor});
        this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.trailPositions = new Float32Array(this.properties.trailLength * 3); // Each point requires x, y, z coordinates
        this.pointIndex = 0; // Keep track of the last point added to the orbit path
        this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3));

        // line to parent
        const parentLineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff});
        this.parentLineGeometry = new THREE.BufferGeometry()
        this.orbiter2PlanetPositions = new Float32Array(2*3) // we need two points with three coordinates each
        this.parentLineGeometry.setAttribute('position', new THREE.BufferAttribute(this.orbiter2PlanetPositions, 3))
        this.parentLine = new THREE.Line(this.parentLineGeometry, parentLineMaterial)

        // orbit line
        this.orbitGeometry = new THREE.BufferGeometry();        
        this.orbitMaterial = new THREE.LineBasicMaterial({ color: this.trailColor });
        this.orbitLine = new THREE.Line(this.orbitGeometry, this.orbitMaterial);
        this.orbitPositions = new Float32Array(360 * 3); // Each point requires x, y, z coordinates
        this.pointIndex = 0; // Keep track of the last point added to the orbit path
        this.orbitGeometry.setAttribute("position", new THREE.BufferAttribute(this.orbitPositions, 3));        

        // hohmann transfer line
        this.transferGeometry = new THREE.BufferGeometry();        
        this.transferMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        this.transferLine = new THREE.Line(this.transferGeometry, this.transferMaterial);
        this.transferPositions = new Float32Array(360 * 3); // Each point requires x, y, z coordinates
        this.transferPointIndex = 0; // Keep track of the last point added to the transfer path
        this.transferGeometry.setAttribute("position", new THREE.BufferAttribute(this.transferPositions, 3));        
    }

    initPlanetUI(parentFolder, scene, camera, renderer) {
        const planetFolder = parentFolder.addFolder(this.properties.name).close()
        const {properties} = this

        planetFolder.add(properties, "name")
            .name("Name")
            .onChange(v =>{
                this.properties.name = v
                renderer.render(scene, camera)
            })

        planetFolder.add(properties, "i", -90, 90, 1)
            .name("Inclination")
            .onChange(v =>{
                this.properties.i = v
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "a")
            .name("Semi-major axis")
            .onChange(v =>{
                this.properties.a = v
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "e", 0, 0.99, 0.1)
            .name("Eccentricity")
            .onChange(v =>{
                this.properties.e = v
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "omega", 0, 360, 1)
            .name("Lng Ascending")
            .onChange(v =>{
                this.properties.omega = v
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "w", 0, 180, 1)
            .name("Arg Periapsis (rad)")
            .onChange(v =>{
                this.properties.w = v
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "trailLength", 0, 1000, 100)
            .name("Trail Length")
            .onChange(v =>{
                this.properties.trailLength = v
                this.trailPositions = new Float32Array(this.properties.trailLength * 3);
                this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3)); 
                this.pointIndex = 0;
                renderer.render(scene, camera)
            })
        planetFolder.add(properties, "size", 1, 10, 1)
            .name("Trail Length")
            .onChange(v =>{
                this.properties.size = v
                renderer.render(scene, camera)
            })

    }

    drawPlanetTrail() {

        const {pointIndex, planetMesh} = this
        const {trailLength} = this.properties

        // draw the first points until there is space in the buffer
        if (pointIndex < trailLength) { // store position if there is still space in the array
            this.trailPositions[pointIndex * 3] = planetMesh.position.x;       // store the position of the planet
            this.trailPositions[pointIndex * 3 + 1] = planetMesh.position.y;
            this.trailPositions[pointIndex * 3 + 2] = planetMesh.position.z;
            this.trailGeometry.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
            this.pointIndex++;
            this.trailGeometry.setDrawRange(0, pointIndex); 
        } else {
        
        // once the buffer is full, start shifting out oldest points number and pushing in newest 
            shiftNPush(planetMesh.position.x, this.trailPositions)
            shiftNPush(planetMesh.position.y, this.trailPositions)
            shiftNPush(planetMesh.position.z, this.trailPositions)
    
            this.trailGeometry.attributes.position.needsUpdate = true;
            this.trailGeometry.setDrawRange(0, trailLength); // Only draw the part of the geometry that has been updated        
        }        
    }

    drawOrbit() {
        for (let i = 0; i <= this.orbitPositions.length / 3; i++) {
            const position = this.getPlanetPositionFromTrueAnomaly(i)
            this.orbitPositions[i * 3] = position.x;       
            this.orbitPositions[i * 3 + 1] = position.y;
            this.orbitPositions[i * 3 + 2] = position.z;
            this.orbitGeometry.attributes.position.needsUpdate = true;       
        }
    }

    drawTransferOrbit(toPlanet) {
        
        const transferOrbit = this.calculateHohmannTransferOrbit(this.properties, toPlanet.properties, 5)

        //console.log(transferOrbit.transferOrbit)

        // draw the transfer orbit by stepping through its true anomaly one degree at a time
        // calculate the position at each step, store xyz coordinates and give them to the transferLine geomentry
        for (let deg = 0; deg <= this.transferPositions.length / 3; deg++) {
            const position = this.getPlanetPositionFromMeanAnomalyAndElements({
                ...transferOrbit, 
                meanAnomalyDegrees: deg,
                orbitalParentPosition: this.orbitalParent?.planetMesh.position || new THREE.Vector3(0,0,0)               
            })

            this.transferPositions[deg * 3] = position.x;       
            this.transferPositions[deg * 3 + 1] = position.y;
            this.transferPositions[deg * 3 + 2] = position.z;
            this.transferGeometry.attributes.position.needsUpdate = true;       
        }

        return transferOrbit

    }

    solveKeplersEquation(M, e, iterations = 5) {
        let E = M; // Initial guess for E
        for (let i = 0; i < iterations; i++) {
            E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        }
        return E; // E is the eccentric anomaly
    }
    
    trueAnomalyFromEccentricAnomaly(E, e) {
        return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    }
    
    findOrbitIntersections(a1, e1, a2, M1) {
        // Convert mean anomaly M1 to true anomaly for the inner orbit
        const E1 = this.solveKeplersEquation(M1, e1);
        const theta1Initial = this.trueAnomalyFromEccentricAnomaly(E1, e1);
    
        // Continue with the previous approach
        const r2 = a2; // Radius of circular orbit is constant
        const r1 = (theta) => a1 * (1 - e1 ** 2) / (1 + e1 * Math.cos(theta)); // Function to calculate r1
    
        let theta1Solution = [];
        for (let theta1 = theta1Initial - Math.PI; theta1 < theta1Initial + Math.PI; theta1 += 0.01) {
            if (Math.abs(r1(theta1) - r2) < 0.1) {
                theta1Solution.push(theta1);
            }
        }
    
        return theta1Solution.map(theta1 => {
            // Convert back to mean anomaly for output, simplified here as directly using theta1
            // For a precise model, you'd convert true anomaly back to mean anomaly
            return { meanAnomaly1: theta1, trueAnomaly1: theta1, trueAnomaly2: theta1 };
        });
    }


    calculateTransferOrbitAndLaunchWindow(departureOrbit, targetOrbit) {
        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        }   
    
        // Calculate the current distance (semi-major axis) of both planets from the Sun
        let r_departure = departureOrbit.a * (1 - departureOrbit.e * Math.cos(departureOrbit.M * Math.PI / 180));
        let r_target = targetOrbit.a * (1 - targetOrbit.e * Math.cos(targetOrbit.M * Math.PI / 180));
    
        // Estimate the semi-major axis of the transfer orbit
        let a_transfer = (r_departure + r_target) / 2;

        const transferTime = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);

        // Adjust omega (Ω) for the transfer orbit to align with the current position of the departing orbiter
        // This is conceptual; in practice, you might adjust omega based on the departure angle or other criteria
        const adjustedOmega = departureOrbit.omega + rad2Deg(departureOrbit.M);
        const omega_transfer = adjustedOmega; // Longitude of ascending node

        // Simplified approach to calculate transfer orbit eccentricity (conceptual, for visual representation)
        let e_transfer = Math.abs(r_departure - r_target) / (r_departure + r_target);
    
        // Calculate the orbital period of the transfer orbit
        let T_transfer = 2 * Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);
    
        // Estimating the launch window (simplified, assumes linear motion of target planet)
        let n_target = Math.sqrt(mu / Math.pow(targetOrbit.a, 3)); // Mean motion of the target orbit
        let futureM_target = (targetOrbit.M + n_target * T_transfer / 2) % 360;
    
        return {
            transferTime,
            transferOrbit: {
                a: a_transfer,
                e: e_transfer,
                i: targetOrbit.i, // Assuming we match the target's inclination at departure
                omega: departureOrbit.omega, // For simplicity, assume same as departure planet
                //omega: omega_transfer, 
                w: departureOrbit.w, // Also assuming same as departure planet for simplicity
                M: departureOrbit.M // Initial mean anomaly for the transfer orbit
            },
            launchWindow: {
                departureMeanAnomaly: departureOrbit.M,
                targetFutureMeanAnomaly: futureM_target
            }
        };
    }    

    drawLineToParent() {
        this.orbiter2PlanetPositions[0] = this.planetMesh.position.x
        this.orbiter2PlanetPositions[1] = this.planetMesh.position.y
        this.orbiter2PlanetPositions[2] = this.planetMesh.position.z
        this.orbiter2PlanetPositions[3] = this.orbitalParent?.planetMesh.position.x || 0
        this.orbiter2PlanetPositions[4] = this.orbitalParent?.planetMesh.position.y || 0
        this.orbiter2PlanetPositions[5] = this.orbitalParent?.planetMesh.position.z || 0
        this.parentLineGeometry.attributes.position.needsUpdate = true;       
    }

    getProperties() {
        return {
            mass: this.mass,
            a: this.a,
            e: this.e
        }
    }

    updatePlanetPosition(deltaTime) {

        const position = this.getPlanetPosition(deltaTime)
        //this.lastPosition = position;
        // set the the position of the planet mesh
        // Z and Y positions are switched so that orbits are mapped to the X,Z plane 
        // which lays flat instead of teh XY plane which is vertical 
        this.planetMesh.position.copy(position)

    }

    updateGhostPlanetPosition(deltaTime) {
        //console.log(deltaTime)
        const position = this.getPlanetPosition(deltaTime, false)
        this.ghostPlanetMesh.position.copy(position)
    }

    // get planet position at deltaTime 
    getPlanetPosition(deltaTime, setMeanAnomaly = true) {
        const {i, e, a, omega, w} = this.properties

        // convert elements in degrees to radians
        const _i = (i) * Math.PI / 180
        const _omega = omega * Math.PI / 180
        const _w = w * Math.PI / 180

        // Standard Gravitational parameter 
        // We only need the mass of the central body
        // The mass of the satellite is negligable in comparison to the mass of the central body
        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        }
       
        // Calculate the mean motion (n) - the rate at which the mean anomaly increases
        const n = Math.sqrt(mu / Math.pow(a, 3));

        // update mean anomaly
        const M = this.properties.M + n * deltaTime

        // set the mean anomaly for main planet
        // for the ghost planet we only want to use M for calculations but not set it
        if (setMeanAnomaly) {
            this.properties.M = M
        }
         
        const E = this.eccentricAnomalyFromMeanAnomaly(M, e)

        const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); // True anomaly, approximate

        // Calculate position in the orbit plane
        let r = a * (1 - e * Math.cos(E)); // Distance from the central body
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);

        // Apply rotation transformations
        // First, rotate by w (argument of periapsis) in the orbital plane
        let xw = x * Math.cos(_w) - y * Math.sin(_w);
        let yw = x * Math.sin(_w) + y * Math.cos(_w);

        // Then, apply inclination (i) rotation
        let xi = xw;
        let yi = yw * Math.cos(_i);
        let zi = yw * Math.sin(_i);

        // Finally, rotate by omega (longitude of ascending node)
        let X = xi * Math.cos(_omega) - yi * Math.sin(_omega);
        let Y = xi * Math.sin(_omega) + yi * Math.cos(_omega);
        let Z = zi; // Z-coordinate after inclination applied
              
        // if planet has a parent translate to parent coordinates
        const parentX = this.orbitalParent?.planetMesh.position.x || 0
        const parentY = this.orbitalParent?.planetMesh.position.y || 0
        const parentZ = this.orbitalParent?.planetMesh.position.z || 0
        
        return new THREE.Vector3(
            X + parentX, 
            Z + parentY,
            -(Y - parentZ), // flip sign to change direction of rotation for our coordinate system where XZ is the floor and Y is up
        )
    }

    getPlanetPositionFromTrueAnomaly(nuDegrees) {
        const {i, e, a, omega, w} = this.properties;
    
        // Convert elements and true anomaly in degrees to radians
        const _i = i * Math.PI / 180; // No subtraction by 90; direct conversion
        const _omega = omega * Math.PI / 180;
        const _w = w * Math.PI / 180;
        const nu = nuDegrees * Math.PI / 180; // Convert true anomaly from degrees to radians
        let E = this.properties.M + e * Math.sin(this.properties.M); // Eccentric anomaly, approximate

    
        // Calculate position in the orbit plane using given true anomaly nu
        const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);
    
        // Apply rotation transformations
        // First, rotate by w (argument of periapsis) in the orbital plane
        let xw = x * Math.cos(_w) - y * Math.sin(_w);
        let yw = x * Math.sin(_w) + y * Math.cos(_w);
    
        // Then, apply inclination (i) rotation
        let xi = xw;
        let yi = yw * Math.cos(_i);
        let zi = yw * Math.sin(_i);
    
        // Finally, rotate by omega (longitude of ascending node)
        let X = xi * Math.cos(_omega) - yi * Math.sin(_omega);
        let Y = xi * Math.sin(_omega) + yi * Math.cos(_omega);
        let Z = zi;
    
        // If planet has a parent, translate to parent coordinates
        const parentX = this.orbitalParent?.planetMesh.position.x || 0;
        const parentY = this.orbitalParent?.planetMesh.position.y || 0;
        const parentZ = this.orbitalParent?.planetMesh.position.z || 0;
    
        return new THREE.Vector3(
            X + parentX,
            Z + parentY, // Assume Z is up, swap Y and Z to match common 3D conventions
            -(Y - parentZ) // flip sign to change direction of rotation, if needed based on your coordinate system
        );
    } 

    getPlanetPositionFromMeanAnomaly(meanAnomalyDegrees) {
        const {i, e, a, omega, w} = this.properties;
    
        // Convert elements and mean anomaly in degrees to radians
        const _i = i * Math.PI / 180;
        const _omega = omega * Math.PI / 180;
        const _w = w * Math.PI / 180;
        const M = meanAnomalyDegrees * Math.PI / 180; // Convert mean anomaly from degrees to radians
    
        // Simplified conversion from mean anomaly to eccentric anomaly (E)
        let E = M + e * Math.sin(M); // Iterate for a better approximation if necessary
    
        // Conversion from eccentric anomaly to true anomaly (ν)
        let nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    
        // Calculate position in the orbit plane
        let r = a * (1 - e * Math.cos(E)); // Distance from the central body
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);
    
        // Apply rotation transformations
        // First, rotate by w (argument of periapsis) in the orbital plane
        let xw = x * Math.cos(_w) - y * Math.sin(_w);
        let yw = x * Math.sin(_w) + y * Math.cos(_w);
    
        // Then, apply inclination (i) rotation
        let xi = xw;
        let yi = yw * Math.cos(_i);
        let zi = yw * Math.sin(_i);
    
        // Finally, rotate by omega (longitude of ascending node)
        let X = xi * Math.cos(_omega) - yi * Math.sin(_omega);
        let Y = xi * Math.sin(_omega) + yi * Math.cos(_omega);
        let Z = zi;
    
        // if planet has a parent translate to parent coordinates
        const parentX = this.orbitalParent?.planetMesh.position.x || 0;
        const parentY = this.orbitalParent?.planetMesh.position.y || 0;
        const parentZ = this.orbitalParent?.planetMesh.position.z || 0;
        
        return new THREE.Vector3(
            X + parentX, 
            Z + parentY, // Assuming Z is up, adjust if your setup differs
            -(Y - parentZ) // flip sign to change direction of rotation, if necessary
        );
    }    
    
    // increase aAdditional to lift he apoapsis
    calculateHohmannTransferOrbit(orbit1, orbit2, aAdditional = 0) {

        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        }

        const calculateNewEccentricity = (a, e, aNew) => {
            // Calculate the periapsis distance with the original semi-major axis and eccentricity
            const rp = a * (1 - e);
            
            // Calculate the new eccentricity needed to keep the periapsis distance the same with the new semi-major axis
            const eNew = 1 - (rp / aNew);
            
            return eNew;
          }

        //const nu_departure = nu; // True anomaly at departure
           
        // Semi-major axis of the transfer orbit
        const a_transfer = (orbit1.a + orbit2.a) / 2;

        // Eccentricity of the transfer orbit
        const e_transfer = (orbit2.a - orbit1.a) / (orbit1.a + orbit2.a);

        const aNew = a_transfer + aAdditional
        const eNew = calculateNewEccentricity(orbit1.a, orbit1.e, aNew)

        
        // Inclination 
        // const i_transfer = orbit1.i; // Assuming the transfer occurs in the same plane
        const i_transfer = Math.abs(orbit2.i - orbit1.i); // Absolute change in inclination


        // Adjust omega (Ω) for the transfer orbit to align with the current position of the departing orbiter
        // This is conceptual; in practice, you might adjust omega based on the departure angle or other criteria
        const adjustedOmega = orbit1.omega + rad2Deg(orbit1.M);

        const omega_transfer = adjustedOmega; // Longitude of ascending node
    
        // Argument of periapsis and true anomaly at departure
        const w_transfer = 0; // Assuming departure from periapsis

        // Velocity calculations (same as before)
        const v1 = Math.sqrt(mu / orbit1.a);
        const v2 = Math.sqrt(mu / orbit2.a);
        const v_transfer1 = Math.sqrt(mu * ((2 / orbit1.a) - (1 / a_transfer)));
        const v_transfer2 = Math.sqrt(mu * ((2 / orbit2.a) - (1 / a_transfer)));
    
        const deltaV1 = v_transfer1 - v1;
        const deltaV2 = v2 - v_transfer2;
        const totalDeltaV_Hohmann = Math.abs(deltaV1) + Math.abs(deltaV2);

        // Additional delta-V for inclination change, at the intersection node
        const deltaV_inclination = Math.sqrt(v2*v2 + v_transfer2*v_transfer2 - 2*v2*v_transfer2*Math.cos(i_transfer));

        // Total delta-V including the inclination change
        const totalDeltaV = totalDeltaV_Hohmann + deltaV_inclination;        
    
        // Transfer time calculation (same as before)
        const transferTime = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);

        return {
            a: aNew, //a_transfer,
            e: eNew, //e_transfer,
            i: i_transfer,
            omega: omega_transfer,
            w: w_transfer,
            deltaV1,
            deltaV2,
            totalDeltaV,
            transferTime
        };
    }  
    
    calculateInclinedTransferOrbitAtDeparture(orbit1, orbit2) {
        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        }    


        // Semi-major axis of the transfer orbit
        const a_transfer = (orbit1.a + orbit2.a) / 2

        // Eccentricity of the transfer orbit
        const e_transfer = Math.abs(orbit2.a - orbit1.a) / (orbit1.a + orbit2.a)
        // Transfer time for the elliptical orbit
        const transferTime = (Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu))

        // Predict future position of planet 2
        const meanMotionPlanet2 = Math.sqrt(mu / Math.pow(orbit2.a, 3));
        const futureMeanAnomalyPlanet2 = (orbit2.M + rad2Deg(meanMotionPlanet2 * transferTime)) % 360;        
    

        // Adjust omega (Ω) for the transfer orbit to align with the current position of the departing orbiter
        // This is conceptual; in practice, you might adjust omega based on the departure angle or other criteria
        const adjustedOmega = orbit1.omega + rad2Deg(orbit1.M);
        const omega_transfer = adjustedOmega; // Longitude of ascending node
    
        // Velocities in the initial and target orbits
        const v1 = Math.sqrt(mu / orbit1.a); 
        const v2 = Math.sqrt(mu / orbit2.a); 
    
        // Velocities at periapsis and apoapsis of the transfer orbit
        const v_transfer1 = Math.sqrt(mu * ((2 / orbit1.a) - (1 / a_transfer)));
        const v_transfer2 = Math.sqrt(mu * ((2 / orbit2.a) - (1 / a_transfer)));
    
        // Delta-v for the Hohmann transfer (ignoring inclination)
        const deltaV1 = Math.abs(v_transfer1 - v1); 
        const deltaV2 = Math.abs(v2 - v_transfer2); 
    
        // Calculate change in inclination (in radians for calculations)
        const deltaI = Math.abs(orbit2.i - orbit1.i) * Math.PI / 180; 

        // Inclination change delta-v, approximated for change at periapsis
        // This simplification assumes direct vector addition, which overestimates efficiency
        const deltaV_inclination = v_transfer1 * Math.sin(deltaI); 
    
        // Total delta-v, summing Hohmann transfer and inclination change components
        const totalDeltaV = deltaV1 + deltaV_inclination + deltaV2; 
    
        // Omega and argument of periapsis might not change realistically in a game context,
        // but you could adjust them if you have specific gameplay mechanics in mind
        const w_transfer = 0; // Departure from periapsis, for simplicity          
    
        const transferOrbit = {
            a: a_transfer,
            e: e_transfer,
            i: orbit2.i, // Final inclination
            deltaV1: deltaV1 + deltaV_inclination, // Adding inclination change delta-v to initial burn
            deltaV2,
            deltaV_inclination,
            totalDeltaV,
            transferTime,
            futureMeanAnomalyPlanet2,
            // Note: omega and w are based on initial orbit; complex maneuvers might adjust these
            omega: omega_transfer,
            w: w_transfer,
        };

        return transferOrbit
    }

    // useful for drawing a known orbit by stepping through the mean anomaly in degrees
    // could be a static function since it does not depend on this
    getPlanetPositionFromMeanAnomalyAndElements({meanAnomalyDegrees, i, e, a, omega, w, orbitalParentPosition = new THREE.Vector3(0, 0, 0)}) {
                
        // Convert orbital elements and mean anomaly from degrees to radians        
        const _i = i * Math.PI / 180;
        const _omega = omega * Math.PI / 180;
        const _w = w * Math.PI / 180;
        const M = meanAnomalyDegrees * Math.PI / 180; // Convert mean anomaly from degrees to radians
   
        // Simplified conversion from mean anomaly to eccentric anomaly (E)
        let E = M + e * Math.sin(M); // Iterate for a better approximation if necessary
        //let E = this.eccentricAnomalyFromMeanAnomaly(M, e)
    
        // Conversion from eccentric anomaly to true anomaly (ν)
        let nu = this.trueAnomalyFromEccentricAnomaly(E, e)
    
        // Calculate position in the orbit plane
        let r = a * (1 - e * Math.cos(E)); // Distance from the central body
        
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);
    
        // Apply rotation transformations
        let xw = x * Math.cos(_w) - y * Math.sin(_w);
        let yw = x * Math.sin(_w) + y * Math.cos(_w);
    
        let xi = xw;
        let yi = yw * Math.cos(_i);
        let zi = yw * Math.sin(_i);
    
        let X = xi * Math.cos(_omega) - yi * Math.sin(_omega);
        let Y = xi * Math.sin(_omega) + yi * Math.cos(_omega);
        let Z = zi;

    
        // Translate to parent coordinates if necessary
        return new THREE.Vector3(
            X + orbitalParentPosition.x, 
            Z + orbitalParentPosition.y, // Assuming Z is up, adjust if your setup differs
            -(Y - orbitalParentPosition.z) // flip sign to change direction of rotation, if necessary
        );
    }  
    
    checkJourneyComplete({from, to}) {
        // Update the boundingSphere centers based on current world positions
        const center1 = this.planetMesh.geometry.boundingSphere.center.clone().add(this.planetMesh.position);
        const center2 = to.planetMesh.geometry.boundingSphere.center.clone().add(to.planetMesh.position);
                
        //const distance2 = planet2Mesh.geometry.boundingSphere.center.distanceTo(shipObject.geometry.boundingSphere.center);
        const distance2 = center1.distanceTo(center2);
        //console.log(center1, center2, distance2)

        const sumOfRadii = to.planetMesh.geometry.boundingSphere.radius + this.planetMesh.geometry.boundingSphere.radius;

        if (distance2 < sumOfRadii) {
            return true

        } else { 
            return false
        }
    }

    eccentricAnomalyFromMeanAnomaly(M, e, maxIter = 50) {
        let E = M; // Initial guess
        let delta = 0.00000001; // Convergence criteria
        let iter = 0;
        while (iter < maxIter) {
            let E_next = E + (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));

            if (Math.abs(E_next - E) < delta) break;

            E = E_next;
            iter++;
        }
        return E;
    }
    
    trueAnomalyFromEccentricAnomaly(E, e) {
        return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    }

    trueAnomalyToEccentricAnomaly(theta, e) {
        return 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(theta / 2));
    }

    eccentricAnomalyToMeanAnomaly(E, e) {
        return E - e * Math.sin(E);
    }
    
    findOrbitIntersections({a1, e1, a2, M1}) {
        // Convert mean anomaly M1 to true anomaly for the inner orbit
        const E1 = this.eccentricAnomalyFromMeanAnomaly(M1, e1);
        //const E1 = M1+ e1 * Math.sin(M1);
        const theta1Initial = this.trueAnomalyFromEccentricAnomaly(E1, e1);

    
        // Continue with the previous approach
        const r2 = a2; // Radius of circular orbit is constant
        const r1 = (theta) => a1 * (1 - e1 ** 2) / (1 + e1 * Math.cos(theta)); // Function to calculate r1
        
        const stepSize = 0.001
        const tolerance = 0.01
    
        let theta1Solution = [];
        for (let theta1 = theta1Initial - Math.PI; theta1 < theta1Initial + Math.PI; theta1 += stepSize) {
            if (Math.abs(r1(theta1) - r2) < tolerance) {
                theta1Solution.push(theta1);
            }
        } 

        for (let theta of theta1Solution) {
            // console.log(theta)
            // Convert true anomaly to eccentric anomaly
            const E1 = this.trueAnomalyToEccentricAnomaly(theta, e1);

            // Then convert eccentric anomaly to mean anomaly
            const M1 = this.eccentricAnomalyToMeanAnomaly(E1, e1);

            if (M1 > 0) {
                return M1
                return { meanAnomaly1: M1, trueAnomaly1: theta, trueAnomaly2: theta1 };
            }
             
        }
    
        // we produce two solutions 
        const solutions = theta1Solution.map(theta1 => {

            // Convert true anomaly to eccentric anomaly
            const E1 = this.trueAnomalyToEccentricAnomaly(theta1, e1);

            // Then convert eccentric anomaly to mean anomaly
            const M1 = this.eccentricAnomalyToMeanAnomaly(E1, e1);

            if (M1 > 0) {
                return { meanAnomaly1: M1, trueAnomaly1: theta1, trueAnomaly2: theta1 };
            }
 
        })

        /*
        solutions.sort((a, b) => a.meanAnomaly1 - b.meanAnomaly1); // Sort by mean anomaly

        if (solutions && solutions.length && solutions[0].meanAnomaly1 > 0) {
            //console.log(solutions[0].meanAnomaly1)
            return solutions[0].meanAnomaly1
        }*/
    }

    calculateTravelTimeToMeanAnomaly(a, M) {

        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        } 

        // Calculate the mean motion
        const n = Math.sqrt(mu / (a ** 3));
        
        // Calculate the time to reach the given mean anomaly
        const t = M / n;
        
        return t; // Time in seconds
    }

}



