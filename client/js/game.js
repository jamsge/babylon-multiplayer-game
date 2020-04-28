	import * as THREE from './lib/three.module.js';
import { OBJLoader } from './lib/OBJLoader.js';
import { PointerLockControls } from './lib/PointerLockControls.js';
import { OrbitControls } from './lib/OrbitControls.js';
import { GLTFLoader } from './lib/GLTFLoader.js';

export var client = new Colyseus.Client("ws:" + window.location.host);

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

const playerWidth = 1;
const playerHeight = 2;
const playerDepth = 1;
const playerGeometry = new THREE.BoxGeometry(playerWidth, playerHeight, playerDepth);

// Function for adding player models to the scene
function makePlayerModel(geometry, color, x, z) {
  const material = new THREE.MeshPhongMaterial({color});
	// 	material.wireframe = true;
  const cube = new THREE.Mesh(playerGeometry, material);
	cube.castShadow = true;
  scene.add(cube);
  cube.position.x = x;
  cube.position.z = z;
  return cube;
}	

function createPlatform(scale = {x:30, y:0.2, z:30}, coords = {x:0, y:0, z:0}, rotation = {x:0, y:0, z:0}, receiveShadow = false, castShadow = false){
	var coordsVector = new THREE.Vector3(coords.x, coords.y, coords.z);
	let materialArray  = [];
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: (new THREE.TextureLoader().load( '../assets/orange_grid.jpg')) }));
	for (let i = 0; i < 6; i++){
		materialArray[i].side = THREE.Side;
	}
	let groundGeo = new THREE.BoxGeometry(scale.x, scale.y, scale.z)
	let ground = new THREE.Mesh(groundGeo, materialArray);
	ground.position.set(coordsVector.x, coordsVector.y, coordsVector.z);
	ground.rotation.set(rotation.x, rotation.y, rotation.z);
	ground.receiveShadow = receiveShadow;
	ground.castShadow = castShadow;
	scene.add(ground);
}

const canvas = document.querySelector('#render');
const renderer = new THREE.WebGLRenderer({canvas});
// renderer.shadowMapEnabled = true;
const fov = 90;
const aspect = window.innerWidth/window.innerHeight;  // the canvas default
const near = 0.1;
const far = 30000;
var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-30, 3, 0);
var controls = new OrbitControls(camera, renderer.domElement);
var mode = 0;

var clock = new THREE.Clock();

// resize the renderer to fit the screen
function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}

// switch between FPS camera and orbit camera
function switchControls(){
	var prevCamera = camera;
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.copy( prevCamera.position );
	camera.rotation.copy( prevCamera.rotation );
	var MODE = { FPS: 0, ORBIT: 1 };
	switch( mode ) {
		case MODE.FPS:
			controls = new PointerLockControls(camera, renderer.domElement);
			controls.lock();
			mode = MODE.ORBIT;
			break;
		case MODE.ORBIT:
			controls.unlock();
			controls = new OrbitControls(camera, renderer.domElement);
			mode = MODE.FPS;	
			break;
	}
	camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
	camera.updateProjectionMatrix();
}


// Global players object where player information like mesh and score can be edited and accessed
var players = {};
var loader = new GLTFLoader();

// load player models
export function init(){
	{
		loader.load(
			// resource URL
			'../../assets/models/test_import_8.gltf',
			// called when resource is loaded
			function ( gltf ) {
				console.log(gltf);
				gltf.scene.traverse( function ( child ) {
            if ( child.material ){
							child.material = new THREE.MeshToonMaterial({color:0x440000, specular:0x222222});
								var outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.BackSide } );
							child.material.shininess = 4;
							child.material.metalness = 0;
						}							
        } );
				gltf.scene.rotation.y = Math.PI
				gltf.scene.position.z += 20;
				scene.add( gltf.scene );
				main();
			},
			// called when loading is in progresses
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			// called when loading has errors
			function ( error ) {
				console.log( error );
			}
		);
	}
	{
		loader.load(
			'../../assets/models/player.glb	',
			function (gltf){
				var model = gltf;
				console.log(model.animations);
				scene.add(gltf.scene);
				clock.start();
			},
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			// called when loading has errors
			function ( error ) {
				console.log( error );
			}
		);
	}
}

