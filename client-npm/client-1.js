#!/usr/bin/env node
let WebSocketClient = require('websocket').client;
let shuffle = require('./shuffle');

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

let client1 = new WebSocketClient();

let UUID = '';

let gameState = undefined;

client1.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client1.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = {
        action:'join',
        data: 'Ben', //'Client ' + Math.floor(Math.random()*100)
        api_key: 'YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]'
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
            //console.log("Received: '" + data.utf8Data + "'");

            var message = JSON.parse(data.utf8Data);
            switch (message.action) {
                case 'connected':
                    UUID = message.data;
                    console.log("UUID", UUID);
                    break;

                case 'success':
                    console.log("SUCCESS", message.data);
                    break;

                case 'error':
                    console.log("ERROR", message.data);
                    break;

                case 'your_turn':
                    console.log("My turn", message);

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
                        let raise = Math.floor(randomIntFromInterval(option.minimum, option.maximum) / 6);
                        if (raise < option.minimum) {
                            raise = option.minimum;
                        }
                        connection.sendUTF(JSON.stringify({ action: 'raise', data: raise}));
                        console.log("Responded with:", "RAISE " + raise);
                    }

                    break;
                case 'game_state':
                    gameState = message.data;
                    //console.log("Game state", gameState);
                    break;
            }
        }
    });
});

//client1.connect('ws://10.150.146.39:8081/', 'echo-protocol');
client1.connect('ws://localhost:8081/', 'echo-protocol');