import * as THREE from "three";
import {solarSystemProperties} from './solarsystem'
import { universeProperties } from './universe';
import shiftNPush from "./shiftNPush";
import {deg2Rad} from './helpers'

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
    parent // parent body of orbit
    size 



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
        solarSystem = null // group
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
        this.orbitalParent = orbitalParent
        this.drawCone = drawCone
        this.solarSystem = solarSystem

        this.properties = {
            i, // inclination in degrees
            a, // Semi-major axis in meters 
            e, // eccentricity 0 = circular, 0 < e < 1 =  elliptic, 1 = parabolic, e > 1 hyperbolic
            M, // Mean Anomaly in radians, 
            omega, // Longitude of the Ascending Node in degrees
            w,  // Argument of Periapsis in degrees
            trailLength,
            size
        }

        // planet mesh
        this.planetGeometry = new THREE.SphereGeometry(this.properties.size, 32, 32);
        this.planetMaterial = new THREE.MeshLambertMaterial({ color: this.planetColor });
        this.planetMesh = new THREE.Mesh(this.planetGeometry, this.planetMaterial);   

        // planet trail
        this.trailGeometry = new THREE.BufferGeometry();        
        this.trailMaterial = new THREE.LineBasicMaterial({ color: this.trailColor });
        this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.trailPositions = new Float32Array(this.properties.trailLength * 3); // Each point requires x, y, z coordinates
        this.pointIndex = 0; // Keep track of the last point added to the orbit path
        this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3));

        // line to parent
        const parentLineMaterial = new THREE.LineBasicMaterial({
            color: 0xff00ff, 
        });
        this.parentLineGeometry = new THREE.BufferGeometry()
        
        this.orbiter2PlanetPositions = new Float32Array(2*3) // we need two points with three coordinates each
        
        this.parentLineGeometry.setAttribute(
            'position', 
            new THREE.BufferAttribute(this.orbiter2PlanetPositions, 3)
        )
        
        this.parentLine = new THREE.Line(this.parentLineGeometry, parentLineMaterial)
        
        

        // launch window cone
        /*
        if (this.drawCone) {
            const coneGeometry = new THREE.ConeGeometry(
                5,      // base radius
                40,      // height
                16);    // segments
            const coneMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true});
            this.cone = new THREE.Mesh(coneGeometry, coneMaterial);
        }
        */

        /*
        if (this.solarSystem !== null) {
            this.solarSystem.add(this.cone)
        }
        */



    }

    initPlanetUI(parentFolder, scene, camera, renderer) {
        const planetFolder = parentFolder.addFolder("Planet1").close()
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
        let mu

        if (this.orbitalParent === null) { // parent is sun
            mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)
        } else {
            mu = universeProperties.G * this.orbitalParent.mass
        }



        
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

        // set the the position of the planet mesh
        // Z and Y positions are switched so that orbits are mapped to the X,Z plane 
        // which lays flat instead of teh XY plane which is vertical 
        this.planetMesh.position.set(
            X + parentX, 
            Z + parentY,
            -(Y - parentZ), // flip sign to change direction of rotation
        );     
       /*
        if (this.drawCone) {
            // Calculate the offset position for the cone by adding a small angle to the true anomaly
            
            let offsetAngle = deg2Rad(20); // This is an arbitrary small angle; adjust as needed
            let nuOffset = nu + offsetAngle; // Add the offset to the true anomaly

            // Recalculate r because it can change with nu for elliptical orbits
            let rOffset = a * (1 - e * Math.cos(E)); // You might not need this if your orbits are circular
            let xC = rOffset * Math.cos(nuOffset);
            let yC = rOffset * Math.sin(nuOffset)

            // Apply rotation transformations
            // First, rotate by w (argument of periapsis) in the orbital plane
            let xwC = xC * Math.cos(_w) - yC * Math.sin(_w);
            let ywC = xC * Math.sin(_w) + yC * Math.cos(_w);     
            
            // Then, apply inclination (i) rotation
            let xiC = xwC;
            let yiC = ywC * Math.cos(_i);
            let ziC = ywC * Math.sin(_i);        
                
            // Finally, rotate by omega (longitude of ascending node)
            let xOffset = xiC * Math.cos(_omega) - yiC * Math.sin(_omega);
            let yOffset = xiC * Math.sin(_omega) + yiC * Math.cos(_omega);
            let zOffset = ziC; // Z-coordinate after inclination applied            


            // Recalculate the position with the offset true anomaly
            //let xOffset = rOffset * Math.cos(nuOffset) * Math.cos(_omega) - rOffset * Math.sin(nuOffset) * Math.sin(_omega);
            //let yOffset = rOffset * Math.cos(nuOffset) * Math.sin(_omega) + rOffset * Math.sin(nuOffset) * Math.cos(_omega);
            //let zOffset = rOffset * Math.sin(nuOffset) * Math.sin(_i);


            // Apply the parent's position to the offset position for the cone
            this.cone.position.set(
                xOffset + parentX, 
                zOffset + parentZ,
                -(yOffset + parentY), 
            );

            const planetWorldPosition = new THREE.Vector3()
            this.planetMesh.getWorldPosition(planetWorldPosition)
            this.cone.lookAt(planetWorldPosition)
            this.cone.rotateX(deg2Rad(90))
            
        }
        */
    }
    
}



