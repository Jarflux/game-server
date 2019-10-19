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

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    let connection = request.accept('echo-protocol', request.origin);
    console.log('Connection accepted for ' + request.key);

    let client = new Client(request.key, connection);
    Clients.push(client);
    connection.sendUTF(JSON.stringify({action: 'connected', data: client.uuid}));

    //TODO, also broadcast list of clients

    let player = new Player(request.key);

    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            console.log('Received Message: ' + data.utf8Data);

            var message = JSON.parse(data.utf8Data);
            switch (message.action) {

                case 'join':
                    client.status = 'joined';
                    player.name = message.data;
                    client.name = message.data;

                    player.id = Players.length;
                    Players.push(player);

                    //TODO validation + max 6 people + only known bots
                    console.log("Player joined the game:", client.name);

                    BroadcastGameState();
                    break;

                case 'unjoin':
                    client.status = 'not-joined';
                    console.log(client.name + " unjoined the game!");

                    client.connection.sendUTF(JSON.stringify({
                        'action': 'unjoined',
                        'data': ''
                    }));

                    RemovePlayer(player);

                    BroadcastGameState();
                    break;

                case 'observe':
                    client.status = 'observer';
                    client.name = message.data;
                    console.log(client.name + " is observing the game!");

                    //TODO only allow if API key is valid

                    RemovePlayer(player);

                    BroadcastGameState();
                    break;

                case 'admin':
                    client.status = 'admin';
                    client.name = message.data;
                    console.log(client.name + " is administrator for the game!");

                    //TODO only allow if API key is valid

                    client.connection.sendUTF(JSON.stringify({
                        'action': 'joined',
                        'data': ''
                    }));
                    BroadcastGameState();
                    break;

                case 'new_game':
                    //TODO: Only initiated by Admin Panel itself
                    ShufflePlayers();
                    IncreaseStackForAllPlayers(1000);

                    gameState.dealer = -1;
                    gameState.in_action = -1;
                    //TODO reset other fields in the gamestate

                    EraseHoleCardsForAllPlayers();
                    gameState.board = [];

                    //TODO what if still bets are open when starting new game? give back the money?

                    BroadcastGameState();
                    break;

                case 'new_round':
                    NewDeck();
                    console.log("Cards", Cards);

                    //TODO what if still bets are open when starting new round? give back the money?

                    EraseHoleCardsForAllPlayers();
                    gameState.board = [];

                    MoveDealerToNextPlayer();
                    gameState.in_action = -1;

                    ProvideOneCardToAllPlayers();
                    ProvideOneCardToAllPlayers();

                    GetSmallBlind().setBet(gameState.small_blind);
                    GetBigBlind().setBet(gameState.big_blind);
                    //TODO also deduct the bet from the stack (or only at the end?)

                    //TODO: this will give the first turn to the small blind (first turn should be for player after big blind

                    BroadcastGameState();
                    break;

                case 'next_cards_and_bet':
                    //TODO determine next step
                    console.log("Next step in the game");

                    if (gameState.largest_current_bet === 0) {
                        //first round, no Board Cards yet, just bet
                    } else if (gameState.board.length == 0) {
                        console.log("FLOP");
                        ProvideBoardCards(3);
                    } else if (gameState.board.length == 3) {
                        console.log("TURN");
                        ProvideBoardCards(1);
                    } else if (gameState.board.length == 4) {
                        console.log("RIVER");
                        ProvideBoardCards(1);
                    } else if (gameState.board.length == 5) {
                        //TODO: end of the game: determine score and collect bets
                        console.log("END of game");
                    }

                    ActivateGame(); //this will trigger the first player to play

                    BroadcastGameState();
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
                    gameState.in_action = -1; //TODO remove, just for testing

                    //TODO move to the next player (if needed, otherwise stop & reset in_action)
                    //TODO add timeout to slow the game
                    //TODO retry
                    //TODO what if call, raise is invalid, respond back to client
                    //TODO if client doesn't respond within 5 seconds, then fold for that player. & move to next player

                    //TODO gameState.in_action++ (maar als groter dan # Players, zet terug naar 0).

                    BroadcastGameState();
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
        console.log('Client disconnected: ', client.uuid);

        player.status = "inactive";
        RemoveClient(client);

        //TODO: fix if client 2 disconnects and connects again, that the same same player & client is used again.

        BroadcastGameState();
        //TODO, also broadcast list of clients
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

let Cards = [];

const cards_pool = [
    "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "Ts", "Js", "Qs", "Ks", "As",
    "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "Th", "Jh", "Qh", "Kh", "Ah",
    "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "Td", "Jd", "Qd", "Kd", "Ad",
    "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "Tc", "Jc", "Qc", "Kc", "Ac"
];

function NewDeck() {
    Cards = [...cards_pool];
    ShuffleDeck();
}

function ShuffleDeck() {
    return shuffle(Cards);
}

function EraseHoleCardsForAllPlayers() {
    Players.forEach(function(player){
        player.hole_cards = [];
    });
}

function ProvideOneCardToAllPlayers() {
    Players.forEach(function(player){
        if (player.hole_cards.length < 2) {
            let card = Cards.shift();
            player.addHoleCards(card);
        }
    });
}

function ProvideBoardCards(count) {
    for (let i = 0; i < count; i++) {
        let card = Cards.shift();
        gameState.board.push(card);
    }
}

/*
function bla() {
    const board = 'As Ks 4h Ad Kd';
    const rank = rankBoard(board);
    const name = rankDescription[rank];

    console.log('%s is a %s', board, name);
    console.log('Rank ' + rank);
}*/

// -----------------------------------------------------------
// List of all players
// -----------------------------------------------------------
let Clients = [];
let Players = [];

function Client(uuid, connection){
    this.uuid = uuid;
    this.name = '';
    this.connection = connection;
    this.status = 'not-joined'; //not-joined, joined, observer, admin
}

function Player(uuid){
    this.id = -1;
    this.uuid = uuid;
    this.name = "";
    this.status = "active";
    this.stack = 0;
    this.bet = 0;
    this.hole_cards = [];
}

Player.prototype = {
    /*getId: function(){
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
    },*/
    addHoleCards: function(hand){
        this.hole_cards.push(hand);
    },
    setBet: function(bet){
        if (this.stack >= bet && bet > 0) {
            this.bet = bet;
            this.stack = this.stack - bet;
        }
        //TODO: add bet to the pot
        gameState.largest_current_bet = bet;
    },
    /*setBet: function(bet){
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
    }*/
};

// ---------------------------------------------------------
// Routine to broadcast the list of all players to everyone
// ---------------------------------------------------------
/*
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
}*/

function MoveDealerToNextPlayer() {
    gameState.dealer++;
    if (gameState.dealer >= Players.length) {
        gameState.dealer = 0;
    }
}

function ActivateGame() {
    gameState.in_action = gameState.dealer + 1;
    if (gameState.in_action >= Players.length) {
        gameState.in_action = 0;
    }
}

function BroadcastGameState(){
    gameState.players = [];
    Players.forEach(function(player){
        gameState.players.push(player);
    });

    //share full game view with observers & admins
    Clients.forEach(function(client){
        if (client.status === 'admin' || client.status === 'observer') {
            let message = JSON.stringify({
                'action': 'game_state',
                'data': gameState
            });
            client.connection.sendUTF(message);
        }
    });

    //share private game view to players
    Clients.forEach(function(client){
        if (client.status === 'joined') {
            gameState.players = [];

            Players.forEach(function(player){
                if (client.uuid === player.uuid) {
                    gameState.players.push({
                        uuid: player.uuid,
                        name: player.name,
                        id: player.id,
                        stack: player.stack,
                        bet: player.bet,

                        hole_cards: player.hole_cards
                    });
                } else {
                    gameState.players.push({
                        uuid: player.uuid,
                        name: player.name,
                        id: player.id,
                        stack: player.stack,
                        bet: player.bet
                    });
                }
            });

            let message = JSON.stringify({
                'action': 'game_state',
                'data': gameState
            });
            client.connection.sendUTF(message);
        }
    });

    //reset player list
    gameState.players = [];

    //TODO: for every broadcast, save the game state in a file.
}


function RemovePlayer(playerToRemove) {
    Players = Players.filter(function(player){
        return player.uuid !== playerToRemove.uuid;
    });
}

function RemoveClient(clientToRemove) {
    Clients = Clients.filter(function(client){
        return client.uuid !== clientToRemove.uuid;
    });
}

function ShufflePlayers() {
    shuffle(Players);

    let index = 0;
    Players.forEach(function(player){
        player.id = index;
        index++;
    });
}

function IncreaseStackForAllPlayers(credits) {
    Players.forEach(function(player){
        player.stack = player.stack + credits;
    });
}

/*function ResetActionForAllPlayers() {
    PlayersForThisRound.forEach(function(player){
        player.setAction('');
    });
}*/

/*function GetPlayersStartingWithSmallBlind() {
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
}*/

/*function GetPlayerCount() {
    var joinedPlayers = Players.filter(function(player){
        if (player.name !== '' && player.joined){
            return true;
        }
        return false;
    });
    return joinedPlayers.length;
}*/

function GetNextPlayer(player) {
    let nextId = player.id + 1;
    if (nextId >= Players.length) {
        nextId = 0;
        //TODO: what about inactive players?
    }

    let nextPlayer = undefined;
    Players.forEach(function(currentPlayer){
        if (nextPlayer === undefined && currentPlayer.id === nextId) {
            nextPlayer = currentPlayer;
        }
    });

    return nextPlayer;
}

function GetDealer() {
    let dealer = undefined;
    Players.forEach(function(player){
        if (dealer === undefined && player.id === gameState.dealer) {
            dealer = player;
        }
    });

    return dealer;
}

function GetSmallBlind() {
    let dealer = GetDealer();
    return GetNextPlayer(dealer);
}

function GetBigBlind() {
    let smallBlind = GetSmallBlind();
    return GetNextPlayer(smallBlind);
}

/*function MoveSmallBindToNextPlayer() {
    SmallBlindPosition++;

    if (SmallBlindPosition >= (GetPlayerCount() - 1)) {
        SmallBlindPosition = 0;
    }
}*/

/*function RemoveObserver(playerToRemove) {
    return Observers.filter(function(player){
        return player.getId() !== playerToRemove.getId();
    });
}*/

/*function AskNextPlayerToBet() {
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
}*/

/*function ContinueBetting() {
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
}*/

/*function NextStepInTheGame() {
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
}*/