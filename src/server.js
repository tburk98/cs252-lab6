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
var room = "";
velocity = .15;

app.set('port', PORT);
app.use('/', express.static(__dirname + '/client/'));
app.use('/join', express.static(__dirname + '/client/join'));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '/client/index.html'));
});

app.get('/game/:id', function(request, response) {
	response.sendFile(path.join(__dirname, '/client/game/index.html'));
	room = request.url.split("/")[2];

});

server.listen(PORT, function() {
	console.log('Server has begun on port ' + PORT);
});

var players = {};
var sentplayers = {};
var trails = [];
var maxplayers = 2;
var deadplayers = 0;
var lines = {};
var offset = 150;

io.on('connection', function(socket) {
	socket.join(room);
	socket.emit('socketID', socket.id);

	socket.on('new player', function() {


		players[socket.id] = {
			x: offset * (Object.keys(players).length + 1),
			y: 100,
			velocity: .15,
			direction: ""
		}

		sentplayers[socket.id] = {
			x: offset * (Object.keys(players).length + 1),
			y: 100,
			h: Math.floor(Math.random() * 6), 
			i: 2
		}

		lines[socket.id] = {
			x: players[socket.id].x + 15,
			y: players[socket.id].y + 15,
		}
		io.sockets.in(room).emit('newconnect', sentplayers);
		console.log('new player connected');
		console.log(players);

		if(Object.keys(players).length == maxplayers) {
			io.sockets.in(room).emit('ready');
			var timeleft = 3;
			var downloadTimer = setInterval(function(){
			  timeleft--;
			  if(timeleft <= 0) {
			  	io.sockets.in(room).emit('start');
			    clearInterval(downloadTimer);
			  }
			},1000);
		}
	});

	socket.on('direction', function(data) {
		var player = players[socket.id] || {};
		player.direction = data.direction;
		if(lines[socket.id] != "undefined") {
			var line = {
				x1: lines[socket.id].x,
				y1: lines[socket.id].y,
				x2: player.x + 15,
				y2: player.y + 15,
			}
			trails.push(line);
			line.x1 += offset;
			line.x2 += offset;

			line.id = socket.id;
			lines[socket.id].x = players[socket.id].x + 15;
			lines[socket.id].y = players[socket.id].y + 15;
			socket.broadcast.to(room).emit('trail', line);
		}
	});

	socket.on('disconnect', function () {
	    io.in(room).emit('user disconnected');
	    io.sockets.in(room).emit('disconnect', socket.id);
	    delete players[socket.id];
	    delete sentplayers[socket.id];
	});

	socket.on('collision', function() {
		players[socket.id].velocity = 0;
		deadplayers++;
		if(deadplayers + 1 == maxplayers) {
			io.sockets.in(room).emit('gameover');
			for(var id in players) {
				delete players[id];
	    		delete sentplayers[id];
	    		delete lines[id];
	    		trails = [];
			}
		}
	});
});

function update(delta) {
	for (var id in players) {
		var player = players[id];
		var sentplayer = sentplayers[id];
		if(player.direction == "l") {
			player.x -= player.velocity * delta;
			sentplayer.x -= player.velocity * delta;
			sentplayer.i = 3;
		}
		else if(player.direction == "r") {
			player.x += player.velocity * delta;
			sentplayer.x += player.velocity * delta;
			sentplayer.i = 1; 
		}
		else if(player.direction == "u") {
			player.y -= player.velocity * delta;
			sentplayer.y -= player.velocity * delta;
			sentplayer.i = 0;
		}
		else if(player.direction == "d") {
			player.y += player.velocity * delta;
			sentplayer.y += player.velocity * delta;
			sentplayer.i = 2;
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
	io.sockets.in(room).emit('state', sentplayers);
}, 1000/15);



