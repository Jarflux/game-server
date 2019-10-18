# admin-panel

> Admin panel to monitor and interact with the game state of the hackathon server

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).


Example JSON that is used to represent the game state

```json
{
  "game_id": "550da1cb2d909006e90004b1",
  "small_blind": 10,
  "big_blind": 20,
  "largest_current_bet": 300,
  "pot": 450,
  "minimum_raise": 500,
  "dealer": 1,
  "in_action": 0,
  "players": [
    {
      "id": 0,
      "name": "Anne",
      "status": "active",
      "stack": 1010,
      "bet": 0,
      "hole_cards": [ "7d", "2c" ]
    },
    {
      "id": 1,
      "name": "Ben",
      "status": "active",
      "stack": 1500,
      "bet": 0,
      "hole_cards": ["Qc","Qh"]
    },
    {
      "id": 2,
      "name": "Charlotte",
      "status": "active",
      "stack": 2000,
      "bet": 50,
      "hole_cards": ["Js","Ks"]
    },
    {
      "id": 3,
      "name": "David",
      "status": "active",
      "stack": 2140,
      "bet": 100,
      "hole_cards": ["3h","4s"]
    },
    {
      "id": 4,
      "name": "Elisa",
      "status": "active",
      "stack": 3600,
      "bet": 300,
      "hole_cards": ["Ah","Kh"]
    },
    {
      "id": 5,
      "name": "Finn",
      "status": "folded",
      "stack": 550,
      "bet": 0,
      "hole_cards": ["8d","Td"]
    },
    {
      "id": 6,
      "name": "Gregory",
      "status": "out",
      "stack": 0,
      "bet": 0,
      "hole_cards": []
    }
  ],
  "board": ["Ad","Qd","9h","9d","Jc"]
}
```
