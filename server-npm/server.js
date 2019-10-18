#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
const crypto = require('crypto');
const { rankBoard, rankDescription } = require('phe')

let gameState = require('./initial-game-state.json');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8081, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

let wsServer = new WebSocketServer({
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

/*function generateAcceptValue(acceptKey) {
    return crypto
        .createHash('sha1')
        .update(acceptKey + '258EAFA5-E914–47DA-95CA-C5AB0DC85B11', 'binary')
        .digest('base64');
}*/

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    let connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted for ' + request.key);

    let client = new Client(request.key, connection);
    Clients.push(client);
    connection.sendUTF(JSON.stringify({action: 'connected', data: client.id}));

    let player = new Player2(request.key, connection);

    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            console.log('Received Message: ' + data.utf8Data);

            var message = JSON.parse(data.utf8Data);
            switch (message.action){

                case 'join':
                    client.status = 'joined';
                    player.gamestate.name = message.data;
                    client.name = message.data;

                    player.gamestate.id = Object.size(Players2);

                    Players2[client.id] = player;

                    //TODO validation + max 6 people + only known bots
                    console.log("Player joined the game:", client.name);
                    //todo BroadcastPlayersList();
                    BroadcastGameState2();
                    break;

                case 'unjoin':
                    client.status = 'not-joined';
                    console.log(client.name + " unjoined the game!");
                    //todo BroadcastPlayersList();
                    break;

                case 'observe':
                    client.status = 'admin';
                    client.name = message.data;
                    console.log(client.name + " is observing the game!");

                    //TODO only allow if API key is valid

                    //TODO Players = RemovePlayer(player);
                    //Observers.push(player);

                    //BroadcastPlayersList();
                    BroadcastGameState2();
                    break;

                //TODO: Only initiated by Server itself
                case 'new_game':
                    // ShufflePlayers();
                    // //TODO: Park all unjoined players
                    // IncreaseCreditsForAllPlayers(1000);
                    // BroadcastPlayersList();
                    //
                    // NewDeck(); //shuffled 3 decks
                    // console.log("Cards", Cards);
                    break;

                case 'new_round':
                    // MoveSmallBindToNextPlayer();
                    // PlayersForThisRound = GetPlayersStartingWithSmallBlind();
                    //
                    // console.log("ROUND PLAYERS: ", PlayersForThisRound.length);
                    //
                    // PlayersForThisRound[0].setBet(5);
                    // PlayersForThisRound[1].setBet(10);
                    // CurrentPlayerForThisRound = 2;
                    // BroadcastGameState();
                    //
                    // //give card to all players
                    //
                    // ProvideOneCardToAllPlayers();
                    // BroadcastGameState();
                    //
                    // //give card to all players
                    // ProvideOneCardToAllPlayers();
                    // BroadcastGameState();
                    //
                    // //loop all players and ask for Bet
                    // AskNextPlayerToBet();
                    break;

                case 'call': //{'action': 'call'}
                    // //TODO: check if it your turn
                    // if (player.action == 'please_bet') {
                    //     var players = GetPlayersStartingWithSmallBlind();
                    //     player.setBet(players[1].getBet());
                    //     player.setAction('call');
                    //
                    //     if (ContinueBetting()) {
                    //         AskNextPlayerToBet();
                    //     } else {
                    //         NextStepInTheGame();
                    //     }
                    // }
                    //
                    // //TODO: return that action was accepted or not.
                    // BroadcastGameState();
                    break;

                case 'raise': //{'action': 'raise', 'data': 20}
                    // //TODO: check if it your turn
                    // if (player.action == 'please_bet') {
                    //     //TODO: check if bet is allowed.
                    //     player.setBet(message.data);
                    //     player.setAction('raise');
                    //
                    //     if (ContinueBetting()) {
                    //         AskNextPlayerToBet();
                    //     } else {
                    //         NextStepInTheGame();
                    //     }
                    // }
                    //
                    // //TODO: return that action was accepted or not.
                    // BroadcastGameState();
                    break;

                case 'fold': //{'action': 'fold'}
                    // //TODO: check if it your turn
                    //
                    // if (player.action == 'please_bet') {
                    //     player.setAction('fold');
                    //
                    //     if (ContinueBetting()) {
                    //         AskNextPlayerToBet();
                    //     } else {
                    //         NextStepInTheGame();
                    //     }
                    // }
                    //
                    // //TODO: return that action was accepted or not.
                    // BroadcastGameState();
                    break;
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('Player disconnected: ', client.id);

        player.gamestate.status = "inactive";

        //TODO
        //Players = RemovePlayer(player); //TODO: or fold when game was already running
        //Observers = RemoveObserver(player);
    });
});

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
    PlayersForThisRound.forEach(function(player){
        var card = Cards.shift();
        player.addToHand(card);
    });
}

