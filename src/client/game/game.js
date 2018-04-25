var socket = io({transports: ['websocket'], upgrade: false});
login();

var lastdir, currdir;

var changeDirection = {
	direction: "",
	time: Date.now()
}

var delta, lastFrameTimeMs, velocity, gameID;
velocity = .15;

var players = {};
var targets = {};
var lineStarts = {};
var scale = 1;

var player = {
	id: 0,
	x: 0,
	y: 0,
	velocity: 0,
	i: 2,
	h: 0,
	xoff: 0,
	yoff: 0
}
var camera = {
	x: player.x,
	y: player.y
}

var target = {x:0,y:0};

var trails = [];
var othertrails = [];
var trailColors = ["white", "blue", "red", "purple", "yellow", "green"];
var currtrails = {};
var inputDisabled = true;
var gameDisabled = false;
var timeleft = 4;
var gameOver = "";

var img = [];
var bg = new Image();
bg.src = "../assets/NORT Background.jpg";
var snail = new Image();
for(var i = 1; i < 7; i++) {
	img[i-1] = new Image();
	img[i-1].src = "../assets/default-snail" + i + ".png";
}

socket.on('state', function(newplayers) {
	
	if(newplayers != "undefined") {
		for(var id in newplayers) {
			if(id != player.id) {
				targets[id].x = newplayers[id].x;
				targets[id].y = newplayers[id].y;
				players[id].i = newplayers[id].i;
			}
			else {
				target.x = newplayers[id].x;
				target.y = newplayers[id].y;
			}
		}
	}
})

socket.on('trail', function(trail) {


	if(trail.id != player.id) {
		lineStarts[trail.id].x = trail.x2;
		lineStarts[trail.id].y = trail.y2;
		othertrails.push(trail);
	}
	else {
		trails.push(trail);
		lineStart.x = trail.x2;
		lineStart.y = trail.y2;
	}
})

socket.on('socketID', async function(game) {
	console.log(game);
	player.id = game.id;
	gameID = game.gameID;
	
	await joinGame(gameID).catch((err) => {
        console.log("JOIN GAME ERROR: " + err);
        alert(err);
        window.location.href = "../join";
    });
    
	console.log("joined game");

	var data = {
		id: getID(),
		username: "player"
	}

	await getUsername().then((name) => {
		console.log(name);
		data.username = name;
		console.log("username " + data.username);

    	socket.emit('new player', data);
	});
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
				player.h = newplayers[id].h;
				lineStart.x = player.x + 15;
				lineStart.y = player.y + 15;
				drawTrail = true;
			}
		}
	}

	console.log(players);
})

socket.on('disconnect', function(id) {
	delete players[id];
})

socket.on('ready', function() {
	timeleft--;
	var downloadTimer = setInterval(function(){
	  timeleft--;
	  if(timeleft <= -1) {
	    clearInterval(downloadTimer);
	  }
	},1000);
})

socket.on('start', function() {
	inputDisabled = false;
	player.velocity = .15;
})

socket.on('gameover', function(winner) {
	gameOver = "Game Over!\n" + winner + " wins!";
	player.velocity = 0;
	inputDisabled = true;
})

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d'); 

canvas.width = 600;
canvas.height = 600;

var lineStart = {
	x: player.x + 15,
	y: player.y + 15
}

document.addEventListener('keydown', function(event) {
	
	if(!inputDisabled) {
		lastdir = currdir;
		switch(event.keyCode) {
			case 65: // A
		      if(currdir != "r") {
	 		    currdir = "l";
	 		    player.i = 3;
		      }
		      break;
		    case 87: // W
		      if(currdir != "d") {
	 		    currdir = "u";
	 		    player.i = 0;
		      }
		      break;
		    case 68: // D
		      if(currdir != "l") {
	 		    currdir = "r";
	 		    player.i = 1;
		      }
		      break;
		    case 83: // S
		      if(currdir != "u") {
	 		    currdir = "d";
	 		    player.i = 2;
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
			//drawLine(player.x + 15, player.y + 15);
		}
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
			}
			else if(targets[id].x < players[id].x-1) {
				players[id].x -= velocity * delta;
			}

			if(targets[id].y > players[id].y+1) {
				players[id].y += velocity * delta;
			}
			else if(targets[id].y < players[id].y-1) {
				players[id].y -= velocity * delta;

			}
		}
	}

	if(target.x != 0 && target.y != 0) {
		if(target.x > player.x+10) {
			player.x += velocity * delta;
		}
		else if(target.x < player.x-10) {
			player.x -= velocity * delta;
		}

		if(target.y > player.y+10) {
			player.y += velocity * delta;
		}
		else if(target.y < player.y-10) {
			player.y -= velocity * delta;

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
			if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
				player.velocity = 0;
				console.log('COLLISION');
				socket.emit('collision', player.id);
			}
		}

		
		for(var i = 0; i < othertrails.length; i++) {
			var trail = othertrails[i];
			if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
				player.velocity = 0;
				console.log('COLLISION');
				socket.emit('collision', player.id);
			}
		}

		for(var i in currtrails) {
			var trail = currtrails[i];
			if(isColliding(trail.x1, trail.y1, trail.x2, trail.y2)) {
				player.velocity = 0;
				console.log('COLLISION');
				socket.emit('collision', player.id);

			}
		}
	}
}

