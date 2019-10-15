#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
const crypto = require('crypto');
const { rankBoard, rankDescription } = require('phe')

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

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

/*wsServer.on('upgrade', function (req, socket) {
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
});*/

/*function generateAcceptValue(acceptKey) {
    return crypto
        .createHash('sha1')
        .update(acceptKey + '258EAFA5-E914–47DA-95CA-C5AB0DC85B11', 'binary')
        .digest('base64');
}*/

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    //
    // New Player has connected.  So let's record its socket
    //
    var player = new Player(request.key, connection);

    //
    // Add the player to the list of all players
    //
    Players.push(player);

    //
    // We need to return the unique id of that player to the player itself
    //
    connection.sendUTF(JSON.stringify({action: 'connect', data: player.id}));

    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            //console.log('Received Message: ' + data.utf8Data);
            //
            // Process the requested action
            //
            var message = JSON.parse(data.utf8Data);
            switch (message.action){
                //TODO case observe (only if valid observe API key)

                //
                // When the user sends the "join" action, he provides a name.
                // Let's record it and as the player has a name, let's
                // broadcast the list of all the players to everyone
                //
                case 'join':
                    player.name = message.data;
                    player.join(true);
                    //TODO validation + max 6 people + only known bots
                    console.log(player.name + " joined the game!");
                    BroadcastPlayersList();
                    break;

                case 'unjoin':
                    player.join(false);
                    console.log(player.name + " unjoined the game!");
                    BroadcastPlayersList();
                    break;

                case 'observe':
                    player.name = message.data;
                    console.log(player.name + " is observing the game!");

                    //TODO only allow if API key is valid

                    Players = RemovePlayer(player);
                    Observers.push(player);

                    BroadcastPlayersList();
                    break;

                //TODO: Only initiated by Server itself
                case 'new_game':
                    ShufflePlayers();
                    //TODO: Park all unjoined players
                    IncreaseCreditsForAllPlayers(1000);
                    BroadcastPlayersList();

                    NewDeck(); //shuffled 3 decks
                    console.log("Cards", Cards);
                    break;

                case 'new_round':
                    //TODO: start looping every player
                    MoveSmallBindToNextPlayer();
                    GetSmallBlind().setBet(5);
                    GetBigBlind().setBet(10);

                    BroadcastGameState();

                    ProvideOneCardToAllPlayers();
                    BroadcastGameState();

                    ProvideOneCardToAllPlayers();
                    BroadcastGameState();

                    //TODO: loop all players and ask for input.
                    //TODO: the first player to loop is the person after the bigBlind

                    //TODO: now provide the 3 community cards
                    // CommunityCards
                    BroadcastGameState();

                    //TODO; another bet round

                    //Inform the game has started
                    break;

                case 'call': //{'action': 'call'}
                    //TODO: check if it your turn
                    player.setBet(GetBigBlind.getBet());

                    //TODO: return that action was accepted or not.
                    BroadcastGameState();
                    break;

                case 'raise': //{'action': 'raise', 'data': 20}
                    //TODO: check if it your turn

                    var bigBlindBet = GetBigBlind.getBet();
                    //TODO: check if bet is allowed.

                    player.setBet(message.data);

                    //TODO: return that action was accepted or not.
                    BroadcastGameState();
                    break;

                case 'fold': //{'action': 'fold'}
                    //TODO: check if it your turn

                    player.fold();

                    //TODO: return that action was accepted or not.
                    BroadcastGameState();
                    break;
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('  Player ' + player.getIdentity() + ' disconnected.');

        Players = RemovePlayer(player); //TODO: or fold when game was already running
        Observers = RemoveObserver(player);
    });
});



/*function informClients() {
    for (var i in connections) {
        var connection = connections[i];
        if (connection.connected) {
            var card = cards_pool.shift();
            if (card) {
                connection.sendUTF(card);
            } else {
                connection.sendUTF("All cards are dealt!!!!");
            }
        }
    }
    if (cards_pool.length > 0) {
        setTimeout(informClients, 1000);
    } else {
        console.log("All cards are dealt");
    }
}

function startSendingCards() {
    informClients();
}

setTimeout(startSendingCards, 10000);*/

// -----------------------------------------------------------
// utils
// -----------------------------------------------------------

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// -----------------------------------------------------------
// Game state
// -----------------------------------------------------------

var gameStarted = false;
var Cards = [];
var CommunityCards = [];

var cards_pool = [
    "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "Ts", "Js", "Qs", "Ks", "As",
    "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "Th", "Jh", "Qh", "Kh", "Ah",
    "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "Td", "Jd", "Qd", "Kd", "Ad",
    "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "Tc", "Jc", "Qc", "Kc", "Ac"
];

function NewDeck() {
    Cards = [];
    Cards = cards_pool;
    ShuffleDeck();
}

function ShuffleDeck() {
    return shuffle(Cards);
}

