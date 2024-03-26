/**
 * The Universe
 * 
 * Oh if all universes were this simple =)
 * 
 */
import * as THREE from "three";
import { universeGrid } from "./universeGrid";

// X = red
// Y = green
// Z = blue
const axesHelper = new THREE.AxesHelper( 15 );
axesHelper.position.set(0,0,0)

export const universeProperties = {
    showGrid: false,
    showAxes: false,
    //G: 6.67430e-11 // Gravitational constant
    G: 6.67430e-11  // increasing G is a hacky way to speed up all planetary motion
}

export function initUniverse(gui, scene, renderer, camera) {



    universeProperties.showGrid ? scene.add(universeGrid): null;
    universeProperties.showAxes ? scene.add(axesHelper): null;

    const universeFolder = gui.addFolder( 'Universe' ).close();

    universeFolder.add(universeProperties, 'showGrid').name("Show Grid").onChange(v => {
        universeProperties.showGrid = v
    
        if (v === true) {
            scene.add( universeGrid );
        } else {
            scene.remove( universeGrid );
        }
    
        renderer.render(scene, camera);
    })
    
    universeFolder.add(universeProperties, 'showGrid').name("Show Grid").onChange(v => {
        universeProperties.showAxes = v
    
        if (v === true) {
            scene.add( axesHelper );
        } else {
            scene.remove( axesHelper );
        }
    
        renderer.render(scene, camera);
    })

    universeFolder.add(universeProperties, 'G').name("Gravitational constant G").onChange(v => {
        universeProperties.G = v
        renderer.render(scene, camera);
    })
}


