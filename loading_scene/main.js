import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OBJLoader } from 'OBJLoader';
import { FBXLoader } from 'FBXLoader';
import GUI from 'lil-gui';

let scene, camera, renderer, model, person;
let animatedPerson, idlePerson, animationMixer, runningMixer, runningAction, walkingAction, breathingAction;
let clock, raycaster, groundMesh;
const treeMeshes = []; // for collision detection
const moveSpeed = 0.07;
const moveDirection = { forward: false, backward: false, left: false, right: false };
let previousMouseX = window.innerWidth / 2, zoomLevel = 1.0, isMoving = false, isRunning= false;
let lastGroundHeight = -49.17; // starting ground height
const minZoomLevel = 0.5; // minzoom level (closer)
const maxZoomLevel = 1.3; // max zoom level (further)

function init() {
    clock = new THREE.Clock(); //track time

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); //FOV, aspect ratio, near, far
    camera.position.set(0, 10, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); //low intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(ambientLight, directionalLight);

    // Load the environment model
    new GLTFLoader().load('../environment/object/scene.glb', (gltf) => {
        model = gltf.scene;
        scene.add(model);

        // // Debug function for the details of each object
        // function logObjectDetails(object) {
        //     console.log('Name:', object.name);
        //     if (object.material) {
        //         console.log('Material name:', object.material.name);
        //     }
        //     if (object.children.length > 0) {
        //         object.children.forEach(child => logObjectDetails(child));
        //     }
        // }

        // Traverse through all children of the model to find specific meshes
        model.traverse((child) => {
            // logObjectDetails(child);
            if (child.isMesh) {
                // Identify ground mesh
                if (child.name === 'Landscape' || child.material.name === 'Material.001') {
                    //console.log('Ground Mesh Identified:', child);
                    groundMesh = child;

                    // Traverse children of Landscape to identify specific meshes
                    if (child.children && child.children.length > 0) {
                        child.children.forEach((childMesh) => {
                            if (childMesh.isMesh) {
                                if (childMesh.material.name === 'Material.001') {
                                    console.log('Identified as Ground:', childMesh);
                                    groundMesh = childMesh;
                                } else if (childMesh.material.name === 'Bark' || childMesh.material.name === 'leaves') {
                                    treeMeshes.push(childMesh);
                                }
                            }
                        });
                    }
                }
            }
        });
                
        // Create a GUI for debugging light settings
        const gui = new GUI();
        const lightFolder = gui.addFolder('Light');
        lightFolder.add(ambientLight, 'intensity', 0, 1, 0.01).name('Ambient Light Intensity');
        lightFolder.add(directionalLight, 'intensity', 0, 1, 0.01).name('Directional Light Intensity');
        lightFolder.open();

        animate();
    });

    // Load the character model
    const objLoader = new OBJLoader();
    objLoader.setPath('../persona/object/');
    objLoader.load('Penelope.obj', (object) => {
        person = object;
        person.position.set(0, -49, 50);
        person.scale.set(0.045, 0.045, 0.045);
        person.visible = false; //object invisible initially
        scene.add(person);
    });

    // Load the .fbx walking and running animations
    const fbxLoader = new FBXLoader();

    // Function to load an animation
    function loadAnimation(file, callback) {
        fbxLoader.load(`../animation/${file}.fbx`, (fbx) => {
            if (callback) callback(fbx);
        });
    }

    // Load the walking animation
    loadAnimation('Walking', (fbx) => {
        animatedPerson = fbx;
        animationMixer = new THREE.AnimationMixer(animatedPerson); //mixer for the animated person

        // Play the first animation clip (walking)
        walkingAction = animationMixer.clipAction(fbx.animations[0]);
        walkingAction.play();
        walkingAction.paused = true; // pause initially
        walkingAction.timeScale = 0.7;

        animatedPerson.visible = false; // hide initially
        scene.add(animatedPerson);
        animatedPerson.scale.set(0.0011, 0.0011, 0.0011);
        //console.log('Scale after adding of animatedPerson:', animatedPerson.scale); 
        console.log('Walking animation loaded');

        // Load the running animation
        loadAnimation('Running', (fbx) => {
            runningAction = animationMixer.clipAction(fbx.animations[0]);
            runningAction.timeScale = 1.2;
            runningAction.paused = true;
            console.log('Running animation loaded');
        });

        // Load the breathing animation
        loadAnimation('Breathing', (fbx) => {
            idlePerson = fbx;
            breathingAction = animationMixer.clipAction(fbx.animations[0]);
            breathingAction.play();
            breathingAction.paused = true;
            breathingAction.loop = THREE.LoopRepeat;
            idlePerson.scale.set(0.0111, 0.0111, 0.0111);
            scene.add(idlePerson);
            idlePerson.visible = true; // visible initially
            console.log('Breathing animation loaded');
        });
    });

    // Add event listeners for user input
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onMouseWheel);
    window.addEventListener('resize', onWindowResize);
    
    document.body.style.cursor = 'none'; // hide cursor

    raycaster = new THREE.Raycaster();
}

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveDirection.forward = true; break;
        case 'ArrowDown': case 's': moveDirection.backward = true; break;
        case 'ArrowLeft': case 'a': moveDirection.left = true; break;
        case 'ArrowRight': case 'd': moveDirection.right = true; break;
        case 'Shift': if (!event.repeat) isRunning = true; break;
    }
    isMoving = true;
    toggleModelVisibility();
}

