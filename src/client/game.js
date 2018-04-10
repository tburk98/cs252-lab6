var socket = io({transports: ['websocket'], upgrade: false});

var lastdir, currdir;

var changeDirection = {
	direction: "",
	time: Date.now()
}

var delta, lastFrameTimeMs, velocity;
velocity = .15;

var players = {};

var player = {
	x: 60,
	y: 20
}

socket.on('state', function(newplayers) {
	//player = newplayers[socket.id];
	players = newplayers;
})

socket.on('disconnect', function(id) {
	delete players[id];
})

socket.emit('new player');

var canvas = document.getElementById('canvas');

canvas.width = 400;
canvas.height = 400;

var lineStart = {
	x: player.x,
	y: player.y
}

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
		drawLine(player.x, player.y);
	}
})

function drawLine(x, y) {
	var context = canvas.getContext('2d');
	context.beginPath();
	context.moveTo(lineStart.x + 10, lineStart.y);
	context.lineTo(x + 10, y);
	context.stroke();
	lineStart.x = x;
	lineStart.y = y;
}

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

	context.fillStyle = 'green';
	context.rect(player.x - 3, player.y - 3, 26, 26);
	context.fill();

	/*for (var id in players) {

		context.beginPath();
		context.fillStyle = 'red';
		context.rect(players[id].x, players[id].y, 20,20);
		context.fill();
	}*/

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

var context = canvas.getContext('2d');

context.fillStyle = 'green';
context.fillRect(0,0,400,400);

gameLoop();


