import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OBJLoader } from 'OBJLoader';
import GUI from 'lil-gui';

let scene, camera, renderer, model, person, raycaster, groundMesh;
const rockMeshes = [], treeMeshes = [];
const moveSpeed = 0.05, moveDirection = { forward: false, backward: false, left: false, right: false };
let previousMouseX = 0, previousMouseY = 0, zoomLevel = 1, isMoving = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(ambientLight, directionalLight);

    new GLTFLoader().load('../environment/object/scene.glb', (gltf) => {
        model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
            if (child.isMesh) {
                if (child.name === 'Plane_1') groundMesh = child;
                if (child.name.startsWith('rock_moss_set')) rockMeshes.push(child);
                if (child.material && ['tronco 1', 'tronco 2', 'tronco 3'].includes(child.material.name)) treeMeshes.push(child);
            }
        });

        const gui = new GUI();
        const lightFolder = gui.addFolder('Light');
        lightFolder.add(ambientLight, 'intensity', 0, 1, 0.01).name('Ambient Light Intensity');
        lightFolder.add(directionalLight, 'intensity', 0, 1, 0.01).name('Directional Light Intensity');
        lightFolder.open();

        animate();
    });

    const objLoader = new OBJLoader(), textureLoader = new THREE.TextureLoader(), texture = textureLoader.load('../persona/object/penelope.png');
    objLoader.setPath('../persona/object/').load('penelope.obj', (object) => {
        object.traverse((child) => {
            if (child.isMesh) child.material.map = texture;
        });
        person = object;
        person.position.set(-15.197662057152332, 0.9395596621062697, -15.895833011962774);
        person.rotation.set(-Math.PI / 2, 0, Math.PI);
        person.scale.set(0.2, 0.2, 0.2);
        scene.add(person);
    });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onMouseWheel);
    window.addEventListener('resize', onWindowResize);
    
    document.body.style.cursor = 'none'; // make the cursor invisible

    raycaster = new THREE.Raycaster();
}

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveDirection.forward = true; break;
        case 'ArrowDown': case 's': moveDirection.backward = true; break;
        case 'ArrowLeft': case 'a': moveDirection.left = true; break;
        case 'ArrowRight': case 'd': moveDirection.right = true; break;
    }
    isMoving = true;
}

function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp': case 'w': moveDirection.forward = false; break;
        case 'ArrowDown': case 's': moveDirection.backward = false; break;
        case 'ArrowLeft': case 'a': moveDirection.left = false; break;
        case 'ArrowRight': case 'd': moveDirection.right = false; break;
    }
    isMoving = moveDirection.forward || moveDirection.backward || moveDirection.left || moveDirection.right;
}

function onMouseMove(event) {
    const deltaX = event.clientX - previousMouseX, deltaY = event.clientY - previousMouseY;
    previousMouseX = event.clientX; previousMouseY = event.clientY;

    const rotationAmountX = deltaX * 0.001, rotationAmountY = deltaY * 0.001;

    if (isMoving) {
        person.rotation.z -= rotationAmountX;
    } else {
        camera.rotation.order = 'YXZ'; // ensure correct rotation order
        camera.rotation.y -= rotationAmountX;
        camera.rotation.x -= rotationAmountY;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // limit the x rotation to avoid flipping
    }
    updateCameraPosition();
}

function onMouseWheel(event) {
    const zoomSpeed = 0.1;
    zoomLevel -= event.deltaY * zoomSpeed * 0.01;
    zoomLevel = Math.max(1, Math.min(5, zoomLevel));
    updateCameraPosition();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePersonPosition() {
    if (person) {
        let moved = false;
        const rotationSpeed = 0.02, forward = new THREE.Vector3(Math.sin(person.rotation.z), 0, Math.cos(person.rotation.z));

        if (moveDirection.forward && !checkTreeCollision(person.position.clone().add(forward.clone().multiplyScalar(moveSpeed)))) {
            person.position.add(forward.clone().multiplyScalar(moveSpeed));
            moved = true;
        }
        if (moveDirection.backward && !checkTreeCollision(person.position.clone().add(forward.clone().multiplyScalar(-moveSpeed)))) {
            person.position.add(forward.clone().multiplyScalar(-moveSpeed));
            moved = true;
        }
        if (moveDirection.left) {
            person.rotation.z += rotationSpeed;
            moved = true;
        }
        if (moveDirection.right) {
            person.rotation.z -= rotationSpeed;
            moved = true;
        }

        if (moved) {
            keepPersonOnGround();
        }
    }

    updateCameraPosition();
}

function updateCameraPosition() {
    if (person) {
        const offset = new THREE.Vector3(0, 2, -5).applyQuaternion(person.quaternion);
        const cameraPosition = new THREE.Vector3().copy(person.position).add(offset.multiplyScalar(zoomLevel));
        camera.position.lerp(cameraPosition, 0.1);
        camera.position.y = Math.max(person.position.y + 2, 1); // camera stays above ground
        camera.lookAt(person.position);
    }
}

function keepPersonOnGround() {
    raycaster.set(person.position.clone().setY(10), new THREE.Vector3(0, -1, 0));
    const groundIntersects = raycaster.intersectObject(groundMesh, true);

    let maxHeight = groundIntersects.length > 0 ? groundIntersects[0].point.y : null;

    rockMeshes.forEach((rock) => {
        const rockIntersects = raycaster.intersectObject(rock, true);
        if (rockIntersects.length > 0) {
            const rockHeight = rockIntersects[0].point.y;
            if (rockHeight > maxHeight) maxHeight = rockHeight;
        }
    });

    if (maxHeight !== null) person.position.y = THREE.MathUtils.lerp(person.position.y, maxHeight + 0.15, 0.1);
}

function checkTreeCollision(newPosition) {
    const boundingBox = new THREE.Box3().setFromObject(person);
    return treeMeshes.some((tree) => {
        const treeBox = new THREE.Box3().setFromObject(tree);
        return boundingBox.intersectsBox(treeBox);
    });
}

function animate() {
    requestAnimationFrame(animate);
    updatePersonPosition();
    renderer.render(scene, camera);
}

init();
                 