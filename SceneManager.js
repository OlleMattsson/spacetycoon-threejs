import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import CameraControls from 'camera-controls';
import GUI from 'lil-gui';

CameraControls.install( { THREE: THREE } );

export class SceneManager {
    gui
    scene
    camera
    renderer
    camera
    raycaster
    composer
    focus
    cameraMaxDistance

    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({antialias: true, physicallyCorrectLights: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.raycaster = new THREE.Raycaster();
        this.composer = new EffectComposer(this.renderer);
        this.focus = null
        this.cameraMaxDistance = 100
        this.cameraMinDistance = 20

        // Camera 
        this.mainCamera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,1,1000);
        this.mainCamera.position.x = 20;
        this.mainCamera.position.y = 20;
        this.mainCamera.position.z = 40;

        // debug camera
        this.debugCamera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,1,1000);
        this.cameraGeometry = new THREE.SphereGeometry(1, 32, 32);
        this.cameraMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.cameraMesh = new THREE.Mesh(this.cameraGeometry, this.cameraMaterial);   

        // camera currently being used for rendering
        this.renderCamera = this.mainCamera 

        // Basic render pass, ie render everything in the scene
        const renderPass = new RenderPass(this.scene, this.renderCamera);

        // Add and configure the outline render pass
        this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.renderCamera);
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
        this.controls = new CameraControls(this.renderCamera, this.renderer.domElement);
        this.controls.setOrbitPoint(0, 0, 0); // Set the look at point to the center of the star
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;
        this.controls.maxDistance = 100
        this.controls.minDistance = 1

        // track camera control
        this.lastZoom = this.controls.distance; // Track the last zoom level
        this.lastAzimuthAngle = this.controls.azimuthAngle; // Track the last azimuth angle
        this.lastPolarAngle = this.controls.polarAngle; // Track the last polar angle
        this.lastDistance = 10

        // init lil-gui
        this.gui = new GUI();

        // set gui position
        const guiDomElement = this.gui.domElement;
        guiDomElement.style.position = 'absolute';
        guiDomElement.style.top = '0px';
        guiDomElement.style.left = '0px';
        guiDomElement.style.removeProperty('right');
  
        // events
        this.isDragging = false;
        this.mouseIsDown = false
        this.isScrolling = false
        this.isScrollingTimeout = 100; // time in ms to turn of scroll event
        this.scrolldeltaY = 0
        let startX = 0;
        let startY = 0;
        const threshold = 5; // Movement threshold to differentiate between click and drag

        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            // If using an effects composer, update its size as well
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        document.addEventListener('dblclick', (event) => this.onDoubleClick(event));
        
        document.addEventListener('mousedown', (event) => {
            // Store the starting point
            startX = event.pageX;
            startY = event.pageY;
            this.isDragging = false;
            this.mouseIsDown = true;


        });
        
        document.addEventListener('mousemove', (event) => {
            this.isDragging = false

            if (this.mouseIsDown){
                if (Math.abs(startX - event.pageX) > threshold || Math.abs(startY - event.pageY) > threshold) {
                    this.isDragging = true;
                }
            }
        });        

        document.addEventListener('mouseup', (event) => {
            if (this.isDragging) {

                this.dragHandler()


                // handle dragging
                //console.log('mouseUp: isDragging');
                //this.cameraRotation = this.camera.rotation
                //this.cameraPosition = this.camera.position

                //console.log("new camera position y:", this.camera.position.y)


            } else {
                console.log('mouseup: click');
                this.onClickHandler(event)

            }
            // Reset dragging state
            this.isDragging = false;
            this.mouseIsDown = false
        });     
        
        let scrollTimeout = null;
        document.addEventListener('wheel', (event) => {
            this.isScrolling = true
            this.scrolldeltaY = event.deltaY

            // Clear the previous timeout, if any
            if (scrollTimeout !== null) {
                clearTimeout(scrollTimeout);
            }

            // set isScrolling to false after a timeout
            scrollTimeout = setTimeout(() => {
                this.isScrolling = false
            }, this.isScrollingTimeout); 

        }); 
    }    

    getSelected(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = - (event.clientY / window.innerHeight) * 2 + 1;   
        const mouse = new THREE.Vector2(mouseX, mouseY)

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(mouse, this.renderCamera);

        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children); // sorted list of intersects

        // the first elmenet of intersects is also nearest to camera
        if (intersects.length) {
            const selected = intersects[0]
            return selected.object.userData.planet
        }

        return null
    }

    onClickHandler(event) {
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
        const selected = this.getSelected(event)

        if (selected) {
            this.focus = selected
        } else {
            this.focus = null  
        }

        this.togglePlanetaryCamera()
    }

    dragHandler() {
        // a planet is in focus, camera should be centered on it
        if(this.focus !== null) {
            console.log(`${this.focus.properties.name} is in focus`)



        }

    }

    togglePlanetaryCamera() {
        if (this.focus) {
            const planetPosition = this.focus.planetMesh.position

            //this.camera.position.x += planetPosition.x + this.cameraPosition?.x
            //this.camera.position.z += planetPosition.z + this.cameraPosition?.z
            //this.camera.position.y += planetPosition.y + this.cameraPosition?.y

            //this.controls.target.copy(planetPosition)
            //this.controls.update();     
            //this.camera.lookAt(this.focus)
            //this.camera.updateProjectionMatrix();
        } else {

        }
    }

    updateFocusedCamera() {

        if (!this.focus) return;

        const {x,y,z} = this.focus.planetMesh.position
        this.controls.setTarget(x, y, z, true);

        if (!this.isScrolling) {
            this.controls.dollyTo(this.lastDistance, true)
        } else {
            this.lastDistance = this.controls.distance
        }

        if (!this.isDragging) {
            this.controls.rotateAzimuthTo( this.lastAzimuthAngle, true );
            this.controls.rotatePolarTo( this.lastPolarAngle, true );               
        } else {
            this.lastAzimuthAngle = this.controls.azimuthAngle; // Track the last azimuth angle
            this.lastPolarAngle = this.controls.polarAngle; // Track the last polar angle
        }
    }
}