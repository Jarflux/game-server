#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = { action:'observe', data: 'Game starter' };
    const json = JSON.stringify(data);
    connection.sendUTF(json);
    console.log("I am: ", json);

    connection.sendUTF(JSON.stringify({ action:'new_game' }));

    connection.sendUTF(JSON.stringify({ action:'new_round' }));

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            var message = JSON.parse(data.utf8Data);
            console.log("Received:", message);
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