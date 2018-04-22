var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

const memwatch = require('memwatch-next');
//var game = require('./client/game/gameFunctions.js');
var firebase = require("firebase/app")
require("firebase/database");
var config = {
    apiKey: "AIzaSyAiDkGOGaAkRTTYameiQFJUNMjdOS6ONNc",
    authDomain: "cs252-lab6-2018.firebaseapp.com",
    databaseURL: "https://cs252-lab6-2018.firebaseio.com",
    projectId: "cs252-lab6-2018",
    storageBucket: "cs252-lab6-2018.appspot.com",
    messagingSenderId: "8737404167"
  };
firebase.initializeApp(config);

function removePlayer(gameID, socketID) {
    firebase.database().ref('games/' + gameID + '/players/' + socketID).remove()
}

function closeGame (gameID) {
    firebase.database().ref('games/' + gameID).update({
        isOpen: false,
    });
}

function openGame (gameID) {

    firebase.database().ref('games/' + gameID).update({
        isOpen: true,
    });
    firebase.database().ref('games/' + gameID + '/players').remove()
}

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

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:\n', info);
});

var games = {}
var offset = 150;

io.on('connection', function(socket) {
	socket.join(room);
	if(games[room] == null) {
		games[room] = {
			players : {},
			sentplayers : {},
			trails : [],
			maxplayers : 2,
			deadplayers : 0,
			lines : {}
		}
	}
	var game = {
		id: socket.id,
		gameID: room
	}
	socket.emit('socketID', game);

	socket.on('new player', async function(data) {


		games[room].players[socket.id] = {
			id: data,
			x: offset * (Object.keys(games[room].players).length + 1),
			y: 100,
			velocity: .15,
			direction: ""
		}

		games[room].sentplayers[socket.id] = {
			x: offset * (Object.keys(games[room].players).length + 1),
			y: 100,
			h: Math.floor(Math.random() * 6), 
			i: 2
		}

		games[room].lines[socket.id] = {
			x: games[room].players[socket.id].x + 15,
			y: games[room].players[socket.id].y + 15,
		}
		await io.sockets.in(room).emit('newconnect', games[room].sentplayers);
		console.log('new player connected');
		console.log(games[room].players);

		if(Object.keys(games[room].players).length == games[room].maxplayers) {
			closeGame(room);
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
		if(games[room] != null) {
			var player = games[room].players[socket.id] || {};
			player.direction = data.direction;
			var line = {
				x1: games[room].lines[socket.id].x,
				y1: games[room].lines[socket.id].y,
				x2: player.x + 15,
				y2: player.y + 15,
			}
			//games[room].trails.push(line);
			line.x1 += offset;
			line.x2 += offset;

			line.id = socket.id;
			games[room].lines[socket.id].x = games[room].players[socket.id].x + 15;
			games[room].lines[socket.id].y = games[room].players[socket.id].y + 15;
			socket.broadcast.to(room).emit('trail', line);
		}
	});

	socket.on('disconnect', function () {
	    io.in(room).emit('user disconnected');
	    io.sockets.in(room).emit('disconnect', socket.id);
	    if(games[room] != null) {
	    	if(games[room].players[socket.id] != undefined) {
	    		removePlayer(room, games[room].players[socket.id].id);
	    	}
	    	delete games[room].players[socket.id];
	    	delete games[room].sentplayers[socket.id];
		}
	});

	socket.on('collision', function() {
		if(games[room].players != null) {
			games[room].players[socket.id].velocity = 0;
			games[room].deadplayers++;
		}
		if(games[room].deadplayers + 1 == games[room].maxplayers) {
			io.sockets.in(room).emit('gameover');
			openGame(room);
			for(var id in games[room].players) {
				if(games[room] != null) {
					delete games[room];
	    		}
			}
		}
	});
});

function update(delta) {
	if(games[room] != null) {
		for (var id in games[room].players) {
			var player = games[room].players[id];
			var sentplayer = games[room].sentplayers[id];
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
}


function gameLoop() {

	delta = Date.now() - lastFrame;
    lastFrame = Date.now();

    update(delta);
}

setInterval(function() {
	gameLoop();
	if(games[room] != null) {
		io.sockets.in(room).emit('state', games[room].sentplayers);
	}
}, 1000/15);



