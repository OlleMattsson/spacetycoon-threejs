import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

import GUI from 'lil-gui';

export class SceneManager {
    gui
    scene
    camera
    renderer
    camera
    raycaster
    composer

    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.raycaster = new THREE.Raycaster();
        this.composer = new EffectComposer(this.renderer);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.x = 20;
        this.camera.position.y = 20;
        this.camera.position.z = 40;

        // Basic render pass, ie render everything in the scene
        const renderPass = new RenderPass(this.scene, this.camera);

        // Add and configure the outline render pass
        this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        this.outlinePass.edgeStrength = 3;
        this.outlinePass.edgeGlow = 0.5;
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.visibleEdgeColor.set('#ffffff');
        this.outlinePass.hiddenEdgeColor.set('#190a05');

        // add passes the the render pipeline
        this.composer.addPass(renderPass);
        this.composer.addPass(this.outlinePass);

        // add renderer to DOM
        document.body.appendChild(this.renderer.domElement);




        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0); // Set the look at point to the center of the star
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;
        this.controls.update(); // Must be called after any manual changes to the camera's transform

        // init lil-gui
        this.gui = new GUI();

        // set gui position
        const guiDomElement = this.gui.domElement;
        guiDomElement.style.position = 'absolute';
        guiDomElement.style.top = '0px';
        guiDomElement.style.left = '0px';
        guiDomElement.style.removeProperty('right');
  

        // events

        this.clickTimeout = null;
        this.clickDelay = 200; // Delay in milliseconds


        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

        // handle mouse clock
        window.addEventListener('click', (event) => this.onMouseClick(event)); // fat arrow ensures this binds to onMouseClick

        document.addEventListener('dblclick', function(event) {
            clearTimeout(this.clickTimeout); // Prevent the pending click action
            this.clickTimeout = null;
            console.log('Double-click detected!');
            event.preventDefault();
            event.stopPropagation();
        });

    }

    onMouseClick(event) {


        if (this.clickTimeout !== null) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
            // Don't execute click action, as we're considering this as part of a dblclick.
            return;
        }
    
        this.clickTimeout = setTimeout(() => {
            console.log('Click event action');
            this.clickTimeout = null;
        }, this.clickDelay);        


        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = - (event.clientY / window.innerHeight) * 2 + 1;   
        const mouse = new THREE.Vector2(mouseX, mouseY)

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(mouse, this.camera);
    
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length) {
            const selected = intersects[0]
            const {planet} = selected.object.userData
            console.log(planet.properties.name)
            console.log(planet.planetMesh.position)

            this.camera.lookAt(planet.planetMesh.position); // Set the look at point to the center of the    
            this.controls.target.copy(planet.planetMesh.position);
            this.controls.update();

            this.outlinePass.selectedObjects = [planet.planetMesh];

            this.composer.render(this.scene, this.camera);
        }

    
        /*
        for (let i = 0; i < intersects.length; i++) {
            // Example: Change color of the intersected object
            intersects[i].object.material.color.set(0xff0000);
        }
        */
    }    
}