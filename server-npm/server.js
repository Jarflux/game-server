#!/usr/bin/env node
var port = process.argv[2];
var WebSocketServer = require('websocket').server;
var http = require('http');
const crypto = require('crypto');
const {rankBoard, rankDescription} = require('phe');

const SLOW_DOWN = 800;
const TIME_TO_WAIT_FOR_RESPONSE = 9000;
const STARTING_CHIP_STACK = 600;
const ENABLE_SERVER_LOGS = true;

let AUTO_ROUND = true;
let AUTO_GAME = true;

let gameState = require('./initial-game-state.json');

let scoreBoard = [];

//TODO-split new pot if someone did an allIn
//TODO-better ranking (for Two Pair, but one pair is better)
//TODO-save gamestate in a file (to be able to restore)

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);

    response.setHeader('Access-Control-Allow-Origin', 'localhost');
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    //response.writeHead(404);
    response.end();
});
server.listen(port, function () {
    console.log((new Date()) + ' Server is listening on port ' +  port);
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

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin) || request.requestedProtocols[0] !== 'echo-protocol') {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' with protocol ' +  request.requestedProtocols[0] + ' rejected.' );
        return;
    }
    let connection = request.accept('echo-protocol', request.origin);
    console.log('Connection accepted for ' + request.key);

    let client = new Client(request.key, connection);
    Clients.push(client);
    connection.sendUTF(JSON.stringify({action: 'connected', data: client.uuid}));

    BroadcastClientList();

    let player = new Player(request.key);

    connection.on('message', function (data) {
        if (data.type === 'utf8') {
            //console.log('Received Message: ' + data.utf8Data);

            var message = {action:'not-valid'};

            try {
                message = JSON.parse(data.utf8Data);
            } catch(error) {
                console.log("invalid json", data.utf8Data);
            }

            ValidateTotalChipCount();

            switch (message.action) {

                case 'join':
                    if (isValidPlayerApiKey(message.api_key)) {
                        client.status = 'player';
                        player.name = message.data;
                        client.name = message.data;

                        player.api_key = message.api_key;
                        client.api_key = message.api_key;

                        writeToChat(client.name + " joined the game",);

                        player.id = Players.length;
                        AddOrReplacePlayer(player);

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'joined',
                            'secret': 'dopper'
                        }));

                        BroadcastGameState();
                        BroadcastClientList();
                        BroadcastScoreBoard();
                    } else {
                        console.log("Player had invalid key", client.uuid, client.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'invalid-key'
                        }));
                    }
                    break;

                case 'unjoin':
                    if (isValidPlayerApiKey(message.api_key)) {
                        client.status = 'not-joined';
                        writeToChat(client.name + " unjoined the game!");

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'unjoined'
                        }));

                        RemovePlayer(player);

                        BroadcastGameState();
                    } else if (isValidObserverApiKey(message.api_key)) {
                        client.status = 'not-joined';
                        writeToChat(client.name + " unjoined the game!");

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'unjoined'
                        }));
                    } else if (isValidAdminApiKey(message.api_key)) {
                        client.status = 'not-joined';
                        writeToChat(client.name + " unjoined the game!");

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'unjoined'
                        }));
                    } else {
                        console.log("Unjoining with an invalid key", client.uuid, client.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'invalid-key'
                        }));
                    }

                    BroadcastClientList();

                    break;

                case 'observe':
                    if (isValidObserverApiKey(message.api_key)) {
                        client.status = 'observer';
                        client.name = message.data;

                        client.api_key = message.api_key;

                        writeToChat(client.name + " joined as an Observer");
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'joined'
                        }));

                        BroadcastGameState();
                        BroadcastClientList();
                        BroadcastScoreBoard();
                    } else {
                        console.log("Observer had invalid key", client.uuid, client.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'invalid-key'
                        }));
                    }

                    break;

                case 'admin':
                    if (isValidAdminApiKey(message.api_key)) {
                        client.status = 'admin';
                        client.name = message.data;
                        console.log(client.name + " is administrator for the game!");

                        client.api_key = message.api_key;

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'joined'
                        }));
                        BroadcastGameState();
                        BroadcastClientList();
                        BroadcastScoreBoard();
                        BroadcastAdminConfig();
                    } else {
                        console.log("Client to join as admin, but had invalid key", client.uuid, client.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'invalid-key'
                        }));
                    }
                    break;

                case 'new_game':
                    //TODO: validate if this is an allowed action (towards the game state)
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        ShufflePlayers();
                        SetStackForAllPlayers();

                        Players.forEach(function (player) {
                            if (player.status === 'busted') {
                                player.status = 'active';
                            }
                        });

                        gameState.game_id = GetNewGameId();

                        gameState.dealer = -1;
                        gameState.in_action = -1;

                        gameState.hand = 0;
                        gameState.minimum_raise = 20;
                        gameState.small_blind = 10;
                        gameState.big_blind = 20;

                        gameState.largest_current_bet = 0;
                        scoreBoard = [];

                        gameState.pots = [{
                            "size": 0,
                            "eligible_players": []
                        }];

                        EraseHoleCardsForAllPlayers();
                        gameState.board = [];
                        gameState.game_started = true;

                        gameState.final_ranking = [];

                        BroadcastGameState();
                        BroadcastScoreBoard();

                        writeToChat("STARTED NEW GAME ------------------------------");

                        if (AUTO_GAME) {
                            StartNewHand();
                        }
                    }
                    break;
                case 'end_game':
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        gameState.game_started = false;
                        BroadcastGameState();
                    }
                    break;
                case 'new_hand':
                    //TODO: validate if this is an allowed action (towards the game state)
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        StartNewHand();
                    }
                    break;

                case 'next_betting_round':
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        ProceedToNextRound();
                    }
                    break;

                case 'close_hand':
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        EndHand();
                    }
                    break;

                case 'config_auto_game':
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        AUTO_GAME = message.data;
                        BroadcastAdminConfig();
                    }
                    break;

                case 'config_auto_round':
                    if (client.status === 'admin' && isValidAdminApiKey(message.api_key)) {
                        AUTO_ROUND = message.data;
                        BroadcastAdminConfig();
                    }
                    break;

                case 'check': //{'action': 'check'}
                    if (player.id === gameState.in_action) {
                        clearTimeout(ACTION_TIMEOUT_FUNCTION);

                        if (player.attempt <= 3 && player.isValidTurn(gameState.largest_current_bet, 'check')) {
                            player.setBet(gameState.largest_current_bet);
                            writeToChat("Attempt " + player.attempt + ": " +  player.name + " checks " + player.bet + ", keeping " + player.stack);
                            player.last_action = 'check';

                            client.connection.sendUTF(JSON.stringify({
                                'action': 'success',
                                'data': 'action-accepted'
                            }));
                            player.attempt = 1;
                            NextPersonOrEnd();
                        } else if (player.attempt <= 3) {
                            writeToChat("Attempt " + player.attempt + ": " +player.name + " checks " + ', which is not valid. Ask for retry ...');
                            player.attempt++;
                            BroadcastYourTurn(); //try again
                        } else {
                            writeToChat(player.name + " has a fold due to exceeded wrong attempts.");
                            player.last_action = 'fold';
                            player.attempt = 1;
                            gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                                return index !== player.id;
                            });
                            NextPersonOrEnd();
                        }
                    } else {
                        console.error("It's NOT your turn", player.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'not-your-turn'
                        }));
                    }
                    break;
                case 'call': //{'action': 'call'}
                    if (player.id === gameState.in_action) {
                        clearTimeout(ACTION_TIMEOUT_FUNCTION);

                        if (player.attempt <= 3 && player.isValidTurn(gameState.largest_current_bet, 'call')) {

                            if(gameState.largest_current_bet > (player.stack + player.bet)){
                                player.setBet(gameState.largest_current_bet);
                                writeToChat("Attempt " + player.attempt + ": " +  player.name + " call all-in " + player.bet + ", keeping " + player.stack);
                                player.last_action = 'all-in';
                            } else {
                                player.setBet(gameState.largest_current_bet);
                                writeToChat("Attempt " + player.attempt + ": " +  player.name + " calls " + player.bet + ", keeping " + player.stack);
                                player.last_action = 'call';
                            }

                            client.connection.sendUTF(JSON.stringify({
                                'action': 'success',
                                'data': 'action-accepted'
                            }));
                            player.attempt = 1;
                            NextPersonOrEnd();
                        } else if (player.attempt <= 3) {
                            writeToChat("Attempt " + player.attempt + ": " + player.name + " calls " + ', which is not valid. Ask for retry ...');
                            player.attempt++;
                            BroadcastYourTurn(); //try again
                        } else {
                            writeToChat(player.name + " has a fold due to exceeded wrong attempts.");
                            player.last_action = 'fold';
                            player.attempt = 1;
                            gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                                return index !== player.id;
                            });
                            NextPersonOrEnd();
                        }
                    } else {
                        console.error("It's NOT your turn", player.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'not-your-turn'
                        }));
                    }

                    break;

                case 'raise': //{'action': 'raise', 'data': 20}
                    if (player.id === gameState.in_action) {
                        clearTimeout(ACTION_TIMEOUT_FUNCTION);

                        if (gameState.largest_current_bet === message.data) {
                            if (player.attempt <= 3 && player.isValidTurn(message.data, message.action)) {
                                player.setBet(message.data);
                                player.last_action = 'call';

                                writeToChat("Attempt " + player.attempt + ": " +  player.name + " calls " + player.bet + ", keeping " + player.stack);

                                client.connection.sendUTF(JSON.stringify({
                                    'action': 'success',
                                    'data': 'action-accepted'
                                }));
                                player.attempt = 1;
                                NextPersonOrEnd();
                            } else if (player.attempt <= 3) {
                                writeToChat("Attempt " + player.attempt + ": " + player.name + " calls " + gameState.largest_current_bet + ', which is not valid. Ask for retry ...');
                                player.attempt++;
                                BroadcastYourTurn(); //try again
                            } else {
                                writeToChat(player.name + " has a fold due to exceeded wrong attempts.");
                                player.last_action = 'fold';
                                player.attempt = 1;
                                gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                                    return index !== player.id;
                                });
                                NextPersonOrEnd();
                            }
                        } else {
                            if (player.attempt <= 3 && player.isValidTurn(message.data, message.action)) {

                                if(message.data > player.stack){
                                    player.setBet(message.data);
                                    writeToChat("Attempt " + player.attempt + ": " +  player.name + "raise all-in " + player.bet + ", keeping " + player.stack);
                                    player.last_action = 'all-in';
                                }else{
                                    player.setBet(message.data);
                                    writeToChat("Attempt " + player.attempt + ": " +  player.name + " raises " + player.bet + ", keeping " + player.stack);
                                    player.last_action = 'raise';
                                }

                                gameState.pots[0].eligible_players = [player.id];
                                client.connection.sendUTF(JSON.stringify({
                                    'action': 'success',
                                    'data': 'action-accepted'
                                }));
                                player.attempt = 1;
                                NextPersonOrEnd();
                            } else if (player.attempt <= 3) {
                                writeToChat("Attempt " + player.attempt + ": " + player.name + " raises " + message.data + ', which is not valid. Ask for retry ...');
                                player.attempt++;
                                BroadcastYourTurn(); //try again
                            } else {
                                writeToChat(player.name + " has a fold due to exceeded wrong attempts.");
                                player.last_action = 'fold';
                                player.attempt = 1;
                                gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                                    return index !== player.id;
                                });
                                NextPersonOrEnd();
                            }
                        }

                    } else {
                        console.error("It's NOT your turn", player.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'not-your-turn'
                        }));
                    }

                    break;

                case 'fold': //{'action': 'fold'}
                    if (player.id === gameState.in_action) {
                        writeToChat(player.name + " folds");
                        clearTimeout(ACTION_TIMEOUT_FUNCTION);

                        player.last_action = 'fold';
                        player.attempt = 1;

                        gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                            return index !== player.id;
                        });

                        client.connection.sendUTF(JSON.stringify({
                            'action': 'success',
                            'data': 'action-accepted'
                        }));

                        NextPersonOrEnd();
                    } else {
                        console.error("It's NOT your turn", player.name);
                        client.connection.sendUTF(JSON.stringify({
                            'action': 'error',
                            'data': 'not-your-turn'
                        }));
                    }

                    break;
            }
        }
    });
    connection.on('close', function (reasonCode, description) {
        writeToChat('Client disconnected: ', player.uuid, player.name);

        player.status = "inactive";
        RemoveClient(client);

        BroadcastGameState();
        BroadcastClientList();
    });
});
// -----------------------------------------------------------
// API keys
// -----------------------------------------------------------

