#!/usr/bin/env node
let WebSocketClient = require('websocket').client;

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

                    let random = Math.round(Math.random() * 100);
                    //random = 14;

                    if (random < 10) {
                        //Return with a call, no matter what the input is
                        connection.sendUTF(JSON.stringify({ action:'raise', data: 20}));
                        console.log("Responded with:", "RAISE 20");
                    } else if (random < 15) {
                        //Return with a call, no matter what the input is
                        connection.sendUTF(JSON.stringify({ action:'raise', data: 200}));
                        console.log("Responded with:", "RAISE 200");
                    } else if (random > 90) {
                        //Return with a call, no matter what the input is
                        connection.sendUTF(JSON.stringify({ action:'fold'}));
                        console.log("Responded with:", "FOLD");
                    } else if (random === 80) {
                        // Do not respond at all
                    } else {
                        //Return with a call, no matter what the input is
                        connection.sendUTF(JSON.stringify({ action:'call'}));
                        console.log("Responded with:", "CALL");
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