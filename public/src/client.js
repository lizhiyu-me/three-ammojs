import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls.js';
// import { MapControls } from '/jsm/controls/OrbitControls.js';
var scene = undefined;
var camera = undefined;
var renderer = undefined;
var clock = undefined;

var tmpTransformation = undefined;
var controls = undefined;

Ammo().then(AmmoStart);
function AmmoStart() {
    tmpTransformation = new Ammo.btTransform();
    initPhysicsUniverse();
    initGraphicsUniverse();

    createCube(new THREE.Vector3(50, 2, 90), new THREE.Vector3(15, -5, 30), 0, 0x2c3e50, null);
    createCube(new THREE.Vector3(8, 1, 15), new THREE.Vector3(15, 0, 0), 0, 0xffffff, { x: 0.383, y: 0, z: 0, w: 0.924 });

    for (var z = 30; z > 15; z -= 5) {
        for (var j = 0; j < 10; j += 2.2) {
            for (var i = 0; i < 30; i += 2.1) {
                createCube(new THREE.Vector3(2, 2, 1.5), new THREE.Vector3(i, j, z), 1, 0xffffff, null);
            }
        }
    }

    setTimeout(function () {
        createCube(new THREE.Vector3(6, 6, 6), new THREE.Vector3(15, 100, -1), 10000, 0xc0392b, { x: 0.383, y: 0, z: 0.383, w: 0.924 });
    }, 1000);

    render();
}
var physicsUniverse = undefined;
// ------ Phisics World setup ------
function initPhysicsUniverse() {
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsUniverse = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsUniverse.setGravity(new Ammo.btVector3(0, -75, 0));
}
// ------ Three.js setup ------
function initGraphicsUniverse() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(-25, 20, -25);
    camera.lookAt(new THREE.Vector3(0, 6, 0));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ---------------- CAMERA CONTROLS ----------------
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    document.body.appendChild(renderer.domElement);
    clock = new THREE.Clock();

    //light
    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-1, 0.9, 0.4);
    scene.add(directionalLight);
}

var rigidBody_List = new Array();
function createCube(scale, position, mass, color, rot_quaternion) {
    let quaternion = undefined;

    if (rot_quaternion == null) {
        quaternion = { x: 0, y: 0, z: 0, w: 1 };
    }
    else {
        quaternion = rot_quaternion;
    }

    // ------ Graphics Universe - Three.JS ------
    let newcube = new THREE.Mesh(new THREE.BoxBufferGeometry(scale.x, scale.y, scale.z), new THREE.MeshPhongMaterial({ color: color }));
    newcube.position.set(position.x, position.y, position.z);
    scene.add(newcube);

    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    let defaultMotionState = new Ammo.btDefaultMotionState(transform);

    let structColShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    structColShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia);

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(mass, defaultMotionState, structColShape, localInertia);
    let RBody = new Ammo.btRigidBody(RBody_Info);

    physicsUniverse.addRigidBody(RBody);
    newcube.userData.physicsBody = RBody;
    rigidBody_List.push(newcube);
}

function updatePhysicsUniverse(deltaTime) {
    physicsUniverse.stepSimulation(deltaTime, 10);

    for (let i = 0; i < rigidBody_List.length; i++) {
        let Graphics_Obj = rigidBody_List[i];
        let Physics_Obj = Graphics_Obj.userData.physicsBody;
        // let tmpTransformation = new Ammo.btTransform();

        let motionState = Physics_Obj.getMotionState();
        if (motionState) {
            motionState.getWorldTransform(tmpTransformation);
            let new_pos = tmpTransformation.getOrigin();
            let new_qua = tmpTransformation.getRotation();
            Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z());
            Graphics_Obj.quaternion.set(new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w());
        }
    }
}


function render() {
    let deltaTime = clock.getDelta();
    updatePhysicsUniverse(deltaTime);

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}