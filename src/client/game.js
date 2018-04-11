var socket = io({transports: ['websocket'], upgrade: false});

var config = {
    apiKey: "AIzaSyAiDkGOGaAkRTTYameiQFJUNMjdOS6ONNc",
    authDomain: "cs252-lab6-2018.firebaseapp.com",
    databaseURL: "https://cs252-lab6-2018.firebaseio.com",
    projectId: "cs252-lab6-2018",
    storageBucket: "cs252-lab6-2018.appspot.com",
    messagingSenderId: "8737404167"
  };
firebase.initializeApp(config);

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

var img = new Image();
img.src = 'https://mdn.mozillademos.org/files/222/Canvas_createpattern.png';

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

	context.setTransform(1,0,0,1,-(player.x-400/2),-(player.y-400/2));
	var grd=context.createLinearGradient(0,0,400,0);
	grd.addColorStop(0,"blue");
	grd.addColorStop(1,"white");

	var pat=context.createPattern(img,"repeat");

	context.fillStyle = pat;
	context.fillRect(0,0,1000, 1000);
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
	context.translate(player.x - 200, player.y - 200);

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


