
Hey :D
This is my simple multiplayer first-person "game" demo made using Javascript. I call it a "game" because currently there are no objectives for players. So it's not really a game. But what else would I call it?

[Here's a live demo that may or may not be online. Press the tiny "Start the game" button!](http://babylon-multiplayer-game-demo.azurewebsites.net)

![Here it is in action!](https://im2.ezgif.com/tmp/ezgif-2-2d51c6bd30c6.gif)

## :crossed_swords: Usage

 1. Clone this repository and install way too many dependencies using `npm install`
 2. Run the game server using `npm start`
 3. Go to localhost:2567, press "Start the game"

WASD - movement

Spacebar - jump

G - change camera type

There are two cameras: orbit and first-person. The orbit camera allows for dragging the mouse around to orbit a single point, and the first-person camera gives an FPS style cursor lock camera.

## Structure

- `index.js`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `BasicRoom.js`: room handler which handles game logic and communication with clients
- `loadtest/example.js`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `node start.js`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
