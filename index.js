const path = require('path')
const http = require('http');
const express = require('express');
const cors = require('cors');
const colyseus = require('colyseus');
const monitor = require("@colyseus/monitor").monitor;
var ip = require("ip");
// const socialRoutes = require("@colyseus/social/express").default;
global.XMLHttpRequest = require('xhr2').XMLHttpRequest;

const BasicRoom = require('./BasicRoom').BasicRoom;

const port = process.env.PORT || 2567;
const app = express()

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new colyseus.Server({
  server: server,
});

app.use('/', express.static(path.join(__dirname, "client")));

// register your room handlers
gameServer.define('my_room', BasicRoom);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/authentication/)
 * - also uncomment the require statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Game server started. Go to http://localhost:${ port } on this machine or http://` + ip.address() + `:${ port } on a different machine to try the demo.`);