function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveDirection.forward = false; break;
        case 'ArrowDown': case 's': moveDirection.backward = false; break;
        case 'ArrowLeft': case 'a': moveDirection.left = false; break;
        case 'ArrowRight': case 'd': moveDirection.right = false; break;
        case 'Shift': isRunning = false; break;
    }   
    isMoving = moveDirection.forward || moveDirection.backward || moveDirection.left || moveDirection.right;
    toggleModelVisibility();
}

function toggleModelVisibility() {
    if (person && animatedPerson && idlePerson) {
        animatedPerson.visible = isMoving;
        idlePerson.visible = !isMoving;

        if (isMoving) {
            // Sync position and rotation
            animatedPerson.position.copy(person.position);
            animatedPerson.rotation.copy(person.rotation);

            if (isRunning && runningAction) {
                runningAction.paused = false;
                runningAction.play();
                if (walkingAction) walkingAction.paused = true;
                if (breathingAction) breathingAction.paused = true;
            } else {
                if (walkingAction) {
                    walkingAction.paused = false;
                    walkingAction.play();
                }
                if (runningAction) runningAction.paused = true;
                if (breathingAction) breathingAction.paused = true;
            }
        } else {
            if (walkingAction) walkingAction.paused = true;
            if (runningAction) runningAction.paused = true;
            if (breathingAction) {
                breathingAction.paused = false;
                breathingAction.play();
            }
            idlePerson.position.copy(person.position);
            idlePerson.rotation.copy(person.rotation);
        }
    }
}

function onMouseMove(event) {
    const deltaX = event.clientX - previousMouseX;
    previousMouseX = event.clientX; 

    const rotationAmountX = deltaX * 0.0005;
    const maxRotationAngle = Math.PI / 4; // limit rotation to ±45 degrees

        if (isMoving) {
            person.rotation.y = THREE.MathUtils.clamp(person.rotation.y - rotationAmountX, -maxRotationAngle, maxRotationAngle);
            animatedPerson.rotation.y = person.rotation.y; // keep the animated person in sync         
        } else {
                camera.rotation.order = 'YXZ'; // ensure correct rotation order
                camera.rotation.y -= rotationAmountX;
                }
    }

function onMouseWheel(event) {
    const zoomSpeed = 0.1;
    zoomLevel += event.deltaY * zoomSpeed * 0.01; // -= inverted
    zoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, zoomLevel)); // clamp zoom level between min and max
    updateCameraPosition();
}

function onMouseDown(event) {
    if (event.button === 1) { 
        isMiddleMouseDown = true;
    }
}

