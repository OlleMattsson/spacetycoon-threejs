import * as THREE from "three";
import {solarSystemProperties} from './solarsystem'
import { universeProperties } from './universe';
import shiftNPush from "./shiftNPush";

export class Planet {
    
    // The Six Elements of Kepler's 
    a       
    e       
    i       
    omega   
    w      
    M       

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
    }){
        this.mass = mass
        this.a = a
        this.e = e
        this.i = i
        this.omega = omega * Math.PI / 180
        this.w = w * Math.PI / 180
        this.M = M * Math.PI / 180
        this.planetColor = planetColor
        this.trailColor = trailColor
        //this.trailLength = trailLength;

        this.properties = {
            i, // inclination in degrees
            a, // Semi-major axis in meters 
            e, // eccentricity 0 = circular, 0 < e < 1 =  elliptic, 1 = parabolic, e > 1 hyperbolic
            M, // Mean Anomaly in radians, 
            omega, // Longitude of the Ascending Node in degrees
            w,  // Argument of Periapsis in degrees
            trailLength
        }

        // planet mesh
        this.planetGeometry = new THREE.SphereGeometry(1, 32, 32);
        this.planetMaterial = new THREE.MeshLambertMaterial({ color: this.planetColor });
        this.planetMesh = new THREE.Mesh(this.planetGeometry, this.planetMaterial);   

        // planet trail
        this.trailGeometry = new THREE.BufferGeometry();        
        this.trailMaterial = new THREE.LineBasicMaterial({ color: this.trailColor });
        this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.trailPositions = new Float32Array(this.properties.trailLength * 3); // Each point requires x, y, z coordinates
        this.pointIndex = 0; // Keep track of the last point added to the orbit path
        this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3));
        

    }

    initPlanetUI(parentFolder, scene, camera, renderer) {
        const planetFolder = parentFolder.addFolder("Planet1")
        const {properties} = this

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

    getProperties() {
        return {
            mass: this.mass,
            a: this.a,
            e: this.e
        }
    }
/*
    this.properties = {
        i, // inclination in degrees
        a, // Semi-major axis in meters 
        e, // eccentricity 0 = circular, 0 < e < 1 =  elliptic, 1 = parabolic, e > 1 hyperbolic
        M, // Mean Anomaly in radians, 

        // mucking around with these values imho produce the incorrect outcome

        // omega seems to in fact affect the argument of periapses
        omega, // Longitude of the Ascending Node in degrees

        // increasing w seems to make the orbit more eccentric
        w,  // Argument of Periapsis in degrees
    }
*/
    updatePlanetPosition(deltaTime) {

        const {i, e, a, omega, w} = this.properties

        // convert elements in degrees to radians
        const _i = (i) * Math.PI / 180 // subtracting 90 so that inclination of 0 degrees is an orbit around the equator
        const _omega = omega * Math.PI / 180
        const _w = w * Math.PI / 180


        // Standard Gravitational parameter 
        // We only need the mass of the central body
        // The mass of the satellite is negligable in comparison to the mass of the central body
        const mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)

        // Calculate the mean motion (n) - the rate at which the mean anomaly increases
        const n = Math.sqrt(mu / Math.pow(a, 3));

        // update mean anomaly
        this.properties.M += n * deltaTime; 

        // Simplified conversion from mean anomaly to true anomaly (ν)
        // This is a very rough approximation for small eccentricities
        let E = this.properties.M + e * Math.sin(this.properties.M); // Eccentric anomaly, approximate
        //let E = M + e * Math.sin(M); // Eccentric anomaly, approximate
        let nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); // True anomaly, approximate

        // Calculate position in the orbit plane
        let r = a * (1 - e * Math.cos(E)); // Distance from the central body
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);

        /*
        // Convert to 3D coordinates
        const X = x * (Math.cos(_omega) * Math.cos(_omega) - Math.sin(_omega) * Math.sin(_w) * Math.cos(_i)) + 
                y * (-Math.cos(_omega) * Math.sin(_w) - Math.sin(_omega) * Math.cos(_w) * Math.cos(_i));

        const Y = x * (Math.sin(_omega) * Math.cos(_w) + Math.cos(_omega) * Math.sin(_w) * Math.cos(_i)) + 
                y * (-Math.sin(_omega) * Math.sin(_w) + Math.cos(_omega) * Math.cos(_w) * Math.cos(_i));

        const Z = x * (Math.sin(_w) * Math.sin(_i)) + y * (Math.cos(_w) * Math.sin(_i));
*/

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

        // set the the position of the planet mesh
        this.planetMesh.position.set(X, Y, Z);

    }
    
}



