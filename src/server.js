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
app.use('/', express.static(__dirname + '/client/'));
app.use('/game', express.static(__dirname + '/client/game'));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '/client/index.html'));
});

app.get('/game', function(request, response) {
	response.sendFile(path.join(__dirname, '/game/index.html'));
});

server.listen(PORT, function() {
	console.log('Server has begun on port ' + PORT);
});

var players = {};
var sentplayers = {};
var trails = [];
var lines = {};

io.on('connection', function(socket) {
	socket.emit('socketID', socket.id);

	socket.on('new player', function() {

		players[socket.id] = {
			x: 40 * (Object.keys(players).length + 1),
			y: 100,
			velocity: .15,
			direction: ""
		}

		sentplayers[socket.id] = {
			x: 40 * (Object.keys(players).length + 1),
			y: 100,
		}

		lines[socket.id] = {
			x: players[socket.id].x + 10,
			y: players[socket.id].y + 10,
		}
		io.sockets.emit('newconnect', sentplayers);
		console.log('new player connected');
		console.log(players);
	});

	socket.on('direction', function(data) {
		var player = players[socket.id] || {};
		player.direction = data.direction;
		var line = {
			x1: lines[socket.id].x,
			y1: lines[socket.id].y,
			x2: player.x + 10,
			y2: player.y + 10,
		}
		trails.push(line);
		line.x1 += 40;
		line.x2 += 40;

		line.id = socket.id;
		lines[socket.id].x = players[socket.id].x + 10;
		lines[socket.id].y = players[socket.id].y + 10;
		socket.broadcast.emit('trail', line);
	});

	socket.on('disconnect', function () {
	    io.emit('user disconnected');
	    io.sockets.emit('disconnect', socket.id);
	    delete players[socket.id];
	    delete sentplayers[socket.id];
	});

	socket.on('collision', function() {
		players[socket.id].velocity = 0;
		console.log('COLLISION');
	});
});

function update(delta) {
	for (var id in players) {
		var player = players[id];
		var sentplayer = sentplayers[id];
		if(player.direction == "l") {
			player.x -= player.velocity * delta;
			sentplayer.x -= player.velocity * delta;
		}
		else if(player.direction == "r") {
			player.x += player.velocity * delta;
			sentplayer.x += player.velocity * delta;
		}
		else if(player.direction == "u") {
			player.y -= player.velocity * delta;
			sentplayer.y -= player.velocity * delta;
		}
		else if(player.direction == "d") {
			player.y += player.velocity * delta;
			sentplayer.y += player.velocity * delta;
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
	io.sockets.emit('state', sentplayers);
}, 1000/20);
