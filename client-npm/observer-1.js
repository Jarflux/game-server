#!/usr/bin/env node
let WebSocketClient = require('websocket').client;

let client1 = new WebSocketClient();

let UUID = '';

client1.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client1.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    const data = {
        action:'observe',
        data: 'Obsy', //'Client ' + Math.floor(Math.random()*100)
        api_key: 'un$5lhdgdfgg:Tkrru(T&6KsMQuKw1_d-2{'
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

                case 'game_state':
                    let gameState = message.data;
                    console.log("Game state", gameState);
                    break;

                case 'client_list':
                    let clientList = message.data;
                    console.log("Client list", clientList);

                    break;

                case 'score_board':
                    let scoreBoard = message.data;
                    console.log("Score Board", scoreBoard);

                    break;
            }
        }
    });
});

client1.connect('ws://localhost:8081/', 'echo-protocol');