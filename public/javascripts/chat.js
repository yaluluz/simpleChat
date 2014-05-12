$(function () {
    var content = $('#content');
    var status = $('#status');
    var input = $('#input');
    var myName = false;
    var button = $('button');
    button.hide();

    //Websocket connection
    socket = io.connect('http://localhost:3000');
    //server confirm connection
    socket.on('open',function(){
        status.text('Choose a name:');
    });

    //Listen to event 'system', print system message
    socket.on('system',function(json) {
        var p = '';

        if (json.type === 'welcomeClient') {
            p = '<p style="background:'+json.color+'">system  @ '+ json.time + ' : Welcome ' + json.text + '. Choose a room:</p>';
            if (myName==json.text) {
                status.text('Room name:');
                var rooms = json.rooms;
                p += '<p style="background:'+json.color+'">   @ Rooms: ';
                for (var x in rooms) {
                    var count = Object.keys(json.rooms[x]).length;
                    p +=  x + '(' + count + '); ';
                }
                p += '</p>';
            }
        } else if (json.type == 'welcomeRoom') {
            p = '<p style="background:'+json.color+'">system  @ '+ json.time+ ' : "' + json.text + '" joined room - ' + json.roomName + '</p>';
            if (myName==json.text) {
                status.text(myName + ': ').css('color', json.color);
                p += '<p style="background:'+json.color+'">   @ Users in ' + json.roomName + ': ';
                var list = json.list;
                for (var x in list) {
                    p += x + '; ';
                }
                p += '</p>';
                button.show();
            }
        } else if (json.type == 'disconnect') {
            p = '<p style="background:'+json.color+'">system  @ '+ json.time+ ' : Bye ' + json.text +'</p>';
        } else if (json.type == 'error') {
            if (json.text == 'Name Taken'){
                myName = false;
            }
            p = '<p style="background:'+json.color+'">system  @ '+ json.time+ ' : Error - ' + json.text +'</p>';
        }
        content.prepend(p);
    });

    //Listen to event 'message', print chat content
    socket.on('message',function(json) {
        var p = '<p><span style="color:'+json.color+';">' + json.author+'</span> @ '+ json.time+ ' : '+json.text+'</p>';
        content.prepend(p);
    });

    //keyboard 'Enter' to trigger event
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) return;

            if (myName === false) {
                if (msg.length > 15) {
                    msg = msg.substr(0, 15);
                }
                myName = msg;
            }
            socket.send(msg);
            $(this).val('');
        }
    });

    //click button to exit chat room
    button.click(function(){
        socket.send('exitRoom');
        button.hide();
    })
});