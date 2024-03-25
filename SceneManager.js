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
    focus

    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.raycaster = new THREE.Raycaster();
        this.composer = new EffectComposer(this.renderer);
        this.focus = null

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
        this.controls.enableDamping = true;
        this.controls.dampingFactor =0.05
        this.controls.maxDistance = 100
        this.controls.minDistance = 1
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
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        const threshold = 5; // Movement threshold to differentiate between click and drag


        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

        document.addEventListener('dblclick', (event) => this.onDoubleClick(event));


        
        document.addEventListener('mousedown', function(event) {
            // Store the starting point
            startX = event.pageX;
            startY = event.pageY;
            isDragging = false;
        });
        
        document.addEventListener('mousemove', function(event) {
            // Check if the mouse has moved more than the threshold
            if (Math.abs(startX - event.pageX) > threshold || Math.abs(startY - event.pageY) > threshold) {
                isDragging = true;
            }
        });        

        document.addEventListener('mouseup', (event) => {
            if (isDragging) {
                // handle dragging
            } else {
                console.log('Click detected');
                this.onClick(event)

            }
            // Reset dragging state
            isDragging = false;
        });        

    }

    getSelected(event) {
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
            return selected.object.userData.planet
        }

        return null
    }

    onClick(event) {
        const selected = this.getSelected(event)

        if (selected) {
            console.log(selected.properties.name)
            this.outlinePass.selectedObjects = [selected.planetMesh];
            this.composer.render(this.scene, this.camera);                
        } else {
            this.outlinePass.selectedObjects = [];
            this.composer.render(this.scene, this.camera);                   
        }

    }    

    onDoubleClick(event) {
        console.log("double click")
        const selected = this.getSelected(event)

        if (selected) {
            this.focus = selected
        } else {
            console.log("clicked nothing")
            this.focus = null
                   
        }



    }

    updateCameraPosition() {
       
        if(this.focus !== null) {

            const planetPosition = this.focus.planetMesh.position
   
            /*
            this.camera.position.x = planetPosition.x - 10
            this.camera.position.y = planetPosition.y +10
            this.camera.position.z = planetPosition.z - 10
            */
            this.camera.lookAt(planetPosition); // Set the look at point to the center of the            
            
            this.controls.target.copy(planetPosition);
            this.controls.maxDistance = 10
            this.controls.minDistance = 10
            
            this.controls.update();     
             
        } else {
            this.controls.maxDistance = 100
            this.controls.update();     
        }
    }
}