let VALID_PLAYER_API_KEYS = [
    'Y2}/RUVw5s?F+vq3qO(n8uXou&3_GL', //client 3
    'YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]', //client 1
    'wjAv9bvZl)"IbB`1OI^%ZJa+SAXA%$', //client 2
    'un$5l>81ff;K~ia.C#usMQuKw1_d-2{', //client 4

    's3olopRDT?8L6Qq3#3g52}|6pgZ.s^', //Maiko + Mathieu
    '-KffA7u;~dC.J[r|3-ZPkf1fZXhY^Gs', //Mario + Thijs
    '[VpBeOptl_#hY`h3Jo,|?NCM8qYa9L', //Jan en Pieter-Jan
    '8y-&<#EA0dWI!uULnG4(_/h.c487|y', //Bert + Tom
    'Q^Fd;sHK3m<%T[f.E9#G.?L@B0i*z9' //Rafael & Jason

];

let VALID_OBSERVER_API_KEYS = [
    'Y2}/Rhg:Tkrru(T&6K(n8uXojdhdu&3_GL',
    'YDs)giYcQ0O|J=bhg:Tkrru(T&dfgfdg6K9]',
    'wjAv9bvZdgfglhg:Tkrru(T&6KZJa+SAXA%$',
    'un$5lhdgdfgg:Tkrru(T&6KsMQuKw1_d-2{',
    's3olopRDThg:Tkrru(T&6fdgfKpgZ.s^',
    '-KffA7hg:Tkrru(T&6K-ZPfdgfkf1fY^Gs',
    '[VpBeOptl_#hg:Tkrru(Tdfgfg&6KYa9L',

    's3olopRDT?8L6Qq3#3g52}|6pgZ.s^', //Maiko + Mathieu
    '-KffA7u;~dC.J[r|3-ZPkf1fZXhY^Gs', //Mario + Thijs
    '[VpBeOptl_#hY`h3Jo,|?NCM8qYa9L', //Jan en Pieter-Jan
    '8y-&<#EA0dWI!uULnG4(_/h.c487|y', //Bert + Tom
    'Q^Fd;sHK3m<%T[f.E9#G.?L@B0i*z9' //Rafael & Jason
];

