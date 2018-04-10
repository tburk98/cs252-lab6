var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);
require('dotenv').config();

const PORT = process.env.PORT || 4321;

var delta, velocity, lastFrame;
velocity = .15;

app.set('port', PORT);
app.use('/client', express.static(__dirname + '/client'));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '/client/index.html'));
});

server.listen(PORT, function() {
	console.log('Server has begun on port' + PORT);
});

var players = {};

io.on('connection', function(socket) {
	socket.on('new player', function() {
		players[socket.id] = {
			x: 40 * (Object.keys(players).length + 1),
			y: 100,
			direction: ""
		}
		io.sockets.emit('connect', players);
		console.log('new player connected');
		console.log(players);
	});
	socket.on('direction', function(data) {
		var player = players[socket.id] || {};
		player.direction = data.direction;
	})
	socket.on('disconnect', function () {
	    io.emit('user disconnected');
	    io.sockets.emit('disconnect', socket.id);
	    delete players[socket.id];
	});
});

function update(delta) {
	for (var id in players) {
		var player = players[id];
		if(player.direction == "l") {
			player.x -= velocity * delta;
		}
		else if(player.direction == "r") {
			player.x += velocity * delta;
		}
		else if(player.direction == "u") {
			player.y -= velocity * delta;
		}
		else if(player.direction == "d") {
			player.y += velocity * delta;
		}
	}
}

function gameLoop() {

	delta = Date.now() - lastFrame;
    lastFrame = Date.now();

    update(delta);
}

setInterval(function() {
	gameLoop();
	io.sockets.emit('state', players);
}, 1000/30);
