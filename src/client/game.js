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
var scale = 1;

var player = {
	x: 60,
	y: 20
}
var camera = {
	x: player.x,
	y: player.y
}

var trails = [];

var img = new Image();
img.src = 'https://d1yn1kh78jj1rr.cloudfront.net/image/preview/rDtN98Qoishumwih/mintandgraypaper-13-091815-810_SB_PM.jpg';

socket.on('state', function(newplayers) {
	//player = newplayers[socket.id];
	players = newplayers;
})

socket.on('disconnect', function(id) {
	delete players[id];
})

socket.emit('new player');

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d'); 

canvas.width = 600;
canvas.height = 600;

var lineStart = {
	x: player.x + 10,
	y: player.y + 10
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
		drawLine(player.x + 10, player.y + 10);
	}
})

function drawLine(x, y) {

	var line = {
		x1: lineStart.x, 
		y1: lineStart.y, 
		x2: x,
		y2: y
	}
	trails.push(line);

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

	for(var i = 0; i < trails.length - 2; i++) {
		var trail = trails[i];
		if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
			if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
				velocity = 0;
				console.log("COLLISION");
			}
		}
	}
}

function draw() {


	camera.x = clamp((player.x-canvas.width/(2*scale)), 0, 1000 - (canvas.width / scale));
	camera.y = clamp((player.y-canvas.height/(2*scale)), 0, 1000 - (canvas.height / scale));

	context.setTransform(1,0,0,1,-camera.x * scale, -camera.y * scale);
	
	context.scale(scale, scale);
	var pat=context.createPattern(img,"repeat");

	context.fillStyle = pat;
	context.fillRect(camera.x,camera.y,canvas.width, canvas.height);
	context.fill();

	context.beginPath();
	for(var i = 0; i < trails.length; i++) {
		var trail = trails[i];
		if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
			context.moveTo(trail.x1, trail.y1);
			context.lineTo(trail.x2, trail.y2);
		}
	}
	context.moveTo(lineStart.x, lineStart.y);
	context.lineTo(player.x + 10, player.y + 10);
	context.stroke();

	context.fillStyle = 'red';
	context.fillRect(player.x, player.y, 20,20);

	context.translate(camera.x, camera.y);

}

function gameLoop(timestamp) {

	delta = timestamp - lastFrameTimeMs;
    lastFrameTimeMs = timestamp;

    update(delta);
    
    draw();

	window.requestAnimationFrame(gameLoop);
}

gameLoop();


function clamp(value, min, max) { 
  if (value < min) { 
    return min; 
  } 
  if (value > max) { 
    return max; 
  } 
  return value; 
} 


function inView(x, y) {
	if( x > camera.x && 
		x < camera.x + canvas.width &&
		y > camera.y &&
		y < camera.y + canvas.height
	) {
		return true;
	}
	else {
		return false;
	}
}

/*
 *Uses algorithm of line intersection of Wikipedia
 *https://en.wikipedia.org/wiki/Line–line_intersection
 */
function isColliding(x1, y1, x2, y2) {
	var x3 = player.x;
	var x4 = player.x + 20;
	var y3 = player.y;
	var y4 = player.y + 20;

	var u = ( ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	var t = ( ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	if(u >= 0 && u <= 1 && t >= 0 && t <= 1) {
		return true;
	}
	else  {
		return false;
	}
}