function draw() {


	camera.x = clamp((player.x-canvas.width/(2*scale)), 0, 1000 - (canvas.width / scale));
	camera.y = clamp((player.y-canvas.height/(2*scale)), 0, 1000 - (canvas.height / scale));

	context.setTransform(1,0,0,1,-camera.x * scale, -camera.y * scale);
	
	context.scale(scale, scale);
	//var pat=context.createPattern(bg,"repeat");
	
	//context.fillStyle = "#202d3a";
	
	context.fillRect(camera.x,camera.y,canvas.width, canvas.height);
	context.drawImage(bg, 0, 0);

	context.beginPath();
	context.strokeStyle = trailColors[player.h]
	context.lineWidth = 3;
	for(var i = 0; i < trails.length; i++) {
		var trail = trails[i];
		context.moveTo(trail.x1, trail.y1);
		context.lineTo(trail.x2, trail.y2);
	}
	context.moveTo(lineStart.x, lineStart.y);
	context.lineTo(player.x + 15 + player.xoff, player.y + 15 + player.yoff);
	context.stroke();

	context.drawImage(img[player.h],player.i * 32,0,32,32,player.x,player.y,32,32);
	context.fillStyle = "white";
	context.fillText("justin", player.x + 15, player.y + 40);
	

	for(var id in players) {


		for(var i = 0; i < othertrails.length; i++) {
			var trail = othertrails[i];
				context.beginPath();
				context.strokeStyle = trailColors[players[trail.id].h]
				context.moveTo(trail.x1, trail.y1);
				context.lineTo(trail.x2, trail.y2);
				context.stroke();
		}

		context.beginPath();
		context.moveTo(lineStarts[id].x, lineStarts[id].y);
		context.lineTo(players[id].x + 15, players[id].y + 15);
		currtrails[id] = {
			x1:lineStarts[id].x,
			y1:lineStarts[id].y,
			x2:players[id].x + 15,
			y2:players[id].y + 15
		}
		context.stroke();
		context.drawImage(img[players[id].h],players[id].i * 32,0,32,32,players[id].x,players[id].y,32,32);
		context.fillStyle = "white";
		context.fillText(players[id].u, players[id].x + 15, players[id].y + 40);
	}


	context.translate(camera.x, camera.y);

	sendMessage();
	

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

function sendMessage() {
	context.fillStyle = "white";
	if(timeleft == 4) {
		context.fillText("Waiting for other players...", canvas.width/2, canvas.height/2);
	}
	else if(timeleft > 0) {
		context.fillText(timeleft, canvas.width/2, canvas.height/2);
	}
	else if(timeleft == 0) {
		context.fillText("Go!", canvas.width/2, canvas.height/2);
	}
	else if(gameOver != "") {
		context.fillText(gameOver, canvas.width/2, canvas.height/2);
	}
}
/*
 *Uses algorithm of line intersection of Wikipedia
 *https://en.wikipedia.org/wiki/Line–line_intersection
 */
function isColliding(x1, y1, x2, y2) {
	var x3 = player.x + 3;
	var x4 = player.x + 18;
	var y3 = player.y + 3;
	var y4 = player.y + 18;

	var u = ( ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	var t = ( ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)) );

	if(u >= 0 && u <= 1 && t >= 0 && t <= 1) {
		return true;
	}
	else  {
		return false;
	}
}




