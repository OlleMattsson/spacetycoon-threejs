/**
 * The Universe
 * 
 * Oh if all universes were this simple =)
 * 
 */

import { universeGrid } from "./universeGrid";

export const universeProperties = {
    showGrid: true,
    //G: 6.67430e-11 // Gravitational constant
    G: 6.67430e-7 // increasing G is a hacky way to speed up all planetary motion
}

export function initUniverse(gui, scene, renderer, camera) {

    universeProperties.showGrid ? scene.add(universeGrid): null;

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

    universeFolder.add(universeProperties, 'G').name("Gravitational constant G").onChange(v => {
        universeProperties.G = v
        renderer.render(scene, camera);
    })
}


