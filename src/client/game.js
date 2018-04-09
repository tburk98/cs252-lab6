var socket = io();

var lastdir, currdir;

var changeDirection = {
	direction: "",
	time: Date.now()
}

var delta, lastFrameTimeMs, velocity;
velocity = .25;

var players = {};

var player = {
	x: 60,
	y: 20
}

socket.on('state', function(newplayers) {
	player = newplayers[socket.id];
	players = newplayers;
})

socket.emit('new player');

var canvas = document.getElementById('canvas');

canvas.width = 400;
canvas.height = 400;

document.addEventListener('keydown', function(event) {
	lastdir = currdir;
	switch(event.keyCode) {
		case 65: // A
	      if(currdir != "r") {
 		    currdir = "l";
	      }
	      break;
	    case 87: // W
	      if(currdir != "d") {
 		    currdir = "u";
	      }
	      break;
	    case 68: // D
	      if(currdir != "l") {
 		    currdir = "r";
	      }
	      break;
	    case 83: // S
	      if(currdir != "u") {
 		    currdir = "d";
	      }
	      break;
	}

	if(lastdir != currdir && 
		(event.keyCode == 65 ||
		 event.keyCode == 87 ||
		 event.keyCode == 68 ||
		 event.keyCode == 83 )) {
		changeDirection.time = Date.now();
		changeDirection.direction = currdir;
		socket.emit('direction', changeDirection);
	}
})

function update(delta) {
	if(currdir == "l") {
		player.x -= velocity * delta;
	}
	else if(currdir == "r") {
		player.x += velocity * delta;
	}
	else if(currdir == "u") {
		player.y -= velocity * delta;
	}
	else if(currdir == "d") {
		player.y += velocity * delta;
	}
}

function draw() {

	var context = canvas.getContext('2d');
	context.beginPath();
	context.fillStyle = 'green';
	context.rect(0,0,400,400);
	context.fill();

	for (var id in players) {

		context.beginPath();
		context.fillStyle = 'red';
		context.rect(players[id].x, players[id].y, 20,20);
		context.fill();
	}

	context.beginPath();
	context.fillStyle = 'red';
	context.rect(player.x, player.y, 20,20);
	context.fill();
}

function gameLoop(timestamp) {

	delta = timestamp - lastFrameTimeMs;
    lastFrameTimeMs = timestamp;

    update(delta);

    draw();

	window.requestAnimationFrame(gameLoop);
}

gameLoop();


