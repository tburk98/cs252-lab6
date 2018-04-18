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
var targets = {};
var lineStarts = {};
var scale = 1;

var player = {
	id: 0,
	x: 0,
	y: 0,
	velocity: .15,
	i: 2
}
var camera = {
	x: player.x,
	y: player.y
}

var trails = [];
var othertrails = [];
var currtrails = {};
var drawTrail = false;

var img = new Image();
img.src = 'https://d1yn1kh78jj1rr.cloudfront.net/image/preview/rDtN98Qoishumwih/mintandgraypaper-13-091815-810_SB_PM.jpg';
var snail = new Image();
snail.src = '../assets/default-snail.png';

socket.on('state', function(newplayers) {
	
	if(newplayers != "undefined") {
		for(var id in newplayers) {
			if(id != player.id) {
				targets[id].x = newplayers[id].x;
				targets[id].y = newplayers[id].y;
			}
		}
	}
})

socket.on('trail', function(trail) {
	var line = {
		x1: trail.x1,
		y1: trail.y1,
		x2: trail.x2,
		y2: trail.y2
	}
	othertrails.push(trail);
	if(trail.id != player.id) {
		lineStarts[trail.id].x = trail.x2;
		lineStarts[trail.id].y = trail.y2;
	}
})

socket.on('socketID', function(id) {
	console.log(id);
	player.id = id;
})

socket.on('newconnect', function(newplayers) {
	console.log(newplayers);
	for(var id in newplayers) {
		if(id != player.id) {
			players[id] = newplayers[id];
			players[id].i = 2;
			targets[id] = {x:0,y:0};
			currtrails[id] = {x1:0,y1:0,x2:0,y2:0};
			lineStarts[id] = {
				x: players[id].x,
				y: players[id].y
			}
		}
		else {
			if(player.x == 0 && player.y == 0) {
				player.x = newplayers[id].x;
				player.y = newplayers[id].y;
				lineStart.x = player.x + 10;
				lineStart.y = player.y + 10;
				drawTrail = true;
			}
		}
	}

	console.log(players);
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
		drawLine(player.x + 16, player.y + 16);
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


	for(var id in players) {
		if(targets[id].x != 0 && targets[id].y != 0) {
			if(targets[id].x > players[id].x+1) {
				players[id].x += velocity * delta;
				players[id].i = 1;
			}
			else if(targets[id].x < players[id].x-1) {
				players[id].x -= velocity * delta;
				players[id].i = 3;
			}

			if(targets[id].y > players[id].y+1) {
				players[id].y += velocity * delta;
				players[id].i = 2;
			}
			else if(targets[id].y < players[id].y-1) {
				players[id].y -= velocity * delta;
				players[id].i =  0;
			}
		}
	}

	if(currdir == "l") {
		player.x -= player.velocity * delta;
		player.i = 3;
	}
	else if(currdir == "r") {
		player.x += player.velocity * delta;
		player.i = 1;
	}
	else if(currdir == "u") {
		player.y -= player.velocity * delta;
		player.i = 0;
	}
	else if(currdir == "d") {
		player.y += player.velocity * delta;
		player.i = 2;
	}

	if(player.velocity > 0) {
		for(var i = 0; i < trails.length - 2; i++) {
			var trail = trails[i];
			//if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
				if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
					player.velocity = 0;
					//console.log("COLLISION");
					console.log('COLLISION');
					socket.emit('collision');
				}
			//}
		}

		for(var i = 0; i < othertrails.length; i++) {
			var trail = othertrails[i];
			//if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
				if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
					player.velocity = 0;
					console.log('COLLISION');
					socket.emit('collision');

				}
			//}
		}

		//console.log(currtrails);
		for(var i in currtrails) {
			var trail = currtrails[i];
			//if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
				if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
					player.velocity = 0;
					console.log('COLLISION');
					socket.emit('collision');

				}
			//}
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
	context.lineWidth = 15;
	for(var i = 0; i < trails.length; i++) {
		var trail = trails[i];
		//if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
			context.moveTo(trail.x1, trail.y1);
			context.lineTo(trail.x2, trail.y2);
		//}
	}
	context.moveTo(lineStart.x, lineStart.y);
	context.lineTo(player.x + 16, player.y + 16);
	context.stroke();

	context.beginPath();
	for(var i = 0; i < othertrails.length; i++) {
		var trail = othertrails[i];
		//if(inView(trail.x1, trail.y1) || inView(trail.x2, trail.y2)) {
			context.moveTo(trail.x1, trail.y1);
			context.lineTo(trail.x2, trail.y2);
		//}
	}
	context.stroke();

	//context.fillStyle = 'red';
	//context.fillRect(player.x, player.y, 30,30);

	context.drawImage(snail,player.i * 32,0,32,32,player.x,player.y,32,32);

	for(var id in players) {
		context.beginPath();
		context.moveTo(lineStarts[id].x, lineStarts[id].y);
		context.lineTo(players[id].x + 10, players[id].y + 10);
		currtrails[id] = {
			x1:lineStarts[id].x,
			y1:lineStarts[id].y,
			x2:players[id].x + 16,
			y2:players[id].y + 16
		}
		context.stroke();
		context.drawImage(snail,players[id].i * 32,0,32,32,players[id].x,players[id].y,32,32);
	}


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
	var x3 = player.x - 5;
	var x4 = player.x + 25;
	var y3 = player.y - 5;
	var y4 = player.y + 25;

	var u = ( ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	var t = ( ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	if(u >= 0 && u <= 1 && t >= 0 && t <= 1) {
		return true;
	}
	else  {
		return false;
	}
}



