import * as THREE from "three";

// returns a signed number between -180 and 180
export function calculateAngleBetweenOrbiters(orbiter1, orbiter2) {

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

    // Use the cross product to determine the sign of the angle
    let crossProduct = new THREE.Vector3().crossVectors(directionVector1, directionVector2);
    // Assuming Y axis as the normal to the orbital plane
    let sign = Math.sign(crossProduct.y);    

    // Adjust the angle based on the sign
    angleRadians *= sign;

    let angleDegrees = angleRadians * (180 / Math.PI);

    return angleDegrees

}