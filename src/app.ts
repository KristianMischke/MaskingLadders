import JSONCrush from 'jsoncrush';
import {GameState, Player} from './gamelogic';

window.onload = () => {
    let localGame = localStorage.getItem("game");
    if (localGame) {
        if (window.confirm("Found saved local game, continue?")) {
            let game = new GameState();
            game.loadFromSave(localGame)
            console.log("loaded local game", game);
            window.game = game;
        } else {
            localStorage.removeItem("game");
        }
    }
}

const PLAYER_COLORS = [
    "#FF0077",
    "#00FFFF",
    "#CC7700",
    "#00FF00",
    "#7700FF",
    "#FFFF77",
]

export function startPassAndPlayGame(numPlayers: number) {
    let game = new GameState();

    for (let i = 0; i < numPlayers; i++) {
        game.players.push({
            id: i.toString(),
            name: "P" + i,
            color: PLAYER_COLORS[i],
            hand: [],
        } as Player)
    }
    game.setupBoard(8, 8);
    game.generateDeck();
    game.shuffleDeck();
    game.dealCards();
    game.currentPlayerId = game.players[0].id;

    window.game = game;
    localStorage.setItem("game", game.saveToJson());
    // localStorage.setItem("crush", JSONCrush.crush(gameJson))
}