import * as THREE from "three";

export function drawPlanetToPlanetLine(planet1, planet2) {
    p2pPos[0] = planet1.X
    p2pPos[1] = planet1.Y
    p2pPos[2] = planet1.Z
    p2pPos[3] = planet2.X
    p2pPos[4] = planet2.Y
    p2pPos[5] = planet2.Z
    shipLineGeometry.attributes.position.needsUpdate = true;
}

const shipLineMaterial = new THREE.LineBasicMaterial({
    color: 0xff00ff, 
});
const shipLineGeometry = new THREE.BufferGeometry()

export const p2pPos = new Float32Array(2*3) // we need two points with three coordinates each

shipLineGeometry.setAttribute(
    'position', 
    new THREE.BufferAttribute(p2pPos, 3)
)

export const shipLine = new THREE.Line(shipLineGeometry, shipLineMaterial)