// init();

function main() {
	
	// light
  {
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 1, -2)
    scene.add(light);
  }
	
	
	// light
  {
    const color = 0x404040;
    const intensity = 1
    const ambientLight = new THREE.AmbientLight(color, intensity);
    scene.add(ambientLight)
  }
	{
		var light = new THREE.AmbientLight( 0x404040 ); // soft white light
		scene.add( light );
	}
	
	
	// skybox
	{
		let materialArray = [];
		let texture_ft = new THREE.TextureLoader().load( '../assets/arid2_ft.jpg');
		let texture_bk = new THREE.TextureLoader().load( '../assets/arid2_bk.jpg');
		let texture_up = new THREE.TextureLoader().load( '../assets/arid2_up.jpg');
		let texture_dn = new THREE.TextureLoader().load( '../assets/arid2_dn.jpg');
		let texture_rt = new THREE.TextureLoader().load( '../assets/arid2_rt.jpg');
		let texture_lf = new THREE.TextureLoader().load( '../assets/arid2_lf.jpg');
			
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
			 
		for (let i = 0; i < 6; i++){
			materialArray[i].side = THREE.BackSide;
		}
			 
		let skyboxGeo = new THREE.BoxGeometry( 10000, 10000, 10000);
		let skybox = new THREE.Mesh( skyboxGeo, materialArray );
		scene.add( skybox );
	}
	
	
	// central platform
	createPlatform({x:30,y:0.2,z:30});

	// slanted platform
	createPlatform({x:30,y:0.2,z:30}, {x:27.2,y:8.85,z:0}, {x:0,y:0,z:Math.PI/5});
	
	// slanted platform
	createPlatform({x:30,y:0.2,z:30}, {x:-27.1,y:-8.85,z:0}, {x:0,y:0,z:Math.PI/5});
	
	// vertical platform
	createPlatform({x:30,y:0.2,z:30}, {x:0,y:15,z:-15}, {x:Math.PI/2,y:0,z:0});
	
	// positive x (to the right of the player)
	createPlatform({x:1,y:1,z:1}, {x:5,y:1,z:0});
	
	// positive z (to the back of the player)
	createPlatform({x:1,y:1,z:1}, {x:0,y:1,z:5});
	
	// join room "my_room"
	client.joinOrCreate("my_room").then(room_instance => {
		console.log(client)
		console.log("joining")
		var room;
		room = room_instance;
		console.log(room);
		// Player join listener
		room.state.players.onAdd = function(player, sessionId){
			players[sessionId] = {model: makePlayerModel(playerGeometry, 0x44aa88, player.x, player.z)}
		}
		
		// Player leave listener
		room.state.players.onRemove = function(player, sessionId){
			scene.remove(players[sessionId].model)
			delete players[sessionId];
		}
		
		// Update player 
		room.state.players.onChange = function(player, sessionId){
			// Linearly interpolate player position
			players[sessionId].model.position.copy(players[sessionId].model.position.lerp(new THREE.Vector3(player.x, player.y, player.z), 0.35))
			
			// Player Quaternion
			// players[sessionId].model.quaternion.x = player.rx;
			// players[sessionId].model.quaternion.z = player.rz;
			players[sessionId].model.quaternion.y = player.ry;
			players[sessionId].model.quaternion.w = player.rw;
		}
		
		// Receiving messages from server
		room.onMessage((message) => {
			console.log("message received: ", message);
		})
		
		// Keypress.js listener
		var listener = new window.keypress.Listener();
		
		// Find which keys are being pressed down
		function find(target){
			var isFound = false;
			listener._keys_down.find(function(element){
				if (element == target)
					isFound = true;
			})
			return isFound;
		}
		
		// Movement functions
		function facing(msg, rot){
			msg["x"] = rot.x;
			msg["y"] = rot.y;
			msg["z"] = rot.z;
			msg["w"] = rot.w;
			msg["facing"] = true;
		}
		function forward(msg){
			msg["fwd"] = true;
		}
		function back(msg){
			msg["bck"] = true;
		}
		function left(msg){
			msg["lft"] = true;
		}
		function right(msg){
			msg["rht"] = true;
		}
		function forwardLeft(msg){
			msg["fwdlft"] = true;
		}
		function forwardRight(msg){
			msg["fwdrht"] = true;
		}
		function backLeft(msg){
			msg["bcklft"] = true;
		}
		function backRight(msg){
			msg["bckrht"] = true;
		}
		function jump(msg){
			msg["jump"] = true;
		}
		function moving(msg, isMoving){
			msg["moving"] = isMoving;
		}
		
		// f is for debug stuff, g is to switch camera between FPS and orbit camera
		listener.register_many([
			{
				"keys":"f",
				"prevent_repeat": false,
				"on_keydown": function(){
					getInfo();
				},
			},
			{
				"keys":"g",
				"prevent_repeat": true,
				"on_keydown": function(){
					switchControls(room.sessionId);
				}
			}
		])
		
		// Debug function
		function getInfo(){
			room.send({getScene:true});
		}
		
		var faceDirection = new THREE.Quaternion(0,0,0,0);
		// Render, called every frame
		function render(time) {
			time *= 0.001;	
			var dt = clock.getDelta()
			// mixer.update(dt);
	
			if (resizeRendererToDisplaySize(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}
			// the message to be sent to the server
			var message = {};
			
			// Store last face direction, get most recent face direction
			var lastFaceDirectionEuler = new THREE.Euler(0,0,0);
			lastFaceDirectionEuler.setFromQuaternion(faceDirection);
			
			faceDirection.copy(camera.quaternion);
			
			var currentFaceDirectionEuler = new THREE.Euler(0,0,0);
			currentFaceDirectionEuler.setFromQuaternion(faceDirection);
			
			var faceDiff = lastFaceDirectionEuler.toVector3().sub(currentFaceDirectionEuler.toVector3()).length();
			if (faceDiff != 0) {
				facing(message, faceDirection);
			}
			
			
			// Send which way the camera is facing
			
			// If in FPS mode, then move the camera with the player
			if (mode == 1 && players[room.sessionId]){
				var position = players[room.sessionId].model.position;
				camera.position.copy(position);
				camera.position.y += 0.5;
			} else if (mode == 0 && players[room.sessionId]){
				controls.update();
			}
			
			// This mess is my controller logic, lol it's so bad
			// I'll make it better later but just know that all it's doing is dictating what direction the player wants to move in based on what WASD keys they have pressed down
			if (!(find("space") || find("w") || find("d") || find("a") || find("s"))){
				moving(message, false);
			} else {
				moving(message, true);
				if (find("space") && !(find("w") || find("d") || find("a") || find("s"))){
					jump(message);
				} else {
					var isJump = false;
					if (find("space")){
						jump(message)
					}
					if (find("w") && find("a") && !find("d") && !find("s")){
						forwardLeft(message);
					}
					else if (find("w") && find("d") && !find("a") && !find("s")){
						forwardRight(message);
					}
					else if (find("s") && find("a") && !find("d") && !find("w")){
						backLeft(message);
					}
					else if (find("s") && find("d") && !find("a") && !find("w")){
						backRight(message);
					} 
					else {
						if (!((find("w") && find("s")))){
							if (find("w")){
								forward(message);
							}
							else if (find("s")){
								back(message);
							}
						}
						if (!((find("a") && find("d")))){
							if (find("a")){
								left(message);
							}
							else if (find("d")){
								right(message);
							}
						}
					}
				}
			}
			
			// Send the movement message to the server
			room.send(message);
			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
		

	}).catch(e => {
		console.log(";'( JOIN ERROR: ", e);
	});
}
	