let VALID_ADMIN_API_KEY = 'R3a8FibuDreX"%G)kvn17>/}8;,#E1OoAAU{Dx?l(###XAm=4QL2lLTUlmj-{}A';

function isValidPlayerApiKey(apiKey) {
    return VALID_PLAYER_API_KEYS.indexOf(apiKey) >= 0;
}

function isValidObserverApiKey(apiKey) {
    return VALID_OBSERVER_API_KEYS.indexOf(apiKey) >= 0;
}

function isValidAdminApiKey(apiKey) {
    return VALID_ADMIN_API_KEY === apiKey;
}

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
    Players.forEach(function (player) {
        player.hole_cards = [];
    });
}

function BurnOneCard() {
    let card = Cards.shift();
    console.log("Burned:", card);
}

function ProvideOneCardToAllPlayers() {
    Players.forEach(function (player) {
        if (player.status !== "busted") {
            if (player.hole_cards.length < 2) {
                let card = Cards.shift();
                player.addHoleCards(card);
            }
        }
    });
}

function ProvideBoardCards(count) {
    for (let i = 0; i < count; i++) {
        let card = Cards.shift();
        gameState.board.push(card);
    }
}

function StartNewHand() {
    gameState.hand++;
    writeToChat(" -----> STARTING NEW HAND (hand: " + gameState.hand + ")");
    NewDeck();
    console.log("Cards", Cards);

    //enable all players that are waiting?
    Players.forEach(function (player) {
        if (player.status === 'waiting') {
            player.status = 'active';
        }
        player.last_action = '';
        player.hole_cards = [];
    });

    gameState.board = [];

    MoveDealerToNextPlayer();
    gameState.in_action = -1;
    gameState.largest_current_bet = 0;
    gameState.end_of_hand = false;

    writeToChat("Dealing hole cards");
    ProvideOneCardToAllPlayers();
    ProvideOneCardToAllPlayers();

    //increase small & big blind every 10th game
    if (gameState.hand % 10 === 0) {
        gameState.small_blind = gameState.small_blind * 2;
        gameState.big_blind = gameState.big_blind * 2;
        gameState.minimum_raise = gameState.big_blind;
        writeToChat("The small blind & big blind is doubled.");
        writeToChat("Minimal raise is now " + gameState.minimum_raise);
    }

    gameState.hand_started = true;

    ActivateGame(); //UTG is first player
    BroadcastGameState();
    BroadcastYourTurn();
    //TODO also deduct the bet from the stack (or only at the end?)

    //TODO: this will give the first turn to player under the gun (first turn should be for player after big blind)
}