function ProvideOneCardToAllPlayers() {
    Players.forEach(function(player){
        var card = Cards.shift();
        player.addToHand(card);
    });
}

function bla() {
    const board = 'As Ks 4h Ad Kd';
    const rank = rankBoard(board);
    const name = rankDescription[rank];

    console.log('%s is a %s', board, name);
    console.log('Rank ' + rank);
}

// -----------------------------------------------------------
// List of all players
// -----------------------------------------------------------
var Players = [];
var Observers = [];
var SmallBlindPosition = 0;

function Player(id, connection){
    this.id = id;
    this.connection = connection;
    this.name = '';
    this.index = -1;

    this.joined = false;
    this.credits = 0;
    this.hand = [];
    this.bet = 0;
}

Player.prototype = {
    getId: function(){
        return this.id;
    },
    getIdentity: function(){
        return {name: this.name, id: this.id, credits: this.credits};
    },
    getPublicGameState: function(){
        return {
            name: this.name,
            id: this.id,
            credits: this.credits,
            bet: this.bet
        };
    },
    getPrivateGameState: function(){
        return {
            name: this.name,
            id: this.id,
            credits: this.credits,
            bet: this.bet,

            hand: this.hand
        };
    },
    join: function(join){
        this.joined = join;
    },
    setIndex: function(index){
        this.index = index;
    },
    addToHand: function(hand){
        this.hand.push(hand);
    },
    setBet: function(bet){
        if (this.credits >= bet && bet > 0) {
            this.bet = bet;
            this.credits = this.credits - bet;
        }
    },
    fold: function(bet){
        this.bet = 'fold';
    },
    getBet: function(){
        return this.bet;
    },
    increaseCredits: function(credits){
        this.credits = this.credits + credits;
    }
};

// ---------------------------------------------------------
// Routine to broadcast the list of all players to everyone
// ---------------------------------------------------------
function BroadcastPlayersList(){
    var playersList = [];
    Players.forEach(function(player){
        if (player.name !== '' && player.joined){
            playersList.push(player.getIdentity());
        }
    });

    var message = JSON.stringify({
        'action': 'players_list',
        'data': playersList
    });

    Players.forEach(function(player){
        player.connection.sendUTF(message);
    });

    Observers.forEach(function(observer){
        observer.connection.sendUTF(message);
    });
}

function BroadcastGameState(){
    var playersList = [];
    var privatePlayersList = [];
    Players.forEach(function(player){
        if (player.name !== '' && player.joined){
            playersList.push(player.getPublicGameState());
            privatePlayersList.push(player.getPrivateGameState());
        }
    });

    Players.forEach(function(player){
        var message = JSON.stringify({
            'action': 'game_state',
            'data': playersList,
            'you': player.getPrivateGameState()
            //TODO
        });
        player.connection.sendUTF(message);
    });

    var message = JSON.stringify({
        'action': 'game_state',
        'data': privatePlayersList,
        //TODO: more state
    });

    Observers.forEach(function(observer){
        observer.connection.sendUTF(message);
    });
}

function RemovePlayer(playerToRemove) {
    return Players.filter(function(player){
        return player.getId() !== playerToRemove.getId();
    });
}

function ShufflePlayers() {
    shuffle(Players);

    var index = 0;
    Players.forEach(function(player){
        if (player.joined) {
            player.setIndex(index);
            index++;
        }
    });

    SmallBlindPosition = 0;
}

function GetPlayersInPosition() {
    //TODO: return list of players with the small blind first
}

function IncreaseCreditsForAllPlayers(credits) {
    Players.forEach(function(player){
        if (player.joined) {
            player.increaseCredits(credits);
        }
    });
}

function GetSmallBlind() {
    var smallBlind = undefined;
    Players.forEach(function(player){
        if (player.joined && player.index === SmallBlindPosition) {
            smallBlind = player;
        }
    });
    return smallBlind;
}

function GetPlayerCount() {
    var joinedPlayers = Players.filter(function(player){
        if (player.name !== '' && player.joined){
            return true;
        }
        return false;
    });
    return joinedPlayers.length;
}

function GetBigBlind() {
    var bigBlind = undefined;
    var bigBlindPosition = SmallBlindPosition + 1;
    if (bigBlindPosition >= (GetPlayerCount() - 1)) {
        bigBlindPosition = 0;
    }

    Players.forEach(function(player){
        if (player.joined && player.index === bigBlindPosition) {
            bigBlind = player;
        }
    });
    return bigBlind;
}

function MoveSmallBindToNextPlayer() {
    SmallBlindPosition++;

    if (SmallBlindPosition >= (GetPlayerCount() - 1)) {
        SmallBlindPosition = 0;
    }
}

function RemoveObserver(playerToRemove) {
    return Observers.filter(function(player){
        return player.getId() !== playerToRemove.getId();
    });
}