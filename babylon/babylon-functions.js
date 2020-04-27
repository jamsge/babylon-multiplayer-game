const BABYLON = require("babylonjs");
import 'babylonjs-loaders';
const Ammo = require("ammo.js");
const engine = new BABYLON.NullEngine;
const scene = new BABYLON.Scene(engine)
let camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);
scene.enablePhysics(
  new BABYLON.Vector3(0, -8000, 0),
  new BABYLON.AmmoJSPlugin(true, Ammo)
);

// Physics Impostor for players
const GROUNDED_FRICTION = 0.2;
const AIR_FRICTION = 0;
let playerPhysicsImpostor = function(mesh){
	return new BABYLON.PhysicsImpostor(
    mesh,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 5, restitution: 0, friction:GROUNDED_FRICTION},
    scene
  );
}	

// Array of all the meshes in the scene that are part of the level
let staticMeshList = [];

// Player 
const PLAYER_HEIGHT = 2;
const PLAYER_WIDTH = 1;
const PLAYER_DEPTH = 1;
const BOX_CAST_HEIGHT = 0.05;
const BOX_CAST_WIDTH_DEPTH = 0.93

const createPlayer = function(id, spawnCoord){
  let player = BABYLON.MeshBuilder.CreateBox(
    id,
    { height:PLAYER_HEIGHT, width:PLAYER_WIDTH, depth:PLAYER_DEPTH},
    scene
  );
  player.position.y = spawnCoord.y;
  player.position.x = spawnCoord.x;
  player.position.z = spawnCoord.z;
  player.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0,0,0), 0);
	player.metadata = {
		physicsActivated: true
	};
  //physics
  player.physicsImpostor = playerPhysicsImpostor(player);
	
	player.metadata["grounded"] = false;
	player.metadata["normal"] = new BABYLON.Vector3(0,0,0);
	let boxCast = 
	BABYLON.MeshBuilder.CreateBox("boxCast", {height:BOX_CAST_HEIGHT, width:BOX_CAST_WIDTH_DEPTH, depth:BOX_CAST_WIDTH_DEPTH}, scene);
	boxCast.parent = player;
	boxCast.position.y = -(PLAYER_HEIGHT/2 + BOX_CAST_HEIGHT);
	boxCast.actionManager = new BABYLON.ActionManager(scene);
}

const switchPlayerPhysicsImpostor = function(id){
	// console.log(typeof(scene.getMeshByID(id).physicsImpostor));
	let isPhysicsActivated = scene.getMeshByID(id).metadata.physicsActivated;
	if (isPhysicsActivated)
		scene.getMeshByID(id).physicsImpostor.dispose();
	else {
		scene.getMeshByID(id).physicsImpostor = playerPhysicsImpostor(scene.getMeshByID(id));
	}
	scene.getMeshByID(id).physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,0,0));
	scene.getMeshByID(id).metadata.physicsActivated = !isPhysicsActivated;
}

const frontLeftLocal = new BABYLON.Vector3(-BOX_CAST_WIDTH_DEPTH/2, 0, -BOX_CAST_WIDTH_DEPTH/2);
const frontRightLocal = new BABYLON.Vector3(BOX_CAST_WIDTH_DEPTH/2, 0, -BOX_CAST_WIDTH_DEPTH/2);
const backLeftLocal = new BABYLON.Vector3(-BOX_CAST_WIDTH_DEPTH/2, 0, BOX_CAST_WIDTH_DEPTH/2);
const backRightLocal = new BABYLON.Vector3(BOX_CAST_WIDTH_DEPTH/2, 0, BOX_CAST_WIDTH_DEPTH/2);

