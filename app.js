var express = require('express')
    , path = require('path')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

io.set('log level', 1);

var users = {};
var rooms = {};
rooms['foo'] = {};
rooms['bar'] = {};



//listen to WebSocket connection
io.on('connection', function (socket) {
    //send confirmation to client
    socket.emit('open');


    var client = {
        socket:socket,
        name:false,
        room:false,
        color:getColor()
    };

    //Listen to event 'message'
    socket.on('message', function (msg){
        var obj = {time:getTime(),color:client.color};

        //client.name = false -> first time login
        if (!client.name) {

            if (users[msg]) {
                obj['author'] = 'System';
                obj['text'] = 'Name Taken';
                obj['type'] = 'error';
                console.log('Existing name');

                socket.emit('system', obj);
            } else {
                client.name = msg;
                obj['text'] = client.name;
                obj['author'] = 'System';
                obj['type'] = 'welcomeClient';
                obj['rooms'] = rooms;
                users[msg] = msg;
                console.log(client.name + ' login');

                socket.emit('system', obj);
            }

        } else if (!client.room) {
            //Need to choose a chat room

            if (rooms[msg]) {
                client.room = msg;
                rooms[client.room][client.name] = client.name;

                obj['author'] = 'System';
                obj['text'] = client.name;
                obj['type'] = 'welcomeRoom';
                obj['roomName'] = client.room;
                obj['list'] = rooms[client.room];

                socket.emit('system', obj);
                socket.join(client.room);
                socket.broadcast.to(client.room).emit('system',obj);
                console.log('Enter Room:' + client.name);

            } else {
                //Wrong room name input
                obj['author'] = 'System';
                obj['text'] = 'No this room.';
                obj['type'] = 'error';
                console.log('Wrong room');

                socket.emit('system', obj);
            }

        } else if (msg == 'exitRoom') {
            //Exit the chat room
            obj['text'] = client.name;
            obj['author'] = 'System';
            obj['type'] = 'disconnect';
            socket.broadcast.to(client.room).emit('system',obj);
            socket.leave(client.room);
            console.log(client.name + ' exit room');

            //Choose room again
            obj['type'] = 'welcomeClient';
            obj['rooms'] = rooms;

            delete rooms[client.room][client.name];
            client.room = false;
            socket.emit('system', obj);

        } else {
            //Normal chatting -> send content
            obj['text']=msg;
            obj['author']=client.name;
            obj['type']='message';
            console.log(client.name + ' say: ' + msg);

            socket.emit('message',obj);
            socket.broadcast.to(client.room).emit('message',obj);
        }
    });

    //Listen to event 'disconnect' - totally offline
    socket.on('disconnect', function () {

        if (client.room) {
            obj = {
                text:client.name,
                author:'System',
                type:'disconnect',
                time:getTime(),
                color:client.color
            }
            socket.leave(client.room);
            socket.broadcast.to(client.room).emit('system',obj);
            console.log(client.name + ' exit room');
            delete rooms[client.room][client.name];
        }
        if (users[client.name]) {
            delete users[client.name];
        }

        console.log(client.name + 'Disconnect');
    });

});

//express configure
app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

//Websocket client -> html file
app.get('/', function(req, res){
    res.sendfile('views/chat.html');
});

server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});


var getTime=function(){
    var date = new Date();
    return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

var getColor=function(){
    var colors = ['aqua','aquamarine','green','orange', 'DarkMagenta',
        'blueviolet','brown','burlywood','cadetblue','chocolate','DarkCyan','IndianRed',
        'MediumVioletRed', 'Teal','VioletRed', 'LightCoral', 'FireBrick'];
    return colors[Math.floor(Math.random() * 10000 % colors.length)];
}