function onMouseUp(event) {
    if (event.button === 1) {
        isMiddleMouseDown = false;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePersonPosition() {
    if (person) {
        let moved = false;
        const rotationSpeed = 0.02, forward = new THREE.Vector3(Math.sin(person.rotation.y), 0, Math.cos(person.rotation.y));

        if (moveDirection.forward && !checkCollision(forward.clone().multiplyScalar(moveSpeed))) {
            person.position.add(forward.clone().multiplyScalar(moveSpeed));
            moved = true;
        }
        if (moveDirection.backward && !checkCollision(forward.clone().multiplyScalar(-moveSpeed))) {
            person.position.add(forward.clone().multiplyScalar(-moveSpeed));
            moved = true;
        }
        
        if (moveDirection.left) {
            person.rotation.y += rotationSpeed;
            moved = true;
        }
        if (moveDirection.right) {
            person.rotation.y -= rotationSpeed;
            moved = true;
        }

        if (moved) {
            keepPersonOnGround();
            syncAnimatedPersonPosition();
        }}
}

// Sync animated person position and rotation
function syncAnimatedPersonPosition() {
    if (animatedPerson) {
    animatedPerson.scale.set(0.0111, 0.0111, 0.0111);
    //console.log('Scale of animatedPerson after update:', animatedPerson.scale);
    animatedPerson.position.copy(person.position);
    animatedPerson.rotation.copy(person.rotation);
    }
}

function updateCameraPosition() {
    if (person) {
        // Adjust the offset to keep the camera closer to the person
        const offset = new THREE.Vector3(0, 1.5, -3).applyQuaternion(person.quaternion);
        const cameraPosition = new THREE.Vector3().copy(person.position).add(offset.multiplyScalar(zoomLevel));
        
        // Ensure the camera follows the person smoothly
        camera.position.lerp(cameraPosition, 0.1);

         // Ensure the camera stays above the ground level and not too high
        camera.position.y = Math.max(person.position.y + 2);
        camera.lookAt(person.position);
    }
}

function keepPersonOnGround() {
    if (!groundMesh) {
        console.warn('Ground mesh is not defined');
        return;
    }
    const maxHeightChange = 2.0; // max allowable height change

    // Cast a ray from above the person straight down
    raycaster.set(person.position.clone().setY(10), new THREE.Vector3(0, -1, 0));
    // Intersect with ground meshes
    const groundIntersects = raycaster.intersectObject(groundMesh, true).filter(intersect => intersect.object.material.name !== 'leaves'); //filter out leaves

    // // Update the person's height to keep them on the ground
    if (groundIntersects.length > 0) {
        const groundHeight = groundIntersects[0].point.y;
        //console.log('Ground height detected at:', groundHeight);

        // Ensure the new ground height is within the allowable range
        const heightDifference = groundHeight - lastGroundHeight;
        if (Math.abs(heightDifference) <= maxHeightChange) {
             lastGroundHeight = groundHeight; // update
             person.position.y = groundHeight + 0.08;
        } else {
             //console.warn('Height change too steep, ignoring this update.');
        }
     } else {
         console.warn('No intersection with ground mesh detected');
     }
 }

function checkCollision(direction) {
    const shoulderHeightOffset = 1.5; 
    const rayOrigin = person.position.clone();
    rayOrigin.y += shoulderHeightOffset;

    raycaster.set(rayOrigin, direction.normalize());
    const intersects = raycaster.intersectObjects(treeMeshes, true).filter(intersect => intersect.object.material.name === 'Bark');

    if (intersects.length > 0) {
        const distance = intersects[0].distance;
        return distance < moveSpeed + 0.08; // small offset to avoid ending up in the tree bark
    }
    return false;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (animationMixer) {
        animationMixer.update(delta);
    }
    
    if (runningMixer) {
        runningMixer.update(delta);
    }

    // Update position only if the person is moving
    if (isMoving) {
        updatePersonPosition();
    }
    updateCameraPosition();
    toggleModelVisibility(); 
    renderer.render(scene, camera);
}

init();