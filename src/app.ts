import JSONCrush from 'jsoncrush';
import {GameState, Player} from './gamelogic';

function setupGameHooks(game: GameState) {
    game.submitActionCallback = () => {
        console.log("saving game");
        localStorage.setItem("game", game.saveToJson());
        // localStorage.setItem("crush", JSONCrush.crush(gameJson))
    }

    window.game = game;
}

window.onload = () => {
    window.hasSavedGame = localStorage.getItem("game") != null;
}

export function loadSavedGame() {
    let localGame = localStorage.getItem("game");
    if (localGame) {
        let game = new GameState();
        game.loadFromSave(localGame)
        console.log("loaded local game", game);
        setupGameHooks(game);
    }
}

export function removeSavedGame() {
    localStorage.removeItem("game");
    window.hasSavedGame = false;
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
            id: game.getNextId(),
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

    localStorage.setItem("game", game.saveToJson());
    setupGameHooks(game);
}