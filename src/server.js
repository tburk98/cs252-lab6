var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 4321);

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '/client/index.html'));
});

server.listen(4321, function() {
	console.log('Server has begun on port 4321');
});