// Raycast directly below the player, get the normal vector and distance of the mesh directly below the player and store it in the player mesh's metadata
const playerRaycast = function(id){
	let mesh = scene.getMeshByID(id);
	mesh.computeWorldMatrix();
	let matrix = mesh.getWorldMatrix(true);
	// let centerOrigin = mesh.position;
	
	let frontLeftGlobal = BABYLON.Vector3.TransformCoordinates(frontLeftLocal, matrix); 
	let frontRightGlobal = BABYLON.Vector3.TransformCoordinates(frontRightLocal, matrix); 
	let backLeftGlobal = BABYLON.Vector3.TransformCoordinates(backLeftLocal, matrix); 
	let backRightGlobal = BABYLON.Vector3.TransformCoordinates(backRightLocal, matrix); 
	
	const down = new BABYLON.Vector3(0, -1, 0);
	const length = 3;
	const height = 1;
	let frontLeftRay = new BABYLON.Ray(frontLeftGlobal, down, length);
	let frontRightRay = new BABYLON.Ray(frontRightGlobal, down, length);
	let backLeftRay = new BABYLON.Ray(backLeftGlobal, down, length);
	let backRightRay = new BABYLON.Ray(backRightGlobal, down, length);
	
	const predicate = function(mesh){
		if (mesh.name == id || mesh.name == "boxCast")
			return false;
		return true;
	}
	
	let frontLeftHit = scene.pickWithRay(frontLeftRay, predicate);
	let frontRightHit = scene.pickWithRay(frontRightRay, predicate);
	let backLeftHit = scene.pickWithRay(backLeftRay, predicate);
	let backRightHit = scene.pickWithRay(backRightRay, predicate);
	let hitsDistances = [frontLeftHit.distance, frontRightHit.distance, backLeftHit.distance, backRightHit.distance]
	
	
	let minIndex = -1;
	for (let i = 0; i < hitsDistances.length; i++){
		if (hitsDistances[i] != 0 && minIndex == -1){
			minIndex = i;
		}
		if (minIndex != -1 && hitsDistances[i] < hitsDistances[minIndex] && hitsDistances[i] != 0){
			minIndex = i;
		}
	}
	
	if (minIndex == -1){
		return new BABYLON.Vector3(0,0,0);
	}
	
	let hits = [frontLeftHit, frontRightHit, backLeftHit, backRightHit];
	let lastNormal = mesh.metadata["normal"]
	let normal = hits[minIndex].getNormal(true);
	mesh.metadata["normal"] = normal;
	// let distance = hits[minIndex].distance;
	// if (lastNormal.subtract(normal).length() > 0.01){
		// mesh.metadata["normal"] = normal;
		// return normal;
	// }
	return normal;
}

// Put a box mesh directly below the player, loop throught the list of meshes that are part of the stage (staticMeshList) and see if the box mesh intersects
// with any of them. If so, set the metadata prop "grounded" to true
const playerBoxcast = function(id){
	let boxCast = scene.getMeshByID(id).getChildren(function(obj){
		if (obj.name == "boxCast")
			return true;
		return false;
	})[0];
	for (let i = 0; i < staticMeshList.length; i++){
		if (boxCast.intersectsMesh(staticMeshList[i], true)){
			
			// scene.getMeshByID(id).metadata["grounded"] = true;
			scene.getMeshByID(id).physicsImpostor.friction = GROUNDED_FRICTION;	
			return true;
		}
	}
	//scene.getMeshByID(id).metadata["grounded"] = false;
	scene.getMeshByID(id).physicsImpostor.friction = AIR_FRICTION;
	return false;
}

// Creates a box that is part of the level
const createStaticBox = function (name, pos, dim, rot = {x:0, y:0, z:0}, rgb = {r:1, g:1, b:1}, restitution = 0, friction = 20 ){
  let box = BABYLON.MeshBuilder.CreateBox(
    name,
    { height:dim.height, width:dim.width, depth:dim.depth },
    scene
  );
	staticMeshList.push(box);
  box.position.x = pos.x;
  box.position.y = pos.y;
  box.position.z = pos.z;
  box.rotation.x = rot.x;
  box.rotation.y = rot.y;
  box.rotation.z = rot.z;
	
  box.physicsImpostor = new BABYLON.PhysicsImpostor(
    box,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { "mass":0, "restitution":restitution, "friction":friction },
    scene
  );
}

// Create a collision callback between two physics impostors
const createCollisionCallback = function(impostor1, impostor2, callback){
	impostor1.registerOnPhysicsCollide(impostor2, (main, collided)=>{
		callback(main, collided);
	})
}

// Create the level here
function initSimpleLevel(){
  console.log("creating level...")
	createStaticBox("ground4", {x:0, y:15, z:-15}, {height:0.2, width:30, depth:30}, {x:Math.PI/2, y:0, z:0});
	createStaticBox("ground3", {x:-27.1, y:-8.85, z:0}, {height:0.2, width:30, depth:30}, {x:0, y:0, z:Math.PI/5})
	createStaticBox("ground2", {x:27.2, y:8.85, z:0}, {height:0.2, width:30, depth:30}, {x:0, y:0, z:Math.PI/5})
	createStaticBox("ground1", {x:0, y:0, z:0}, {height:0.2, width:30, depth:30})
	
	// BABYLON.SceneLoader.Append("http://localhost:2567/assets/models/", "test_import_6.gltf", scene, function (scene) {

	// });
	
	BABYLON.SceneLoader.ImportMesh("", "http://localhost:2567/assets/models/", "test_import_8.babylon", scene, function (newMeshes) {
		for (let i = 0; i < newMeshes.length; i++){
			newMeshes[i].position.z += 20;
			staticMeshList.push(newMeshes[i]);
			newMeshes[i].physicsImpostor = new BABYLON.PhysicsImpostor(
					newMeshes[i],
					BABYLON.PhysicsImpostor.MeshImpostor,
					{"mass":0, "restitution":0, "friction":20, ignoreParent: true},
					scene
				)
		}
	});
	
}

module.exports = {
  engine, 
  scene,
  createPlayer,
  createStaticBox,
  initSimpleLevel,
	createCollisionCallback,
	switchPlayerPhysicsImpostor,
	playerRaycast,
	playerBoxcast,
}