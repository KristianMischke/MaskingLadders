import JSONCrush from "jsoncrush";
import {GameAction, GameActionType, GameState, GameType} from './gamelogic';

function setupGameHooks(game: GameState) {
    game.submitActionCallback = () => {
        console.log("saving game");
        localStorage.setItem("game", game.saveToJson());
    };

    game.onTurnChangeCallback = () => {
        if (game.gameType === GameType.PBEM) {
            console.log("Creating PBEM share link");
            window.hideGame = true;

            let legerJson = JSON.stringify(game.leger);
            let crushedJson = JSONCrush.crush(legerJson);

            const pbemUrl = new URL(document.URL);
            pbemUrl.search = '';
            pbemUrl.searchParams.append('pbem', crushedJson);

            navigator.clipboard.writeText(pbemUrl.toString()).then(function () {
                console.log('Async: Copying to clipboard was successful!');
            }).catch(function (err) {
                console.error('Async: Could not copy text: ', err);
                alert('Failed to copy text.');
            });
            localStorage.removeItem("game");
        }
    };

    window.game = game;
}

window.onload = () => {
    let pbemData = new URLSearchParams(window.location.search).get('pbem');
    if (pbemData) {
        // clear url
        const url = new URL(window.location.href);
        url.search = ''
        window.history.pushState(null, '', url.toString());

        let legerObj = JSON.parse(JSONCrush.uncrush(pbemData));
        let game = new GameState();
        game.reconstructFromLeger(legerObj);
        setupGameHooks(game);
    } else {
        window.hasSavedGame = localStorage.getItem("game") != null;
    }
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
    let game = new GameState(null, GameType.PassAndPlay);

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

export function startPBEMGame(numPlayers: number) {
    let game = new GameState(null, GameType.PBEM);

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
