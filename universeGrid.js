import * as THREE from "three";

/* 
    UNIVERSE GRID 

    This is a reference grid that lies flat across the universe, the solar system incliation
    is in reference to the universe grid

*/

// Grid properties
const size = 200;
const divisions = size / 10;
const gridColor = 0x707070;
const centerLineColor = 0x303030; // Can be the same or different

export const universeGrid = new THREE.GridHelper(size, divisions, gridColor, centerLineColor);
