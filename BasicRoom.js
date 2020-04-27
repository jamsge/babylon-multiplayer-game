// Colyseus stuff
const colyseus = require('colyseus');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;
const ArraySchema = schema.ArraySchema;
const Ammo = require("ammo.js")
const BABYLON = require("babylonjs")

// Babylon functions from babylon-function.js
const engine = require('./babylon/babylon-functions.js').engine
const scene = require('./babylon/babylon-functions.js').scene
const createScene = require('./babylon/babylon-functions.js').createScene
const createPlayer = require('./babylon/babylon-functions.js').createPlayer
const initSimpleLevel = require('./babylon/babylon-functions.js').initSimpleLevel
const createStaticBox = require('./babylon/babylon-functions.js').createStaticBox
const createCollisionCallback = require('./babylon/babylon-functions.js').createCollisionCallback
const switchPlayerPhysicsImpostor = require('./babylon/babylon-functions.js').switchPlayerPhysicsImpostor
const playerRaycast = require('./babylon/babylon-functions.js').playerRaycast
const playerBoxcast = require('./babylon/babylon-functions.js').playerBoxcast

class Player extends Schema {
  constructor(identifier){
    super();
		// position
    this.x = 5 - Math.floor(Math.random() * 11);
    this.y = 3
    this.z = 5 - Math.floor(Math.random() * 11);
    
		// rotation quaternion
		this.rx = 0;
    this.ry = 0;
    this.rz = 0;
		this.rw = 0;
		
		// camera quaternion
		this.lookx = 0;
		this.looky = 0;
		this.lookz = 0;
		this.lookw = 0;
		
		// velocity (but not really)
		this.velocityX = 0;
		this.velocityY = 0;
		this.velocityZ = 0;
		
		// last jump in simulation time
		this.lastJump = -500;
		
		// creates player's mesh and physics impostor and add it to the scene 
    createPlayer(identifier, {x:this.x, y:this.y, z:this.z})
  }
}

// define types
schema.defineTypes(Player, {
  x:"number",
  y:"number",
  z:"number",
  rx:"number",
  ry:"number",
  rz:"number",
  rw:"number",
	lookx:"number",
	looky:"number",
	lookz:"number",
	lookw:"number",
	velocityX:"number",
	velocityY:"number",
	velocityZ:"number",
	lastJump:"number"
});

// game sttate
class State extends Schema {
  constructor(){
    super();
		// creates list of players
    this.players = new MapSchema();
  }
	
	// On player creation add player object to player MapSchema
  createPlayer(id){
    this.players[id] = new Player(id);
  }
	
	// On player leave remove player object from player MapSchema
  removePlayer(id){
    delete this.players[id];
  }
	
