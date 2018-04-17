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
var trails = [];

io.on('connection', function(socket) {
	socket.on('new player', function() {
		players[socket.id] = {
			x: 40 * (Object.keys(players).length + 1),
			y: 100,
			velocity: velocity,
			direction: ""
		}
		var data = {
			players: players,
			trails: trails
		}
		socket.emit('id', socket.id);
		io.sockets.emit('new player', data);
		console.log('new player connected');
		console.log(players);
	});
	socket.on('direction', function(data) {
		var player = players[socket.id] || {};
		player.direction = data.direction;
		trails.push(data.trail);
		socket.broadcast.emit('trail', data.trail);
	})
	socket.on('disconnect', function () {
	    io.emit('user disconnected');
	    io.sockets.emit('disconnect', socket.id);
	    delete players[socket.id];
	    if(Object.keys(players).length == 0) {
	    	trails = [];
	    }
	});

});

function update(delta) {
	for (var id in players) {
		var player = players[id];
		if(player.direction == "l") {
			player.x -= player.velocity * delta;
		}
		else if(player.direction == "r") {
			player.x += player.velocity * delta;
		}
		else if(player.direction == "u") {
			player.y -= player.velocity * delta;
		}
		else if(player.direction == "d") {
			player.y += player.velocity * delta;
		}

		for(var i = 0; i < trails.length - 2; i++) {
			var trail = trails[i];
			if(isColliding(id, trail.x1, trail.y1, trail.x2, trail.y2)) {
				player.velocity = 0;
				io.sockets.emit('collision', id);
			}
		}
	}
}


/*
 *Uses algorithm of line intersection of Wikipedia
 *https://en.wikipedia.org/wiki/Line–line_intersection
 */
function isColliding(id, x1, y1, x2, y2) {
	var x3 = players[id].x;
	var x4 = players[id].x + 20;
	var y3 = players[id].y;
	var y4 = players[id].y + 20;

	var u = ( ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	var t = ( ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	if(u >= 0 && u <= 1 && t >= 0 && t <= 1) {
		return true;
	}
	else  {
		return false;
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
}, 1000/60);



