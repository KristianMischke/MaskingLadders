import JSONCrush from 'jsoncrush';
import {GameAction, GameActionType, GameState, Player} from './gamelogic';

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



export function startPassAndPlayGame(numPlayers: number) {
    let game = new GameState();

    game.submitAction({
        action: GameActionType.CreatePlayers,
        numPlayers,
    } as GameAction);
    game.submitAction({
        action: GameActionType.SetupBoard,
        boardWidth: 8,
        boardHeight: 8,
    } as GameAction);
    game.submitAction({action: GameActionType.GenerateDeck} as GameAction);
    game.submitAction({action: GameActionType.ShuffleDeck} as GameAction);
    game.submitAction({action: GameActionType.DealCards} as GameAction);

    localStorage.setItem("game", game.saveToJson());
    setupGameHooks(game);
}