function ProceedToNextRound() {
    if (OnlyOnePlayerLeft()) {
        gameState.end_of_hand = true;
        BroadcastGameState();
        if (AUTO_GAME) {
            EndHand();
        }
    } else if (gameState.board.length === 0) {
        BurnOneCard();
        ProvideBoardCards(3);
        writeToChat("Dealing the flop " + gameState.board);
        ResetLastActionForAllPlayers();
        gameState.largest_current_bet = 0;
        ActivateGame();
        BroadcastGameState();
        BroadcastYourTurn();
    } else if (gameState.board.length === 3) {
        BurnOneCard();
        ProvideBoardCards(1);
        writeToChat("Dealing the turn " + gameState.board);
        ResetLastActionForAllPlayers();
        gameState.largest_current_bet = 0;
        ActivateGame();
        BroadcastGameState();
        BroadcastYourTurn();
    } else if (gameState.board.length === 4) {
        BurnOneCard();
        ProvideBoardCards(1);
        writeToChat("Dealing the river " + gameState.board);
        ResetLastActionForAllPlayers();
        gameState.largest_current_bet = 0;
        ActivateGame();
        BroadcastGameState();
        BroadcastYourTurn();
    } else if (gameState.board.length === 5) {
        gameState.end_of_hand = true;
        BroadcastGameState();
        if (AUTO_GAME) {
            EndHand();
        }
    }
}

// -----------------------------------------------------------
// List of all players
// -----------------------------------------------------------
let Clients = [];
let Players = [];

function Client(uuid, connection) {
    this.uuid = uuid;
    this.name = '';
    this.connection = connection;
    this.status = 'not-joined'; //not-joined, player, observer, admin
    this.api_key = '';
}

function Player(uuid) {
    this.id = -1;
    this.uuid = uuid;
    this.name = "";
    this.status = "active";
    this.stack = 0;
    this.bet = 0;
    this.last_action = ""; // small_blind, big_blind, call, raise, fold
    this.attempt = 1;
    this.hole_cards = [];
    this.api_key = '';
}

