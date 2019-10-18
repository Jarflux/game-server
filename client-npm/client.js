#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = { action:'join', data: 'Client ' + Math.floor(Math.random()*100) };
    const json = JSON.stringify(data);
    connection.sendUTF(json);

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            console.log("Received: '" + data.utf8Data + "'");

            var message = JSON.parse(data.utf8Data);
            switch (message.action) {

                case 'please_bet':
                    console.log("I have to bet now");
                    //TODO: send back 'call'
                    connection.sendUTF(JSON.stringify({ action:'call'}));
                    break;

                case 'players_list':
                    console.log("Players list", message.data);
                    break;

                case 'game_state':
                    //TODO replace please bet with game state
                    console.log("Players list", message.data, message.me);
                    break;
            }
        }
    });
});

client.connect('ws://localhost:8081/', 'echo-protocol');