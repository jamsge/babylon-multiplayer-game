import {init, client} from './game.js'
var startGame = document.getElementById('start-game');
var gameUI = document.getElementById('game-elements');
var menuUI = document.getElementById('menu-elements');
var render = document.getElementById('render');
console.log(client);
console.log(client.getAvailableRooms());
startGame.onclick = function(){
	init();
	gameUI.style.display = "block";
	menuUI.style.display = "none";
	render.style.display = "block";
}