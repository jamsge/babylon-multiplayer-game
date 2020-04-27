
Hey :D
This is my simple multiplayer first-person "game" demo made using Javascript. I call it a "game" because currently there are no objectives for players. So it's not really a game. But what else would I call it?

## :crossed_swords: Usage

 1. Clone this repository and install way too many dependencies using `npm install`
 2. Run the game server using `npm start`
 3. Go to localhost:2567
 4. :)

## Structure

- `index.js`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `BasicRoom.js`: room handler which handles game logic and communication with clients
- `loadtest/example.js`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `node start.js`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.


## License

should probably do this
