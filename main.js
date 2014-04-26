// use express instead of building our own request handler
var express = require('express'); 
var moment = require('moment'); // momentjs
var io = require('socket.io'); 	// socket.io
var mongoose = require('mongoose'); //mongoose to connect to MongoDB

// connect to the db
mongoose.connect('mongodb://localhost/chat');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
});

// start the http server and serve our chatbox
var app = express();
var server = app.listen(1223, function() {
    console.log('Listening on port %d', server.address().port);
});
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

// make socket.io listen to our app
var socket = io.listen(server);



// ---------------------------------------------------------------------

var MessageSchema = mongoose.Schema({
	date: Date,
    client: String,
    nickname: String,
    content: String,
});
var Message = mongoose.model('Message', MessageSchema);

var sessionCount = 0;
var users = {};
var admin = "***ADMIN***";

// ---------------------------------------------------------------------

socket.on("connection", function (client) {  

	// somebody connects
    client.on("user:join", function(nickname) {

    	sessionCount++;

    	// assign a nickname for now
    	nickname = "User #" + sessionCount;

        users[client.id] = nickname;

        // get the chat log
        Message.find().limit(100).sort('-date').exec(function(error, items){
        	items.reverse();
        	items.forEach(function(item){
        		client.emit("server:send", item);
        	});
        });

        // notify the user
        var connectionMessage = new Message({
        	date: new Date(),
        	nickname: admin,
        	content: "You have connected to the server."
        });
        client.emit("server:send", connectionMessage);

        // notify the others
        var joinMessage = new Message({
        	date: new Date(),
        	nickname: admin,
        	content: nickname + " has joined the server."
        });
        client.broadcast.emit("server:send", joinMessage);

        // push the list of online users
        socket.sockets.emit("server:updateusers", users);
    });

    // the server receives a message from a client
    client.on("user:send", function(content) {

    	var sender = users[client.id];
    	// push the message to all clients

    	var message = new Message({
        	date: new Date(),
        	nickname: sender,
        	client: client.id,
        	content: content
        });
        message.save();
        socket.sockets.emit("server:send", message);

    });

    // somebody disconnects
    client.on("disconnect", function() {

    	var nickname = users[client.id];

    	var leftMessage = new Message({
        	date: new Date(),
        	nickname: admin,
        	content: nickname + " has left the server."
        });
        socket.sockets.emit("server:send", leftMessage);

        delete users[client.id];

        // push the list of online users
        socket.sockets.emit("server:updateusers", users);
    });

});
