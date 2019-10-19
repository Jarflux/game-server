<template>
  <div id="app">
    <h2>Game ID: {{ gamestate.game_id }}</h2>

    <div class="table container" v-if="connection.connected">
      <div class="players row">
        <div :class="['player', `player--${player.status}`, (player.id === gamestate.in_action) ? 'player--in_action' : '']" v-for="player in gamestate.players">
          <div class="name">{{ player.name }} {{ player.id }} <img class="dealer-button" src="./assets/dealer-button.png" v-if="player.id === gamestate.dealer"/></div>
          <div class="chips-stack">{{ player.stack }}</div>

          <div :class="['hole-cards', `hole-cards--${player.status}`]" >
            <div class="playing-card" v-for="card in player.hole_cards">
              <vue-playing-card  v-bind:signature="card" style="width:75px;"></vue-playing-card>
            </div>
          </div>

          <div v-if="player.bet > 0" class="bet">{{ player.bet }}</div>

        </div>
      </div>

      <div class="pot" v-if="connection.connected">Pot: {{ gamestate.pot }}</div>

      <div class="board row">
        <div class="playing-card" v-for="card in gamestate.board">
          <vue-playing-card v-bind:signature="card" style="width:100px;"></vue-playing-card>
        </div>
      </div>
    </div>

    <button v-on:click="testAction">Test</button>
    <br /><br />
    <button v-on:click="join" v-if="!connection.joined">Join</button>
    <button v-on:click="unjoin" v-if="connection.joined">Unjoin</button>

    <br /><br />
    <button v-on:click="startGame" v-if="connection.joined">Start game</button>
    <button v-on:click="startRound" v-if="connection.joined">Start round</button>

  </div>
</template>

<script>
  import Vue from 'vue';
  import VuePlayingCard from 'vue-playing-card';
  import gamestate from './json/game-state.json'
  import VueNativeSock from 'vue-native-websocket'

  let connection = {
      connected: false,
      joined: false
  };

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
        testAction: function(val) {
            gamestate.in_action++;
            if (gamestate.in_action >= gamestate.players.length) {
                gamestate.in_action = 0;
            }
        },

        join: function(val) {
            const data = { action:'admin', data: 'Admin Panel' };
            this.$socket.sendObj(data);
        },

        unjoin: function(val) {
            const data = { action:'unjoin', data: 'Admin Panel' };
            this.$socket.sendObj(data);
        },

        startGame: function(val) {
            const data = { action:'new_game' };
            this.$socket.sendObj(data);
        },

        startRound: function(val) {
            const data = { action:'new_round' };
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

                    break;
                case "connected":
                   console.log("Connected");
                   connection.connected = true;
                   break;
                case "joined":
                    console.log("Joined");
                    connection.joined = true;
                    break;
                case "unjoined":
                    console.log("Unjoined");
                    connection.joined = false;
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
