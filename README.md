# Poker Game Hackathon.

# Build and Start Poker Server
cd server-npm 
npm install
node server.js

# Build and Start Poker Client
cd client-npm 
npm install
node client.js

# Start Poker Game
cd client-npm 
node observe-and-start-game.js

# GameState JSON
Example JSON that is used to represent the game state


Notes:
Every player will only see his own hole_cards and api_key.

```json
{
	"game_id": "550da1cb2d909006e90004b1",
	"small_blind": 10,
	"big_blind": 20,
	"largest_current_bet": 300,
	"pots": [{
		"size": 450,
		"eligle_players": [1, 2]
	}],
	"minimum_raise": 500,
	"dealer": 1,
	"in_action": 0,
	"game_started": true,
	"hand_started": true,
	"end_of_hand": true,
	"players": [{
			"id": 0,
			"uuid": "CpTKgYbvJhXrUBXdPLM64g==",
			"name": "Anne",
			"status": "active",
			"stack": 1010,
			"bet": 0,
			"hole_cards": ["7d", "2c"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 1,
			"name": "Ben",
			"uuid": "koiugyhjokplkjnbnk",
			"status": "active",
			"stack": 1500,
			"bet": 0,
			"hole_cards": ["Qc", "Qh"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 2,
			"uuid": "uyftcvhjkljhuyui",
			"name": "Charlotte",
			"status": "active",
			"stack": 2000,
			"bet": 50,
			"hole_cards": ["Js", "Ks"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 3,
			"uuid": "uyftcvhjkljhuyui",
			"name": "David",
			"status": "active",
			"stack": 2140,
			"bet": 100,
			"hole_cards": ["3h", "4s"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 4,
			"uuid": "uyftcvhjkljhuyui",
			"name": "Elisa",
			"status": "active",
			"stack": 3600,
			"bet": 300,
			"hole_cards": ["Ah", "Kh"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 5,
			"uuid": "uyftcvhjkljhuyui",
			"name": "Finn",
			"status": "folded",
			"stack": 550,
			"bet": 0,
			"hole_cards": ["8d", "Td"],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		},
		{
			"id": 6,
			"uuid": "uyftcvhjkljhuyui",
			"name": "Gregory",
			"status": "out",
			"stack": 0,
			"bet": 0,
			"hole_cards": [],
			"api_key": "YDs)giYcQ0O|J=bhg:Tkrru(T&6K9]"
		}
	],
	"board": ["Ad", "Qd", "9h", "9d", "Jc"],
	"ranking": [{
			"uuid": "DbcxjB5jHkLwSrEfJQYDsQ==",
			"name": "Anne",
			"cards": "6s 2s 6c 6d Qc 9c As",
			"description": "Three of a Kind",
			"rank": 5
		},
		{
			"uuid": "6TfNIrn3arUhOl7wEzjCSw==",
			"name": "Ben",
			"cards": "Kh 2c 6c 6d Qc 9c As",
			"description": "One Pair",
			"rank": 7
		}
	],
	"chat": [{
			"timestamp": 1573771593227,
			"msg": "Ben placed a bet of 50"
		},
		{
			"timestamp": 1573771593227,
			"msg": "Anne called"
		}, {
			"timestamp": 1573771593227,
			"msg": "Anne wins 500 chips with Three of a kind"
		}
	],
	"final_ranking": [{
		"id": 0,
		"uuid": "CpTKgYbvJhXrUBXdPLM64g==",
		"name": "Anne"
	}, {
		"id": 1,
		"uuid": "CpTKgYbvJhXrUBXdPLM64g==",
		"name": "Ben"
	}, {
		"id": 2,
		"uuid": "CpTKgYbvJhXrUBXdPLM64g==",
		"name": "Charlotte"
	}]

}
```