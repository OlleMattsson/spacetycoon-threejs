/**
 * The Universe
 * 
 * Oh if all universes were this simple =)
 * 
 */

import { universeGrid } from "./universeGrid";

export const universeProperties = {
    showGrid: false,
    G: 6.67430e-11 // Gravitational constant
}

export function initUniverse(gui, scene, renderer, camera) {

    universeProperties.showGrid ? scene.add(universeGrid): null;

    const universeFolder = gui.addFolder( 'Universe' );

    universeFolder.add(universeProperties, 'showGrid').onChange(v => {
        universeProperties.showGrid = v
    
        if (v === true) {
            scene.add( universeGrid );
        } else {
            scene.remove( universeGrid );
        }
    
        renderer.render(scene, camera);
    })

    universeFolder.add(universeProperties, 'G').onChange(v => {
        universeProperties.G = v
        renderer.render(scene, camera);
    })
}