	// Handle player movement
	// The code in this function is disgusting and icky and everything bad, let me (jamsge) know if you have any questions
  movePlayer(id, movement, elapsedTime, clock){
		let movementStrength = 1 // 600;
		let movementAcceleration = 0.1;
		let movementMaxVelocity = 1.0;
		let jumpCooldown = 300
		let player = scene.getMeshByID(id);
		if(movement.facing){	
			this.players[id].lookx = movement.x;
			this.players[id].looky = movement.y;
			this.players[id].lookz = movement.z;
			this.players[id].lookw = movement.w;
			let lookDirectionQuaternion = new BABYLON.Quaternion(0, this.players[id].looky, 0, this.players[id].lookw)
			player.rotationQuaternion.y = lookDirectionQuaternion.y;
			player.rotationQuaternion.w = lookDirectionQuaternion.w;
		}
		
		// All the directions the player can move in while grounded. This is probably an inefficient way to do movement but eh whatever
		let sin45 = Math.sqrt(2)/2;
		let movementVectorForward = new BABYLON.Vector3(0, 0, -movementStrength);
		let movementVectorBackward = new BABYLON.Vector3(0, 0, movementStrength);
		let movementVectorLeft = new BABYLON.Vector3(-movementStrength, 0, 0);
		let movementVectorRight = new BABYLON.Vector3(movementStrength, 0, 0);
		let movementVectorForwardLeft = new BABYLON.Vector3(-movementStrength * sin45, 0, -movementStrength * sin45);
		let movementVectorForwardRight = new BABYLON.Vector3(movementStrength * sin45, 0, -movementStrength * sin45);
		let movementVectorBackLeft = new BABYLON.Vector3(-movementStrength * sin45, 0, movementStrength * sin45);
		let movementVectorBackRight = new BABYLON.Vector3(movementStrength * sin45, 0, movementStrength * sin45);
		
		// The quaternion, euler angles and rotation matrix of where the player is looking
		let lookDirectionQuaternion = new BABYLON.Quaternion(0, this.players[id].looky, 0, this.players[id].lookw);
		lookDirectionQuaternion = lookDirectionQuaternion.normalize();
		// let lookDirectionEuler = (lookDirectionQuaternion).toEulerAngles();
		let lookDirectionMatrix = new BABYLON.Matrix();
		lookDirectionQuaternion.toRotationMatrix(lookDirectionMatrix);
		
		// Do boxcast check
		let grounded = playerBoxcast(id);
		let normal;
		
		// Logic for doing player movement
		function applyMovementVector(directionVector, scope){
			// Final movement vector letiable for debugging reasons
			let resultForwardVector;
			// If the player is grounded...
			if (grounded){
				normal = playerRaycast(id);
				// ... and if the jump message is sent and it has been "jumpCooldown" m.s. after the last jump, do a jump in the intended direction
				if (movement.jump && elapsedTime > jumpCooldown + scope.players[id].lastJump){
					scope.players[id].lastJump = elapsedTime;
					resultForwardVector = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), BABYLON.Vector3.TransformCoordinates(directionVector, lookDirectionMatrix));
					player.locallyTranslate(BABYLON.Vector3.Up().scale(0.05)) 
					let jumpImpulse = new BABYLON.Vector3(resultForwardVector.x * 1000 * scope.players[id].velocityX, 800, resultForwardVector.z * 1000 * scope.players[id].velocityZ);
					player.physicsImpostor.applyImpulse(jumpImpulse, player.position);
				// ... and the jump message isn't sent, just move regularly
				} else{
					resultForwardVector = BABYLON.Vector3.Cross(normal, BABYLON.Vector3.TransformCoordinates(directionVector, lookDirectionMatrix));
					scope.players[id].velocityX += movementAcceleration;
					if (scope.players[id].velocityX > movementMaxVelocity){
						scope.players[id].velocityX = movementMaxVelocity;
					}
					if (scope.players[id].velocityX < -movementMaxVelocity){
						scope.players[id].velocityX = -movementMaxVelocity;
					}
					
					scope.players[id].velocityZ += movementAcceleration;
					if (scope.players[id].velocityZ > movementMaxVelocity){
						scope.players[id].velocityZ = movementMaxVelocity;
					}
					if (scope.players[id].velocityZ < -movementMaxVelocity){
						scope.players[id].velocityZ = -movementMaxVelocity;
					}
					
					scope.players[id].velocityY += movementAcceleration;
					if (scope.players[id].velocityY > movementMaxVelocity){
						scope.players[id].velocityY = movementMaxVelocity;
					}
					if (scope.players[id].velocityY < -movementMaxVelocity){
						scope.players[id].velocityY = -movementMaxVelocity;
					}
					
					resultForwardVector.x *= Math.abs(scope.players[id].velocityX)
					resultForwardVector.z *= Math.abs(scope.players[id].velocityZ)
					resultForwardVector.y *= Math.abs(scope.players[id].velocityY)
					
					
					player.translate(resultForwardVector, 0.2, BABYLON.Space.WORLD);
				}
			// If the player isn't grounded, just apply a weak force in the direction they want to go in while in mid-air
			} else {
				resultForwardVector = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), BABYLON.Vector3.TransformCoordinates(directionVector, lookDirectionMatrix));
				player.physicsImpostor.applyForce(resultForwardVector.scale(20000), player.position);
			}
			
		}
		
		
		// If the player jumps without any x or z direction buttons pressed down this function is called
		function jump(scope){
			scope.players[id].lastJump = elapsedTime;
			player.locallyTranslate(BABYLON.Vector3.Up().scale(0.05)) 
			player.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 800, 0), player.position);
		}
		
		// if the player isn't moving, set velocity to 0
		if (!(movement.fwd || movement.bck || movement.lft || movement.rht || movement.fwdlft || movement.fwdrht || movement.bcklft || movement.bckrht)){
			this.players[id].velocityX = 0;
			this.players[id].velocityZ = 0;
			this.players[id].velocityY = 0;
			
			// My attempt at deceleration
			// if (this.players[id].velocityX < 0){
				// this.players[id].velocityX += movementAcceleration;
				// if (this.players[id].velocityX > 0){
					// this.players[id].velocityX = 0;
				// }
			// } else {
				// this.players[id].velocityX -= movementAcceleration;
				// if (this.players[id].velocityX < 0){
					// this.players[id].velocityX = 0;
				// }
			// }
			
			// if (this.players[id].velocityZ < 0){
				// this.players[id].velocityZ += movementAcceleration;
				// if (this.players[id].velocityZ > 0){
					// this.players[id].velocityZ = 0;
				// }
			// } else {
				// this.players[id].velocityZ -= movementAcceleration;
				// if (this.players[id].velocityZ < 0){
					// this.players[id].velocityZ = 0;
				// }
			// }
		}
		if (movement.moving){
			if(movement.fwd){
				applyMovementVector(movementVectorRight, this);
				return;
			}
			if(movement.bck){
				applyMovementVector(movementVectorLeft, this);
				return;
			}
			if(movement.lft){
				applyMovementVector(movementVectorForward, this);
				return;
			}
			if(movement.rht){
				applyMovementVector(movementVectorBackward, this);
				return;
			}
			if(movement.fwdlft){
				applyMovementVector(movementVectorForwardRight, this);
				return;
			}
			if(movement.fwdrht){
				applyMovementVector(movementVectorBackRight, this);
				return;
			}
			if(movement.bcklft){
				applyMovementVector(movementVectorForwardLeft, this);
				return;
			}
			if(movement.bckrht){
				applyMovementVector(movementVectorBackLeft, this);
				return;
			}
			
			if(movement.jump && grounded && elapsedTime > jumpCooldown + this.players[id].lastJump){
				jump(this);
				return;
			}
		} else {
			// do some idle thingy
		}
  }
}
schema.defineTypes(State, {
  players:{map:Player}
})
var patchRate = 1000/64
exports.BasicRoom = class extends colyseus.Room {
	
	// On room creation
  onCreate (options) {
    console.log("Room created!", options);
    this.setState(new State());
    this.setMetadata({tag:"something"});
    this.setSimulationInterval(() => {
			this.update();
    })
    this.setPatchRate(15);
		initSimpleLevel();
  }
	
	// Update the scene
  update(){
    scene.render();
    for (let id in this.state.players){
			// update player position
			this.state.players[id].y = scene.getMeshByID(id).position.y;
			this.state.players[id].x = scene.getMeshByID(id).position.x;
			this.state.players[id].z = scene.getMeshByID(id).position.z;
			
			// update player rotation, no z or x axis because players don't rotate in those axes (yet)
			this.state.players[id].ry = scene.getMeshByID(id).rotationQuaternion.y;
			this.state.players[id].rw = scene.getMeshByID(id).rotationQuaternion.w;
			
			// If player goes belwo y20, teleport them back to the center of the map
			if (this.state.players[id].y < -20){
				scene.getMeshByID(id).position.y = 5;
				scene.getMeshByID(id).position.x = 0;
				scene.getMeshByID(id).position.z = 0;
			}
			
			// disable player physics rotation on all axes
			scene.getMeshByID(id).physicsImpostor.executeNativeFunction(function(world, body){
				body.setAngularFactor(0,0,0);
			})
			scene.getMeshByID(id).physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0,0,0));
			
    }
  }
	
	// On player join
  onJoin (client, options) {
    this.state.createPlayer(client.sessionId)
		console.log("Client id", client.sessionId, "joined the room!");
  }
	
	// On player leave
  onLeave (client, consented) {
		scene.getMeshByID(client.sessionId).dispose();
    this.state.removePlayer(client.sessionId);
		console.log("Client id", client.sessionId, "left the room!");
  }
	
	// On client message
  onMessage (client, data) {
		// This is for debugging, triggers whenever f is pressed by the client
    if(data.getScene){
    }
		
		// handle player movement with the movePLayer function
    this.state.movePlayer(client.sessionId, data, this.clock.elapsedTime, this.clock);	
  }

  onDispose() {
  }

}