Player.prototype = {
    addHoleCards: function (hand) {
        this.hole_cards.push(hand);
    },
    setBet: function (bet) {
        let allIn = false;
        let chipsToAddTobet = bet - this.bet;
        if (chipsToAddTobet > this.stack) {
            chipsToAddTobet = this.stack;
            allIn = true;
        }

        if(allIn){
            this.bet = this.stack;
            this.stack = 0;
        }

        if (this.stack >= chipsToAddTobet && bet > 0 && !allIn) {
            this.bet = bet;
            this.stack = this.stack - chipsToAddTobet;
        }

        gameState.pots[0].size = gameState.pots[0].size + chipsToAddTobet;
        if (gameState.pots[0].eligible_players.indexOf(this.id) === -1) {
            gameState.pots[0].eligible_players.push(this.id);
        }

        if (!allIn) {
            gameState.largest_current_bet = bet;
        }
        this.attempt = 1;
    },
    isValidTurn: function (bet, action) {
        if (typeof bet === 'undefined') {
            return false;
        }

        let options = GetPossibleOptionsForYourTurn(this);
        let validTurn = false;

        options.forEach(function(option) {
            if (option.action === action) {
                switch (option.action) {
                    case 'fold':
                        validTurn = true;
                        break;
                    case 'check':
                        validTurn = true;
                        break;
                    case 'call':
                        validTurn = true;
                        break;
                    case 'raise':
                        if (bet >= option.minimum && bet <= option.maximum) {
                            validTurn = true;
                        }
                        break;
                }
            }
        });

        return validTurn;
    },
    stillInTheRunning: function () {
        let inTheRunning = this.status !== 'busted' && this.status !== 'waiting' && this.last_action !== 'fold';
        if (inTheRunning && this.status === 'inactive' && this.stack === 0 && this.bet === 0) {
            inTheRunning = false;
        }
        return inTheRunning;
    },
    stillHasCredits: function () {
        return this.stack > 0 && this.status === 'active';
    },
};

//when joining (replace or add to Players list)
function AddOrReplacePlayer(playerToAdd) {
    let newPlayerList = [];

    let addedPlayer = false;
    Players.forEach(function (player) {
        if (player.api_key === playerToAdd.api_key) {
            writeToChat(player.name + " rejoined the game");
            playerToAdd.status = ((player.stack === 0 && player.bet === 0) ? 'busted' : 'active');
            playerToAdd.id = player.id;
            playerToAdd.stack = player.stack;
            playerToAdd.bet = player.bet;
            playerToAdd.last_action = player.last_action;
            playerToAdd.hole_cards = player.hole_cards;

            newPlayerList.push(playerToAdd);
            addedPlayer = true;
        } else {
            //existing player
            newPlayerList.push(player);
        }
    });

    if (!addedPlayer) {
        //new player
        newPlayerList.push(playerToAdd);

        if (gameState.game_started === true) {
            playerToAdd.status = "waiting";
        }
    }

    Players = newPlayerList;
}

function MoveDealerToNextPlayer() {
    let dealer = GetDealer();
    if (typeof dealer === 'undefined') {
        gameState.dealer = 0;
    } else {
        let nextDealer = GetNextActivePlayer(dealer, "move to next dealer");
        gameState.dealer = nextDealer.id;
    }
}

function ActivateGame() {
    if (gameState.board.length === 0) {
        let smallBlind = GetSmallBlind();
        smallBlind.setBet(gameState.small_blind);
        smallBlind.last_action = "small_blind";
        writeToChat(smallBlind.name + " posted small blind of " + gameState.small_blind + ', keeping ' + smallBlind.stack);

        let bigBlind = GetBigBlind();
        bigBlind.setBet(gameState.big_blind);
        bigBlind.last_action = "big_blind";
        writeToChat(bigBlind.name + " posted big blind of " + gameState.big_blind + ', keeping ' + bigBlind.stack);

        let firstPlayerToBet = GetNextActivePlayer(bigBlind, "first player");
        gameState.in_action = firstPlayerToBet.id;
        console.log("First player is", firstPlayerToBet.name)

        //gameState.largest_current_bet = firstPlayerToBet.bet;
    } else {
        let dealer = GetDealer();
        let firstPlayerToBet = GetNextActivePlayer(dealer, "for dealer");
        if (typeof firstPlayerToBet === 'undefined' ||  dealer.id === firstPlayerToBet.id) {
            //the dealer is the only one left
            gameState.end_of_hand = true;
            BroadcastGameState();
            if (AUTO_GAME) {
                EndHand();
            }
        } else {
            gameState.in_action = firstPlayerToBet.id;
            console.log("First player is", firstPlayerToBet.name);
        }

    }
}

let ACTION_TIMEOUT_FUNCTION = undefined;

