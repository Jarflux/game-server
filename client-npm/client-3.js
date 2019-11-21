#!/usr/bin/env node
let WebSocketClient = require('websocket').client;
let shuffle = require('./shuffle');

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

let client = new WebSocketClient();

let UUID = '';

let gameState = undefined;

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = {
        action:'join',
        data: 'Steven', //'Client ' + Math.floor(Math.random()*100)
        api_key: 'Y2}/RUVw5s?F+vq3qO(n8uXou&3_GL'
    };
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
                case 'connected':
                    UUID = message.data;
                    console.log("UUID", UUID);
                    break;

                case 'your_turn':
                    console.log("My turn");

                    message.options = shuffle(message.options);
                    let option = message.options[0];
                    if (option.action === 'fold') {
                        message.options = shuffle(message.options);
                        option = message.options[0];
                    }

                    if (option.action === 'fold' || option.action === 'call' || option.action === 'check') {
                        connection.sendUTF(JSON.stringify({ action: option.action}));
                        console.log("Responded with:", option.action);
                    } else if (option.action === 'raise') {
                        let raise = randomIntFromInterval(option.minimum, option.maximum);
                        connection.sendUTF(JSON.stringify({ action: 'raise', data: raise}));
                        console.log("Responded with:", "RAISE " + raise);
                    }

                    break;

                case 'game_state':
                    gameState = message.data;
                    console.log("Game state", gameState);
                    break;
            }
        }
    });
});

client.connect('ws://localhost:8081/', 'echo-protocol');