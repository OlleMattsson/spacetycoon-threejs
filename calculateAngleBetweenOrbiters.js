import * as THREE from "three";

export function calculateAngleBetweenOrbiters(orbiter1, orbiter2) {
    // Assuming line1 and line2 are THREE.Line objects and share a common start point

    let startPoint

    if (orbiter1.orbitalParent !== null) {
        startPoint = new THREE.Vector3(orbiter1.orbitalParent.position); // Common start point of both lines
    } else {
        startPoint = new THREE.Vector3(0,0,0)
    }
    let endPoint1 = orbiter1.planetMesh.position; // End point of line1 :Vector3
    let endPoint2 = orbiter2.planetMesh.position; // End point of line2 :Vector3

    // Calculate direction vectors
    let directionVector1 = endPoint1.clone().sub(startPoint).normalize();
    let directionVector2 = endPoint2.clone().sub(startPoint).normalize();

    let angleRadians = Math.acos(directionVector1.dot(directionVector2));

    let angleDegrees = angleRadians * (180 / Math.PI);

    return angleDegrees
    //console.log(angleDegrees)

}