function BroadcastGameState() {
    gameState.players = [];
    Players.forEach(function (player) {
        gameState.players.push({
            //public info
            uuid: player.uuid,
            name: player.name,
            id: player.id,
            stack: player.stack,
            bet: player.bet,
            last_action: player.last_action,
            status: player.status,

            //private info
            hole_cards: player.hole_cards,
            this_turn: gameState.in_action === player.id && gameState.in_action !== -1
        });
    });

    //share full game view with observers & admins
    Clients.forEach(function (client) {
        if (client.status === 'admin' || client.status === 'observer') {
            let message = JSON.stringify({
                'action': 'game_state',
                'data': gameState
            });
            client.connection.sendUTF(message);
        }
    });

    //share private game view to players
    Clients.forEach(function (client) {
        if (client.status === 'player') {
            gameState.players = [];

            Players.forEach(function (player) {
                if (client.uuid === player.uuid) {
                    gameState.players.push({
                        uuid: player.uuid,
                        name: player.name,
                        id: player.id,
                        stack: player.stack,
                        bet: player.bet,
                        last_action: player.last_action,
                        status: player.status,

                        //this is you
                        hole_cards: player.hole_cards,
                        api_key: player.api_key
                    });
                } else {
                    gameState.players.push({
                        uuid: player.uuid,
                        name: player.name,
                        id: player.id,
                        stack: player.stack,
                        bet: player.bet,
                        last_action: player.last_action,
                        status: player.status,
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

    //TODO-for every broadcast, save the game state in a file. filename = game id
}

function BroadcastYourTurn() {
    let client_to_send_your_turn = undefined;
    let attempt = 0;
    let player_to_send_your_turn = '';

    //share private game view to players
    Clients.forEach(function (client) {
        if (client.status === 'player') {

            Players.forEach(function (player) {
                if (client.uuid === player.uuid) {
                    if (gameState.in_action === player.id && gameState.in_action !== -1) {
                        client_to_send_your_turn = client;
                        attempt = player.attempt;
                        player_to_send_your_turn = player;
                        console.log("Sending Your Turn to: ", player.name);
                    }
                }
            });
        }
    });

    if (client_to_send_your_turn) {
        let message = JSON.stringify({
            'action': 'your_turn',
            'attempt': attempt,
            'options': GetPossibleOptionsForYourTurn(player_to_send_your_turn)

        });
        client_to_send_your_turn.connection.sendUTF(message);

        clearTimeout(ACTION_TIMEOUT_FUNCTION);
        ACTION_TIMEOUT_FUNCTION = setTimeout(function () {

            writeToChat("No response from this player, so folding! Suckers!");
            player_to_send_your_turn.last_action = 'fold';
            player_to_send_your_turn.attempt = 1;
            gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
                return index !== player_to_send_your_turn.id;
            });
            NextPersonOrEnd();

        }, TIME_TO_WAIT_FOR_RESPONSE);
    } else {
        writeToChat("Player not responding, so folding! Suckers!");
        player_to_send_your_turn.last_action = 'fold';
        player_to_send_your_turn.attempt = 1;
        gameState.pots[0].eligible_players = gameState.pots[0].eligible_players.filter(function (index) {
            return index !== player_to_send_your_turn.id;
        });
        NextPersonOrEnd();
    }
}

function GetPossibleOptionsForYourTurn(player) {
    let options = [];

    if (gameState.largest_current_bet > 0 && gameState.largest_current_bet !== player.bet) {
        options.push({
            'action': 'fold'
        });
        options.push({
            'action': 'call',
            'value': (gameState.largest_current_bet > player.stack ? player.stack : gameState.largest_current_bet)
        });
    }

    if (gameState.largest_current_bet === 0 || gameState.largest_current_bet === player.bet) {
        options.push({
            'action': 'check'
        });
    }

    if (gameState.largest_current_bet + gameState.minimum_raise <= player.stack) {
        options.push({
            'action': 'raise',
            'minimum': (gameState.largest_current_bet + gameState.minimum_raise),
            'maximum': player.stack
        });
    } else if (gameState.largest_current_bet > player.stack) {
        options.push({
            'action': 'raise',
            'minimum': (gameState.largest_current_bet + gameState.minimum_raise),
            'maximum': player.stack
        });
    }
    return options;
}

function BroadcastScoreBoard() {
    //share score board
    Clients.forEach(function (client) {
        let message = JSON.stringify({
            'action': 'score_board',
            'data': scoreBoard
        });
        client.connection.sendUTF(message);
    });
}

function BroadcastClientList() {
    let clientList = [];
    Clients.forEach(function (client) {
        clientList.push({
            uuid: client.uuid,
            name: client.name,
            status: client.status
        });
    });

    //share full game view with observers & admins
    Clients.forEach(function (client) {
        if (client.status === 'admin' || client.status === 'observer') {
            let message = JSON.stringify({
                'action': 'client_list',
                'data': clientList
            });
            client.connection.sendUTF(message);
        }
    });
}

function BroadcastAdminConfig() {

    let config = {
        'autoGame': AUTO_GAME,
        'autoRound': AUTO_ROUND
    };

    console.log("Admin Config", config);

    //share full game view with observers & admins
    Clients.forEach(function (client) {
        if (client.status === 'admin') {
            let message = JSON.stringify({
                'action': 'admin_config',
                'data': config
            });
            client.connection.sendUTF(message);
        }
    });
}

function OnlyOnePlayerLeft() {
    let playersLeft = Players.filter(function (player) {
        return player.stillInTheRunning();
    });

    return playersLeft.length === 1;
}

function PlayersLeftCount() {
    let playersLeft = Players.filter(function (player) {
        return player.stillInTheRunning();
    });

    return playersLeft.length;
}

function OnlyOnePlayerLeftWithCredits() {
    let playersLeftWithCredits = Players.filter(function (player) {
        return player.stillHasCredits();
    });

    return playersLeftWithCredits.length === 1;
}

function GetLastPlayerLeftWithCredits() {
    let playersLeftWithCredits = Players.filter(function (player) {
        return player.stillHasCredits();
    });

    return playersLeftWithCredits[0];
}

function EndOfBettingRound() {
    gameState.in_action = -1;

    console.log("End of betting round");
}

function RemovePlayer(playerToRemove) {
    //When user sends unjoin
    if (gameState.game_id === "") {
        //game didn't start yet
        Players = Players.filter(function (player) {
            return player.uuid !== playerToRemove.uuid;
        });
    } else {
        playerToRemove.status = "inactive";
    }
}

function RemoveClient(clientToRemove) {
    Clients = Clients.filter(function (client) {
        return client.uuid !== clientToRemove.uuid;
    });
}

function ShufflePlayers() {
    shuffle(Players);

    let index = 0;
    Players.forEach(function (player) {
        player.id = index;
        index++;
    });
}

function SetStackForAllPlayers() {
    Players.forEach(function (player) {
        player.stack = STARTING_CHIP_STACK;
        player.bet = 0;
    });
}

function GetCurrentPlayerInAction() {
    let nextPlayer = undefined;
    Players.forEach(function (currentPlayer) {
        if (nextPlayer === undefined && currentPlayer.id === gameState.in_action) {
            nextPlayer = currentPlayer;
        }
    });

    return nextPlayer;
}

function MoveInActionToNextPlayer() {
    let nextPlayer = GetNextActivePlayer(GetCurrentPlayerInAction(), "Mover");
    gameState.in_action = nextPlayer.id;
}

function ResetLastActionForAllPlayers() {
    Players.forEach(function (player) {
        if (player.last_action !== 'fold') {
            player.last_action = '';
        }
        player.bet = 0;
    });
}

function GetNextPlayer(player) {
    let nextId = player.id + 1;
    if (nextId >= Players.length) {
        nextId = 0;
    }

    let nextPlayer = undefined;
    Players.forEach(function (currentPlayer) {
        if (nextPlayer === undefined && currentPlayer.id === nextId) {
            nextPlayer = currentPlayer;
        }
    });

    return nextPlayer;
}

function GetNextActivePlayer(player, from) {
    console.log("from", from);

    let count = PlayersLeftCount();
    if (count === 0) {
        return undefined;
    }

    let nextPlayer = GetNextPlayer(player);
    if (nextPlayer.stillInTheRunning()) {
        return nextPlayer;
    }
    return GetNextActivePlayer(nextPlayer, from);
}

function GetDealer() {
    let dealer = undefined;
    Players.forEach(function (player) {
        if (dealer === undefined && player.id === gameState.dealer) {
            dealer = player;
        }
    });

    return dealer;
}

function GetSmallBlind() {
    let dealer = GetDealer();
    return GetNextActivePlayer(dealer);
}

function GetBigBlind() {
    let smallBlind = GetSmallBlind();
    return GetNextActivePlayer(smallBlind);
}

function NextPersonOrEnd() {
    if (OnlyOnePlayerLeftWithCredits()) {
        setTimeout(function () {
            gameState.game_started = false;
            gameState.end_of_hand = true;
            EndHand();
        }, SLOW_DOWN);
    } else if (OnlyOnePlayerLeft()) {
        setTimeout(function () {
            gameState.end_of_hand = true;
            EndHand();
        }, SLOW_DOWN);
    } else if (!DoesEveryoneHasEqualBets()) {
        MoveInActionToNextPlayer();
        setTimeout(function () {
            BroadcastGameState();
            BroadcastYourTurn();
        }, SLOW_DOWN);
    } else {
        EndOfBettingRound();
        setTimeout(function () {
            BroadcastGameState();
            if (AUTO_ROUND) {
                ProceedToNextRound();
            }
        }, SLOW_DOWN);
    }
}

function DoesEveryoneHasEqualBets() {
    let largestBet = gameState.largest_current_bet;
    let allEqualBets = true;
    Players.forEach(function (player) {
        if (player.status === 'active') {
            if ((player.last_action === 'raise' || player.last_action === 'call' || player.last_action === 'check') && player.bet !== largestBet) {
                allEqualBets = false;
            }
            if (player.last_action === '') {
                allEqualBets = false;
            }
            if ((player.last_action === 'small_blind' || player.last_action === 'big_blind')) {
                allEqualBets = false;
            }
        }
    });
    return allEqualBets;
}

function CalculateRanking() {
    let ranking = [];

    if (gameState.board.length !== 5) {
        ProvideBoardCards(5 - gameState.board.length);
    }
    let flop = gameState.board.join(' ');

    if (OnlyOnePlayerLeft()) { //TODO all-ins should count
        let winner = Players.filter(function (player) {
            return player.stillInTheRunning();
        })[0];

        ranking.push({
            uuid: winner.uuid,
            name: winner.name,
            description: "Single survivor",
            rank: 1
        });
    } else {
        Players.forEach(function (player) {
            if (player.last_action !== 'fold' && player.status !== 'waiting' && player.status !== 'busted' && player.status !== 'inactive') {
                let cards = player.hole_cards.join(' ') + ' ' + flop;
                const rank = rankBoard(cards);
                const description = rankDescription[rank];
                //TODO-hand ranking more specific

                writeToChat(player.name + " has " + description + "(" + rank + ") [" + cards + "]");

                ranking.push({
                    uuid: player.uuid,
                    name: player.name,
                    cards: cards,
                    description: description,
                    rank: rank
                });
            }
        });

    }

    //Sort on ranking
    ranking.sort((a, b) => (a.rank > b.rank) ? 1 : -1);
    gameState.ranking = ranking;
}

function GetNewGameId() {
    return Math.random().toString(36).substr(2, 9)
        + Math.random().toString(36).substr(2, 9);
}

function EndHand() {
    console.log("END of hand");
    CalculateRanking();
    DividePots();
    BroadCastEndOfHand();
    gameState.hand_started = false;
    gameState.in_action = -1;
    BroadcastGameState();

    scoreBoard = [gameState.ranking, ...scoreBoard];
    BroadcastScoreBoard();

    //reset
    ClearPlayerSpecificGameState();
    ClearSharedGameState();
    ClearRanking();

    RemovePlayersWithoutChips();

    if (OnlyOnePlayerLeftWithCredits()) {
        writeToChat("We have a winner!!!!");

        let lastPlayer = GetLastPlayerLeftWithCredits();
        AddPlayerToFinalRanking(lastPlayer);

        gameState.game_started = false;
        gameState.end_of_hand = true;
        BroadcastGameState();
    } else {
        if (AUTO_GAME && PlayersLeftCount() !== 0) {
            StartNewHand();
        }
    }
}

function AddPlayerToFinalRanking(player) {
    gameState.final_ranking = [{
        id: player.id,
        name: player.name
    }, ...gameState.final_ranking];
}

function DividePots() {
    if (gameState.ranking.length === 0) {
        return;
    }

    gameState.pots.forEach(function (pot) {
        // get the best hand
        let winningRank = gameState.ranking[0].rank; //TODO there is no ranking yet

        // Get all the rankings that match the hand for a split pot
        let winners = gameState.ranking.filter(function (player) {
            return player.rank === winningRank;
        });

        // Check each player if they are entitled to a part of the pot
        Players.forEach(function (player) {
            winners.forEach(function (winner) {
                if (player.uuid === winner.uuid) {
                    let equalPartOfThePot = Math.floor(pot.size / winners.length);
                    writeToChat(winner.name + " wins " + equalPartOfThePot + " chips with " + winner.description);
                    // give a player a port of the pot divided equally among winners
                    player.stack += equalPartOfThePot;
                }
            })
        });

        pot.size = 0;
    });
}

function ClearPlayerSpecificGameState() {
    Players.forEach(function (player) {
        player.hole_cards = [];
        player.bet = 0;
    });
}

function ClearSharedGameState() {
    gameState.board = [];
    //gameState.minimum_raise = 0;
    gameState.largest_current_bet = 0;
    gameState.in_action = -1;
    gameState.pots = [{
        "size": 0,
        "eligible_players": []
    }];
}

function BroadCastEndOfHand() {
    Clients.forEach(function (client) {
        let message = JSON.stringify({
            'action': 'end_of_hand',
            'data': gameState
        });
        client.connection.sendUTF(message);
    });
}

function ClearRanking() {
    gameState.ranking = [];
}

function ValidateTotalChipCount() {  // Check if all chips are accounted for
    if (gameState.game_started) {
        let totalChips = 0;
        let expectedChipsTotal = Players.length * STARTING_CHIP_STACK;
        Players.forEach(function (player) {
            totalChips += player.stack;
        });
        gameState.pots.forEach(function (pot) {
            totalChips += pot.size;
        });

        if (totalChips !== expectedChipsTotal) {
            writeToChat("[ERROR] CHIP COUNT FAILED: " + (expectedChipsTotal - totalChips) + " chips are missing")
        }
    }
}

function writeToChat(msg) {
    if (ENABLE_SERVER_LOGS) {
        console.log(msg);
    }

    gameState.chat = [{
        timestamp: Date.now(),
        msg: msg
    }, ...gameState.chat];
}

function RemovePlayersWithoutChips() {  // Bust all players without chips
    Players.forEach(function (player) {
        if (player.stack === 0 && player.status !== 'busted') {
            writeToChat(player.name + " has no chips remaining");
            player.status = 'busted';
            AddPlayerToFinalRanking(player);
        }
    });
}



