<template>
  <div id="app">
    <h2>Game ID: {{ game_id }}</h2>

    <div class="table container">
      <div class="players row">
        <div :class="['player', `player--${player.status}`, (player.id === in_action) ? 'player--in_action' : '']" v-for="player in players">
          <div class="name">{{ player.name }} <img class="dealer-button" src="./assets/dealer-button.png" v-if="player.id === dealer"/></div>
          <div class="chips-stack">{{ player.stack }}</div>

          <div :class="['hole-cards', `hole-cards--${player.status}`]" >
            <div class="playing-card" v-for="card in player.hole_cards">
              <vue-playing-card  v-bind:signature="card" width="75"></vue-playing-card>
            </div>
          </div>

          <div v-if="player.bet > 0" class="bet">{{ player.bet }}</div>

        </div>
      </div>

      <div class="pot">Pot: {{ pot }}</div>

      <div class="board row">
        <div class="playing-card" v-for="card in board">
          <vue-playing-card v-bind:signature="card" width="100"></vue-playing-card>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import Vue from 'vue';
  import VuePlayingCard from 'vue-playing-card';
  import gamestate from './json/game-state.json'

  Vue.use(VuePlayingCard);

  export default {
    name: 'app',
    data() {
      return gamestate
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
