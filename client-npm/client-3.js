#!/usr/bin/env node
let WebSocketClient = require('websocket').client;

let client = new WebSocketClient();

let UUID = '';

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

                case 'game_state':
                    let gameState = message.data;
                    console.log("Game state", gameState);

                    gameState.players.forEach(function(player){
                        if (UUID === player.uuid && player.id === gameState.in_action) {
                            console.log("My turn");

                            //Return with a call, no matter what the input is
                            connection.sendUTF(JSON.stringify({ action:'call'}));
                            console.log("Responded with:", "CALL");
                        }
                    });

                    break;
            }
        }
    });
});

client.connect('ws://localhost:8081/', 'echo-protocol');