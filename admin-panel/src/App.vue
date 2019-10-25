<template>
  <div id="app">
    <div v-if="gamestate.game_id !== 'start'">

      <h2>Game ID: {{ gamestate.game_id }}</h2>

      <div class="table container" v-if="connection.connected">
        <div class="players row">
          <div :class="['player', `player--${player.status}`, (player.id === gamestate.in_action) ? 'player--in_action' : '']" v-for="player in gamestate.players">
            <div class="name">{{ player.name }} <img class="dealer-button" src="./assets/dealer-button.png" v-if="player.id === gamestate.dealer"/></div>
            <div class="chips-stack">{{ player.stack }}</div>

            <div :class="['hole-cards', `hole-cards--${player.status}`]" >
              <div class="playing-card" v-for="card in player.hole_cards">
                <vue-playing-card  v-bind:signature="card" style="width:75px;"></vue-playing-card>
              </div>
            </div>

            <div v-if="player.bet > 0" class="bet">{{ player.bet }} - {{ player.last_action }}</div>

          </div>
        </div>

      <div class="pot" v-if="connection.connected" v-for="pot in gamestate.pots">Pot: {{ pot.value }}, Players: {{ pot.eligle_players }}</div>

        <div class="larget-bet" v-if="connection.connected">Largest bet: {{ gamestate.largest_current_bet }}</div>

        <div class="board row">
          <div class="playing-card" v-for="card in gamestate.board">
            <vue-playing-card height="90" v-bind:signature="card" style="width:100px;"></vue-playing-card>
          </div>
        </div>
      </div>

    </div>

    <button v-on:click="join" v-if="!connection.joined">Join</button>
    <button v-on:click="unjoin" v-if="connection.joined">Unjoin</button>

    <br /><br />
    <button v-on:click="startGame" v-if="connection.joined && gamestate.players.length > 1">Start game</button>
    <button v-on:click="startHand" v-if="connection.joined && gamestate.players.length > 1">Start hand</button>
    <button v-on:click="nextBettingRound" v-if="connection.joined && gamestate.dealer !== -1 && gamestate.in_action === -1 && !gamestate.end_of_hand">Next betting round</button>
    <button v-on:click="closeHand" v-if="connection.joined && gamestate.dealer !== -1 && gamestate.in_action === -1 && gamestate.end_of_hand && gamestate.ranking.length === 0">Get ranking & assign pot</button>

    <div class="ranking" v-if="gamestate.ranking.length > 0">
      <h3>Ranking</h3>
      <ol v-for="rank in gamestate.ranking">
        <li>{{ rank.name }} - {{ rank.description }} ({{ rank.rank }})</li>
      </ol>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import VuePlayingCard from 'vue-playing-card';
  import VueNativeSock from 'vue-native-websocket'

  const API_KEY = 'R3a8FibuDreX"%G)kvn17>/}8;,#E1OoAAU{Dx?l(###XAm=4QL2lLTUlmj-{}A';

  let connection = {
      connected: false,
      joined: false,
  };

  let gamestate = {
      game_id: "start",
      players: []
  };

  gamestate.ranking = [];

  Vue.use(VueNativeSock, 'ws://localhost:8081', {
      protocol: 'echo-protocol',
      format: 'json',

      reconnection: true, // (Boolean) whether to reconnect automatically (false)
      reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
      reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
  });

  Vue.use(VuePlayingCard);

  export default {
    name: 'app',
    data() {
      return {
          gamestate: gamestate,
          connection: connection
      }
    },
    methods: {
        join: function(val) {
            const data = { action:'admin', data: 'Admin Panel', api_key: API_KEY };
            this.$socket.sendObj(data);
        },
        unjoin: function(val) {
            const data = { action:'unjoin', data: 'Admin Panel', api_key: API_KEY };
            this.$socket.sendObj(data);
        },
        startGame: function(val) {
            const data = { action:'new_game', api_key: API_KEY };
            this.$socket.sendObj(data);
        },
        startHand: function(val) {
            const data = { action:'new_hand', api_key: API_KEY };
            this.$socket.sendObj(data);
        },
        nextBettingRound: function(val) {
            const data = { action:'next_betting_round', api_key: API_KEY };
            this.$socket.sendObj(data);
        },
        closeHand: function(val) {
            const data = { action:'close_hand', api_key: API_KEY };
            this.$socket.sendObj(data);
        }
    },
    created () {
        this.$options.sockets.onmessage = (data) => {
            let message = JSON.parse(data.data);

            console.log(message);

            switch (message.action) {
                case "game_state":
                    let newGameState = message.data;
                    gamestate.players = newGameState.players;
                    gamestate.in_action = newGameState.in_action;
                    gamestate.dealer = newGameState.dealer;
                    gamestate.game_id = newGameState.game_id;
                    gamestate.small_blind = newGameState.small_blind;
                    gamestate.big_blind = newGameState.big_blind;
                    gamestate.largest_current_bet = newGameState.largest_current_bet;
                    gamestate.pot = newGameState.pot;
                    gamestate.minimum_raise = newGameState.minimum_raise;
                    gamestate.board = newGameState.board;
                    gamestate.ranking = [];
                    gamestate.end_of_hand = newGameState.end_of_hand;

                    break;
                case "connected":
                   console.log("Connected");
                   connection.connected = true;
                   break;
                case "success":
                    if (message.data === 'joined') {
                        console.log("Joined");
                        connection.joined = true;
                    } else if (message.data === 'unjoined') {
                        console.log("Unjoinned");
                        connection.joined = false;
                    }
                    break;
                case "error":
                    if (message.data === 'invalid-key') {
                        console.error("Invalid KEY");
                    }
                    break;
                case "end_of_hand":
                    console.log("End of game");
                    gamestate.ranking = message.data;
                    break;
                default:
                    console.log(message);
                    break;
            }
        };
    }
  }
</script>

<style lang="scss">
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }

  .table {
    .players {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;

      .player {
        padding: 10px;
        min-width: 150px;

        &--in_action{
          background:lightgreen;
        }

        &--out{
          filter: contrast(50%) opacity(100%) grayscale(50%);
          background:gray;
        }

        &--inactive {
          color: red;
        }

        .name{
          font-size: 24px;
          line-height: 40px;

        }

        .dealer-button{
          width:30px;
        }

        .hole-cards {
          display:flex;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: center;

          &--folded{
            filter: contrast(25%) opacity(80%) grayscale(0%);
          }

        }
      }
    }

    .pot{
      margin:40px;
    }

    .board {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: center;

      margin:40px;
    }
  }
</style>