function ProvideCommunityCards(count) {
    for (var i = 0; i < count; i++) {
        var card = Cards.shift();
        CommunityCards.push(card);
    }
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
let Players = [];
let Clients = [];
let Players2 = {};

let Observers = [];
let SmallBlindPosition = 0;

let PlayersForThisRound = [];
let CurrentPlayerForThisRound = 0;

function Client(id, connection){
    this.id = id;
    this.name = '';
    this.connection = connection;
    this.status = 'not-joined'; //not-joined, joined, observer, admin
}

function Player2(id, connection){
    this.id = id;
    this.connection = connection;
    this.gamestate = {
        "id": 0,
        "name": "",
        "status": "active",
        "stack": 0,
        "bet": 0,
        "hole_cards": []
    };
}

function Player(id, connection){
    this.id = id;
    this.connection = connection;
    this.name = ''; //remove
    this.index = -1; //remove

    this.joined = false; //remove
    this.credits = 0;
    this.hand = []; //remove
    this.bet = 0; //remove
    this.action = '';
}

Player.prototype = {
    getId: function(){
        return this.id;
    },
    getIdentity: function(){
        return {name: this.name, id: this.id, credits: this.credits, action: this.action};
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

            hand: this.hand,
            action: this.action
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
    setAction: function(action){
        this.action = action;
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
    var clientList = [];
    Clients.forEach(function(client){
        if (client.status === 'joined' || client.status === 'not-joined'){
            clientList.push(client.getIdentity());
        }
    });

    var message = JSON.stringify({
        'action': 'players_list',
        'data': clientList
    });

    Clients.forEach(function(client){
        client.connection.sendUTF(message);
    });
}

function BroadcastGameState2(currentPlayer){

    gameState.players = [];
    for (var playerId in Players2) {
        var player = Players2[playerId];
        gameState.players.push(player.gamestate);
    }

    Clients.forEach(function(client){
        if (client.status === 'admin') {
            var message = JSON.stringify({
                'action': 'game_state',
                'data': gameState
            });
            client.connection.sendUTF(message);
        }
    });
}

function BroadcastGameState(currentPlayer){
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
            'me': player.getPrivateGameState()
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

function IncreaseCreditsForAllPlayers(credits) {
    Players.forEach(function(player){
        if (player.joined) {
            player.increaseCredits(credits);
        }
    });
}

function ResetActionForAllPlayers() {
    PlayersForThisRound.forEach(function(player){
        player.setAction('');
    });
}

function GetPlayersStartingWithSmallBlind() {
    var orderedPlayers = [];

    Players.forEach(function(player){
        if (player.joined && player.index >= SmallBlindPosition) {
            orderedPlayers.push(player);
        }
    });
    Players.forEach(function(player){
        if (player.joined && player.index < SmallBlindPosition) {
            orderedPlayers.push(player);
        }
    });
    return orderedPlayers;
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

function AskNextPlayerToBet() {
    console.log("Ask next player to bet", CurrentPlayerForThisRound);
    var player = PlayersForThisRound[CurrentPlayerForThisRound];

    var message = JSON.stringify({
        'action': 'please_bet',
        'info': player.getIdentity(),
        'community': CommunityCards
    });

    player.connection.sendUTF(message);
    player.setAction('please_bet');

    CurrentPlayerForThisRound++;

    if (CurrentPlayerForThisRound >= PlayersForThisRound.length) {
        CurrentPlayerForThisRound = 0;
    }
}

function ContinueBetting() {
    var continueBetting = false;
    PlayersForThisRound.forEach(function(player){
        if (player.action !== 'please_bet' && player.action !== '') {
            continueBetting = true;
        }
    });

    if (continueBetting) {
        return true;
    }

    var maxBet = 0;
    PlayersForThisRound.forEach(function(player){
        if (maxBet < player.bet) {
            maxBet = player.bet;
        }
    });
    PlayersForThisRound.forEach(function(player){
        if (maxBet !== player.bet) {
            continueBetting = true;
        }
    });

    return continueBetting;
}

function NextStepInTheGame() {
    console.log("Next step in the game");

    if (CommunityCards.length == 0) {
        console.log("FLOP");
        ProvideCommunityCards(3);
        CurrentPlayerForThisRound = 0;
        ResetActionForAllPlayers();
        AskNextPlayerToBet();
    } else if (CommunityCards.length == 3) {
        console.log("TURN");
        ProvideCommunityCards(1);
        CurrentPlayerForThisRound = 0;
        ResetActionForAllPlayers();
        AskNextPlayerToBet();
    } else if (CommunityCards.length == 4) {
        console.log("RIVER");
        ProvideCommunityCards(1);
        CurrentPlayerForThisRound = 0;
        ResetActionForAllPlayers();
        AskNextPlayerToBet();
    } else if (CommunityCards.length == 5) {
        //TODO: end of the game: determine score and collect bets

        console.log("END of game");

        ResetActionForAllPlayers();
    }
}