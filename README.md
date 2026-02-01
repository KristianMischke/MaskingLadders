# Masked Ladders

2-6 Players

Snakes and Ladders with a twist.
Play cards to impact the game board.
Redact cards you pass to your opponents.
Score points by collecting coins and reaching the final square.
Watch out for bombs.

## How to Play:

Each turn you get to perform the following actions in any order:
- Draw at least 1 card or up to a hand size of 4
- Play at least 1 card or until you have a hand size of 4
- Roll the die to move your piece

Then you will:
- Redact a card of your choice
- Pass a card to your opponent

Then the game moves to the next player


## Rules:

If your piece lands on a...
- ladder: it will climb up
- shoot: it will slide down
- coin: you get 25 points
- bomb: you lose 30 points and neighboring objects are deleted
- the last square: you get 100 points and the game ends

Game ends when either:
- All players run out of cards
- Or, a player's piece lands on the final square at the top.


## Running Game Locally in Dev mode:

- Download the project
- Install npm: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Install project dependencies:
 
```sh
npm install
```
 
```sh
npx vite --port 8080
```

- Navigate to http://localhost:8080

## Build the Game

Build into single file

```sh
npx vite build
```
