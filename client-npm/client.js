#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = { action:'join', data: 'Client name' };
    const json = JSON.stringify(data);
    connection.sendUTF(json);
    console.log("I am: ", json);

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");

            var message = JSON.parse(data.utf8Data);
            switch (message.action) {
                //TODO case observe (only if valid observe API key)

                //
                // When the user sends the "join" action, he provides a name.
                // Let's record it and as the player has a name, let's
                // broadcast the list of all the players to everyone
                //
                case 'your_turn':
                    console.log("I have to bet now");
                    //TODO: send back 'call'
                    break;
            }
        }
    });

    /*function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();*/
});

client.connect('ws://localhost:8080/', 'echo-protocol');