import { universeGrid } from "./universeGrid";

export const universeControls = {
    showGrid: true
}

export function initUniverse(gui, scene, renderer, camera) {

    universeControls.showGrid ? scene.add(universeGrid): null;

    const universeFolder = gui.addFolder( 'Universe' );

    universeFolder.add(universeControls, 'showGrid').onChange(v => {
        universeControls.showGrid = v
    
        if (v === true) {
            scene.add( universeGrid );
        } else {
            scene.remove( universeGrid );
        }
    
        renderer.render(scene, camera);
    })
}


