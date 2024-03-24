import * as THREE from "three";
import shiftNPush from "./shiftNPush";


export class Ship {

    constructor({from, to}) {

        this.from = from
        this.to = to

        // placeholder ship object
        this.geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.shipObject = new THREE.Mesh(this.geometry, material);




        // ship trail
        const shipTrailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff, // Change the color as needed
        });

        this.shipTrailGeo = new THREE.BufferGeometry();
        this.shipTrailMaxPoints = 200; // adjust length of orbital path trail
        this.shipTrailPositions = new Float32Array(this.shipTrailMaxPoints * 3); // Each point requires x, y, z coordinates
        this.shipTrailGeo.setAttribute("position", new THREE.BufferAttribute(this.shipTrailPositions, 3));
        this.shipTrailPointIndex = 0; // Keep track of the last point added to the orbit path
        this.shipTrailLine = new THREE.Line(this.shipTrailGeo, shipTrailMaterial);

        // ship journey
        this.elapsedTime = 0
        this.journeyFraction
        this.from   // planet1
        this.to     // planet2
        this.start
        this.end
        this.removeFromWorld = false


        // line that displays ship's current path
        /*
        const geometry1 = new THREE.BufferGeometry()
        const material1 = new THREE.LineBasicMaterial({color: 0xff0000});  
        const linePos = new Float32Array(2*3) // we need two points with three coordinates each
        geometry1.setAttribute(
            'position', 
            new THREE.BufferAttribute(linePos, 3)
        )
        const line = new THREE.Line(geometry1, material1)
        */
    }

    updateShipPosition(dT) {
        // update end point of ship
        //end = new THREE.Vector3(p2pPos[3], p2pPos[4], p2pPos[5])    

        this.elapsedTime += dT;

        let end = this.to.planetMesh.position
        let start = this.from.planetMesh.position

        const speed = 0.002; // Units per second
        const distance = start.distanceTo(end);
        const travelTime = distance / speed;

        // Calculate the fraction of the journey completed
        this.journeyFraction = (this.elapsedTime % travelTime) / travelTime;

        // Update object position
        this.shipObject.position.lerpVectors(start, end, this.journeyFraction);   
    }

    checkJourneyComplete() {
        // Update the boundingSphere centers based on current world positions
        const center1 = this.shipObject.geometry.boundingSphere.center.clone().add(this.shipObject.position);
        const center2 = this.to.planetMesh.geometry.boundingSphere.center.clone().add(this.to.planetMesh.position);
                
        //const distance2 = planet2Mesh.geometry.boundingSphere.center.distanceTo(shipObject.geometry.boundingSphere.center);
        const distance2 = center1.distanceTo(center2);
        //console.log(center1, center2, distance2)

        const sumOfRadii = this.to.planetMesh.geometry.boundingSphere.radius + this.shipObject.geometry.boundingSphere.radius;

        if (distance2 < sumOfRadii) {
            return true

        } else { 
            return false
        }
    }

    drawShipTrail() {
   
        // ship
         if (this.shipTrailPointIndex < this.shipTrailMaxPoints) {
             this.shipTrailPositions[this.shipTrailPointIndex * 3] = this.shipObject.position.x;
             this.shipTrailPositions[this.shipTrailPointIndex * 3 + 1] = this.shipObject.position.y;
             this.shipTrailPositions[this.shipTrailPointIndex * 3 + 2] = this.shipObject.position.z;
             this.shipTrailGeo.attributes.position.needsUpdate = true; // Important, indicates the geometry needs to be re-rendered
             this.shipTrailPointIndex++;
             this.shipTrailGeo.setDrawRange(1, this.shipTrailPointIndex -1); // Only draw the part of the geometry that has been updated
         } else {
             shiftNPush(this.shipObject.position.x, this.shipTrailPositions, this.shipTrailMaxPoints * 3)
             shiftNPush(this.shipObject.position.y, this.shipTrailPositions, this.shipTrailMaxPoints * 3)
             shiftNPush(this.shipObject.position.z, this.shipTrailPositions, this.shipTrailMaxPoints * 3)
             this.shipTrailGeo.attributes.position.needsUpdate = true;
             this.shipTrailGeo.setDrawRange(0, this.shipTrailMaxPoints); // Only draw the part of the geometry that has been updated        
         }
     }    
}