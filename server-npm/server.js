#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
const crypto = require('crypto');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

var cards = [
    {number: 2, symbol: '♥'},
    {number: 3, symbol: '♥'},
    {number: 4, symbol: '♥'},
    {number: 5, symbol: '♥'},
    {number: 6, symbol: '♥'},
    {number: 7, symbol: '♥'},
    {number: 8, symbol: '♥'},
    {number: 9, symbol: '♥'},
    {number: 10, symbol: '♥'},
    {number: 'jack', symbol: '♥'},
    {number: 'queen', symbol: '♥'},
    {number: 'king', symbol: '♥'},
    {number: 'ace', symbol: '♥'},

    {number: 2, symbol: '♣'},
    {number: 3, symbol: '♣'},
    {number: 4, symbol: '♣'},
    {number: 5, symbol: '♣'},
    {number: 6, symbol: '♣'},
    {number: 7, symbol: '♣'},
    {number: 8, symbol: '♣'},
    {number: 9, symbol: '♣'},
    {number: 10, symbol: '♣'},
    {number: 'jack', symbol: '♣'},
    {number: 'queen', symbol: '♣'},
    {number: 'king', symbol: '♣'},
    {number: 'ace', symbol: '♣'},

    {number: 2, symbol: '♠'},
    {number: 3, symbol: '♠'},
    {number: 4, symbol: '♠'},
    {number: 5, symbol: '♠'},
    {number: 6, symbol: '♠'},
    {number: 7, symbol: '♠'},
    {number: 8, symbol: '♠'},
    {number: 9, symbol: '♠'},
    {number: 10, symbol: '♠'},
    {number: 'jack', symbol: '♠'},
    {number: 'queen', symbol: '♠'},
    {number: 'king', symbol: '♠'},
    {number: 'ace', symbol: '♠'},

    {number: 2, symbol: '♦'},
    {number: 3, symbol: '♦'},
    {number: 4, symbol: '♦'},
    {number: 5, symbol: '♦'},
    {number: 6, symbol: '♦'},
    {number: 7, symbol: '♦'},
    {number: 8, symbol: '♦'},
    {number: 9, symbol: '♦'},
    {number: 10, symbol: '♦'},
    {number: 'jack', symbol: '♦'},
    {number: 'queen', symbol: '♦'},
    {number: 'king', symbol: '♦'},
    {number: 'ace', symbol: '♦'},
];

var connections = [];

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('upgrade', function (req, socket) {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }
    // Read the subprotocol from the client request headers:
    const protocol = req.headers['sec-websocket-protocol'];
    // If provided, they'll be formatted as a comma-delimited string of protocol
    // names that the client support we'll need to parse the header value, if
    // provided, and see what options the client is offering:
    const protocols = !protocol ? [] : protocol.split(',').map(s => s.trim());
    // To keep it simple, we'll just see if JSON was an option, and if so, include
    // it in the HTTP response:
    if (protocols.includes('json')) {
        // Tell the client that we agree to communicate with JSON data
        responseHeaders.push('Sec-WebSocket-Protocol: json');
    }
});


function generateAcceptValue(acceptKey) {
    return crypto
        .createHash('sha1')
        .update(acceptKey + '258EAFA5-E914–47DA-95CA-C5AB0DC85B11', 'binary')
        .digest('base64');
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connections.push(connection);
    showNumberOfPlayers();

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            //connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            //connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('  Player ' + connection.remoteAddress + ' disconnected.');
        connections = connectionsRemove(connections, connection);
        showNumberOfPlayers();
    });
});

function connectionsRemove(array, value) {
    return array.filter(function(ele){
        return ele.remoteAddress != value.remoteAddress;
    });
}

function showNumberOfPlayers() {
    console.log("We have now " + connections.length + " players.");
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

console.log(shuffle(cards));

function informClients() {
    for (var i in connections) {
        var connection = connections[i];
        if (connection.connected) {
            var card = cards.shift();
            if (card) {
                connection.sendUTF(JSON.stringify(card));
            } else {
                connection.sendUTF("All cards are dealt!!!!");
            }
        }
    }
    if (cards.length > 0) {
        setTimeout(informClients, 1000);
    } else {
        console.log("All cards are dealt");
    }
}

function startSendingCards() {
    informClients();
}

setTimeout(startSendingCards, 10000);