import seedrandom from 'seedrandom';

const MAX_HAND_SIZE = 4;
const PLAYER_COLORS = [
    "#FF0077",
    "#00FFFF",
    "#CC7700",
    "#00FF00",
    "#7700FF",
    "#FFFF77",
]

export enum RedactType {
    Action = 'action',
    TargetType = 'targetType',
    PieceType = 'pieceType',
    PlacePieceType = 'placePieceType',
    X = 'x',
    Dir = 'dir',
}
export enum Direction {
    Fwd = 'forward',
    Bck = 'backward'
}

export enum PieceType {
    Pawn = 'pawn',
    Ladder = 'ladder',
    Shoot = 'shoot',
    Bomb = 'bomb',
    Coin = 'coin',
    Anything = 'things'
}

export enum SelectPieceType {
    // Note: All & Target require a pieceType
    All = 'all',
    Target = 'target',
    Self = 'self',
    Other = 'other'
}

export enum SelectObjectType {
    All = 'all',
    Target = 'target',
    Self = 'self',
    Other = 'other',

    Card = 'card',
    Tile = 'tile'
}

export enum CardAction {
    Move = 'move',
    Grow = 'grow',
    Shrink = 'shrink',
    Remove = 'remove',
    Place = 'place',
    Draw = 'draw',
    Skip = 'skip'
}

export enum MaskType {
    Clown = 'clown',
    Joker = 'joker',
    Gas = 'gas',
    N95 = 'n95',
    Schrodinger = 'schrodinger',
    Japanese = 'japanese'
}

function selectRandom<T>(rng: seedrandom.PRNG, list: T[]) {
    const i = Math.floor(rng() * list.length);
    return list[i];
}

export enum MaskOrMystery {
    Mask = 999,
    Mystery = 9999,
}

interface MaskedDataProps<T> {
    index: number;
    options: T[];
    isMasked: boolean;
    isMystery: boolean;
}
export class MaskedData<T> implements MaskedDataProps<T> {
    index: number;
    options: T[];
    isMasked: boolean;
    isMystery: boolean;
    // constructor(options: T[], index: number | T, isMasked = false, isMystery = false) {
    constructor({options, index, isMasked = false, isMystery = false}: {options: T[], index: number | T, isMasked?: boolean, isMystery?: boolean}) {
        this.options = options;
        if (typeof index === 'number') {
            this.index = index;
        } else {
            this.index = options.indexOf(index);
        }
        if (options.length > 1) {
            this.isMasked = isMasked;
            this.isMystery = isMystery;
        } else {
            this.index = 0;
            this.isMasked = false;
            this.isMystery = false;
        }
    }

    getKnownData() {
        if (this.isMasked) return MaskOrMystery.Mask;
        if (this.isMystery) return MaskOrMystery.Mystery;
        return this.options[this.index];
    }
    revealData(rng: seedrandom.PRNG) {
        if (this.isMystery) {
            return selectRandom(rng, this.options);
        }
        return this.options[this.index];
    }
}

export class ActionTarget {
    targetType: MaskedData<SelectPieceType|SelectObjectType>;
    pieceType: MaskedData<PieceType>;
    constructor(targetType: MaskedData<SelectPieceType|SelectObjectType>, pieceType: MaskedData<PieceType>) {
        this.targetType = targetType;
        this.pieceType = pieceType;
    }

    revealData(rng: seedrandom.PRNG) {
        let revealedTargetType = this.targetType.revealData(rng);
        if (revealedTargetType === SelectPieceType.All || revealedTargetType === SelectPieceType.Target) {
            return [revealedTargetType, this.pieceType.revealData(rng)];
        }
        return [revealedTargetType, undefined];
    }
}

export interface Card {
    id: string;
    action: MaskedData<CardAction>;
    actionTarget?: ActionTarget;
    placePieceType?: MaskedData<PieceType>;
    x?: MaskedData<number>;
    dir?: MaskedData<Direction>;
}

export interface RevealedCard {
    id: string;
    action: CardAction;
    targetType: SelectPieceType|SelectObjectType;
    pieceType?: PieceType;
    placePieceType?: PieceType;
    x?: number;
    dir?: Direction;
}

export interface Player {
    id: string;
    name: string;
    color: string;
    hand: Card[];
    score: number;
}


export interface BoardPiece {
    id: string;
    type: PieceType;
    x: number;
    y: number;
    playerId?: string;
    mask?: MaskType;
}

export interface LongBoardPiece extends BoardPiece {
    x2: number;
    y2: number;
}

function generateCard(id: string, rng: seedrandom.PRNG, action: CardAction) {
    let maskedAction = new MaskedData({options: Object.values(CardAction), index: action});
    let actionTarget = new ActionTarget(
        new MaskedData({options: Object.values(SelectPieceType), index:Math.floor(rng() * Object.values(SelectPieceType).length)}),
        new MaskedData({options: Object.values(PieceType), index: Math.floor(rng() * Object.values(PieceType).length)}),
    );
    let options = [1, 2, 3];
    let x = new MaskedData({options, index: Math.floor(rng() * options.length)});
    let dir = new MaskedData({options: Object.values(Direction), index: Math.floor(rng() * Object.values(Direction).length)});
    let placePieceType = undefined;

    if (action === CardAction.Place || action === CardAction.Remove) {
        placePieceType = new MaskedData({options: Object.values(PieceType), index: Math.floor(rng() * Object.values(PieceType).length)});
    }
    if (action === CardAction.Grow || action === CardAction.Shrink) {
        actionTarget = new ActionTarget(
            new MaskedData({options: [SelectPieceType.Target], index: 0}),
            new MaskedData({options: [PieceType.Ladder, PieceType.Shoot], index: Math.floor(rng() * 2)})
        );
        x = undefined;
        dir = undefined;
    }
    if (action === CardAction.Draw || action === CardAction.Skip) {
        actionTarget = undefined;
        dir = undefined;
    }
    return {id, action: maskedAction, actionTarget, x, dir, placePieceType} as Card;
}

export enum GameActionType {
    InitGame = 'initGame',
    CreatePlayers = 'createPlayers',
    SetupBoard = 'setupBoard',
    GenerateDeck = 'generateDeck',
    ShuffleDeck = 'shuffleDeck',
    DealCards = 'dealCards',

    MovePawn = 'movePawn',
    PlayCard = 'playCard',
    CardAction = 'cardAction',
    RedactCard = 'redactCard',
    PassCard = 'passCard',
    DrawCard = 'drawCard',
    EndTurn = 'endTurn',
}

export interface GameAction {
    playerId: string;
    action: GameActionType;
    cardId: string | null;

    revealedCard: RevealedCard | null;
    targetPieceId: string | null;
    targetTileId: string | null;
    targetCardId: string | null;
    dieRollResult: number | null;
    boardWidth: number | null;
    boardHeight: number | null;
    numPlayers: number | null;
    rngState: seedrandom.State.Arc4 | null;
    redactType: RedactType | null;
}

export class GameState {
    private rng: seedrandom.StatefulPRNG<seedrandom.State.Arc4>;
    private nextId: number;
    boardWidth: number;
    boardHeight: number;
    players: Player[];
    deck: Card[];
    pieces: BoardPiece[];
    leger: GameAction[];
    currentPlayerId: string;

    submitActionCallback?: () => void;
    constructor(seed?: string) {
        this.rng = seedrandom(seed, {state: true});
        this.nextId = 0;
        this.players = [];
        this.deck = [];
        this.pieces = [];
        this.leger = [{
            action: GameActionType.InitGame,
            rngState: this.rng.state(),
        } as GameAction];
        this.currentPlayerId = '';
    }

    saveToJson() {
        let obj = {
            rngState: this.rng.state(),
            ...this
        };
        return JSON.stringify(obj);
    }

    loadFromSave(saveJson: string) {
        let obj = JSON.parse(saveJson);
        this.rng = seedrandom("", {state: obj.rngState});
        this.nextId = obj.nextId;
        this.boardWidth = obj.boardWidth;
        this.boardHeight = obj.boardHeight;
        this.players = obj.players;
        this.deck = obj.deck;
        this.pieces = obj.pieces;
        this.leger = obj.leger;
        this.currentPlayerId = obj.currentPlayerId;

        let fixCardMaskedDataObjects = (card: Card) => {
            card.action = new MaskedData<CardAction>(card.action)
            if (card.actionTarget) {
                card.actionTarget = new ActionTarget(
                    new MaskedData<SelectPieceType | SelectObjectType>(card.actionTarget.targetType),
                    new MaskedData<PieceType>(card.actionTarget.pieceType)
                );
            }
            if (card.x) card.x = new MaskedData<number>(card.x);
            if (card.dir) card.dir = new MaskedData<Direction>(card.dir);
            if (card.placePieceType) card.placePieceType = new MaskedData<PieceType>(card.placePieceType);
        }
        this.deck.forEach(fixCardMaskedDataObjects);
        this.players
            .map(p => p.hand)
            .forEach(hand =>
                hand.forEach(fixCardMaskedDataObjects)
            );
    }

    private getNextId() {
        this.nextId++;
        return this.nextId.toString();
    }

    private createPlayers(numPlayers: number) {
        for (let i = 0; i < numPlayers; i++) {
            this.players.push({
                id: this.getNextId(),
                name: "P" + i,
                color: PLAYER_COLORS[i],
                hand: [],
                score: 0,
            } as Player)
        }
        this.currentPlayerId = this.players[0].id;
    }

    private setupBoard(width: number, height: number) {
        this.boardWidth = width;
        this.boardHeight = height;
        for (let y = 0; y < height; y++) {
            if (y + 1 < height && this.rng() < 0.5) {
                // place a ladder randomly on this row
                let x = Math.floor(this.rng() * width);
                let x2 = Math.max(Math.min(x + Math.floor(this.rng() * 5) - 2, width - 1), 0);
                let y2 = Math.min(y + Math.ceil(this.rng() * 3), height - 1);
                this.pieces.push({id: this.getNextId(), type: PieceType.Ladder, x, y, x2, y2} as LongBoardPiece);
            }
            if (y > 0 && this.rng() < 0.7) {
                // place a shoot randomly on this row
                let x = Math.floor(this.rng() * width);
                let x2 = Math.max(Math.min(x + Math.floor(this.rng() * 5) - 2, width - 1), 0);
                let y2 = Math.max(y - Math.ceil(this.rng() * 3), 0);
                this.pieces.push({id: this.getNextId(), type: PieceType.Shoot, x, y, x2, y2} as LongBoardPiece);
            }
            if (y > 0 && this.rng() < 0.3) {
                // place a coin randomly on this row
                let x = Math.floor(this.rng() * width);
                this.pieces.push({id: this.getNextId(), type: PieceType.Coin, x, y} as BoardPiece);
            }
            if (y > 0 && this.rng() < 0.15) {
                // place a bomb randomly on this row
                let x = Math.floor(this.rng() * width);
                this.pieces.push({id: this.getNextId(), type: PieceType.Bomb, x, y} as BoardPiece);
            }
        }
        // add player pawns
        for (let i = 0; i < this.players.length; i++) {
            this.pieces.push({id: this.getNextId(), type: PieceType.Pawn, x: 0, y: 0, playerId: this.players[i].id});
        }
    }

    private generateDeck() {
        // generate 10 cards for each card type
        for (let i = 0; i < 10; i++) {
            this.deck.push(generateCard(this.getNextId(), this.rng, CardAction.Move));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Grow : CardAction.Shrink));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Place : CardAction.Remove));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Skip : CardAction.Draw));
        }

        // create mask cards (face cards)
        for (let i = 0; i < 4; i++) {
            // TODO
        }
    }

    private shuffleDeck() {
        this.deck.sort(() => 0.5 - this.rng());
    }

    private dealCards() {
        let handSize = 4;
        for (let i = 0; i < this.players.length; i++) {
            for (let j = 0; j < handSize; j++) {
                this.players[i].hand.push(this.deck.pop());
            }
        }
    }

    private movePos(x: number, y: number, dir: Direction) {
        let xForward = y % 2 === 0;

        let isForwardEdge = (
            (xForward && x === this.boardWidth-1)
            || (!xForward && x === 0)
        );
        let isBackwardEdge = (
            (xForward && x === 0)
            || (!xForward && x === this.boardWidth-1)
        );
        if (dir === Direction.Fwd && isForwardEdge) {
            y = Math.min(y + 1, this.boardHeight - 1);
            return [x, y];
        }
        if (dir === Direction.Bck && isBackwardEdge) {
            y = Math.max(y - 1, 0);
            return [x, y];
        }
        switch (dir) {
            case Direction.Fwd: x += xForward ? 1 : -1; break;
            case Direction.Bck: x += xForward ? -1 : 1; break;
        }
        return [x, y];
    }

    private landPiece(piece: BoardPiece) {
        // check for shoots, ladders, coins, and bombs
    }

    private executeMove(
        targetType: SelectPieceType,
        x: number,
        dir: Direction,
        targetPieceType: PieceType | null = null,
        targetPieceId: string | null = null,
    ) {
        let selectedPieces = []
        switch (targetType) {
            case SelectPieceType.All:
                selectedPieces = this.pieces.filter(p => p.type === targetPieceType! || targetPieceType === PieceType.Anything);
                break;
            case SelectPieceType.Target:
                selectedPieces.push(this.pieces.find(p => p.id === targetPieceId)!);
                break;
            case SelectPieceType.Self:
                selectedPieces.push(this.pieces.find(p => p.playerId === this.currentPlayerId)!);
                break;
            case SelectPieceType.Other:
                selectedPieces = this.pieces.filter(p => p.playerId && p.playerId !== this.currentPlayerId);
                break;
        }

        for (let i = 0; i < x; i++) {
            selectedPieces.forEach(p => {
                let [x, y] = this.movePos(p.x, p.y, dir!)
                p.x = x;
                p.y = y;
                if (p.x2 !== undefined) {
                    let [x2, y2] = this.movePos(p.x2, p.y2, dir!)
                    p.x2 = x2;
                    p.y2 = y2;
                }
            });
        }
        selectedPieces.forEach(p => this.landPiece(p));
    }

    private executeCardAction(gameAction: GameAction, revealedCard: RevealedCard) {
        switch (revealedCard.action) {
            case CardAction.Move:
                this.executeMove(
                    revealedCard.targetType as SelectPieceType,
                    revealedCard.x,
                    revealedCard.dir,
                    revealedCard.pieceType,
                    gameAction.targetPieceId
                );
                break;
            case CardAction.Grow:
                break;
            case CardAction.Shrink:
                break;
            case CardAction.Remove:
                break;
            case CardAction.Place:
                break;
            case CardAction.Skip:
                break;
            case CardAction.Draw:
                break;
        }
    }

    private executeRedaction(gameAction: GameAction) {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        let chosenCard = currentPlayer.hand.find(c => c.id === gameAction.cardId)!;
        switch (gameAction.redactType) {
            case RedactType.Action:
                chosenCard.action.isMasked = true;
                break;
            case RedactType.TargetType:
                chosenCard.actionTarget.targetType.isMasked = true;
                break;
            case RedactType.PlacePieceType:
                chosenCard.placePieceType.isMasked = true;
                break;
            case RedactType.PieceType:
                chosenCard.actionTarget.pieceType.isMasked = true;
                break;
            case RedactType.X:
                chosenCard.x.isMasked = true;
                break;
            case RedactType.Dir:
                chosenCard.dir.isMasked = true;
                break;
        }
    }

    private executePassCard(gameAction: GameAction) {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        let chosenCard = currentPlayer.hand.find(c => c.id === gameAction.cardId)!;
        let playerIndex = this.players.findIndex(p => p.id === currentPlayer.id);
        let nextPlayerIndex = (playerIndex + 1) % this.players.length;
        let nextPlayer = this.players[nextPlayerIndex];
        nextPlayer.hand.push(chosenCard);
        currentPlayer.hand = currentPlayer.hand.filter(c => c !== chosenCard);
    }

    private executeDrawCard() {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        currentPlayer.hand.push(this.deck.pop());
    }

    private executeEndTurn() {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        let playerIndex = this.players.findIndex(p => p.id === currentPlayer.id);
        let nextPlayerIndex = (playerIndex + 1) % this.players.length;
        let nextPlayer = this.players[nextPlayerIndex];
        this.currentPlayerId = nextPlayer.id;
    }

    private getPlayerActionsSinceEndTurn() {
        let turnStartIndex = 0;
        for (let i = this.leger.length - 1; i >= 0; i--) {
            if (this.leger[i].action === GameActionType.EndTurn) {
                turnStartIndex = i + 1;
                break;
            }
        }
        return this.leger.slice(turnStartIndex);
    }

    canCurrentPlayerDrawCard() {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        if (currentPlayer.hand.length < MAX_HAND_SIZE) return true;
        return !this.getPlayerActionsSinceEndTurn()
            .some(ga => ga.action === GameActionType.DrawCard);
    }

    canCurrentPlayerMovePawn() {
        return !this.getPlayerActionsSinceEndTurn()
            .some(ga => ga.action === GameActionType.MovePawn);
    }

    canCurrentPlayerPlayCard() {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        if (currentPlayer.hand.length > MAX_HAND_SIZE) {
            let lastGameAction = this.leger[this.leger.length - 1];
            return lastGameAction.action !== GameActionType.PlayCard;
        }
        return false;
        // return !this.getPlayerActionsSinceEndTurn()
        //     .some(ga => ga.action === GameActionType.PlayCard);
    }
    canCurrentPlayerSubmitCard() {
        let lastGameAction = this.leger[this.leger.length - 1];
        return lastGameAction.action === GameActionType.PlayCard;
        // return !this.canCurrentPlayerPlayCard()
        //     && !this.getPlayerActionsSinceEndTurn()
        //         .some(ga => ga.action === GameActionType.CardAction);
    }

    shouldCurrentPlayerRedactCard() {
        return !this.canCurrentPlayerMovePawn()
            && !this.canCurrentPlayerPlayCard()
            && !this.canCurrentPlayerSubmitCard()
            && !this.getPlayerActionsSinceEndTurn()
                .some(ga => ga.action === GameActionType.RedactCard);
    }

    shouldCurrentPlayerPassCard() {
        return !this.canCurrentPlayerMovePawn()
            && !this.canCurrentPlayerPlayCard()
            && !this.canCurrentPlayerSubmitCard()
            && !this.shouldCurrentPlayerRedactCard();
    }

    private handleSystemAction(gameAction: GameAction) {
        switch (gameAction.action) {
            case GameActionType.InitGame:
                this.rng = seedrandom("", {state: gameAction.rngState});
                this.nextId = 0;
                this.players = [];
                this.deck = [];
                this.pieces = [];
                this.leger = [{
                    action: GameActionType.InitGame,
                    rngState: this.rng.state(),
                } as GameAction];
                this.currentPlayerId = '';
                return;
            case GameActionType.CreatePlayers:
                if (this.leger.find(ga => ga.action === GameActionType.CreatePlayers) !== undefined) throw new Error('Cannot submit multiple CreatePlayers actions');
                this.createPlayers(gameAction.numPlayers!);
                break;
            case GameActionType.SetupBoard:
                if (this.leger.find(ga => ga.action === GameActionType.SetupBoard) !== undefined) throw new Error('Cannot submit multiple SetupBoard actions');
                this.setupBoard(gameAction.boardWidth!, gameAction.boardHeight!);
                break;
            case GameActionType.GenerateDeck:
                if (this.leger.find(ga => ga.action === GameActionType.GenerateDeck) !== undefined) throw new Error('Cannot submit multiple GenerateDeck actions');
                this.generateDeck();
                break;
            case GameActionType.ShuffleDeck:
                if (this.leger.find(ga => ga.action === GameActionType.ShuffleDeck) !== undefined) throw new Error('Cannot submit multiple ShuffleDeck actions');
                this.shuffleDeck();
                break;
            case GameActionType.DealCards:
                if (this.leger.find(ga => ga.action === GameActionType.DealCards) !== undefined) throw new Error('Cannot submit multiple DealCards actions');
                this.dealCards();
                break;
        }
        this.leger.push(gameAction);
        if (this.submitActionCallback) this.submitActionCallback();
    }

    submitAction(gameAction: GameAction) {
        let isSystemAction = (
            gameAction.action === GameActionType.InitGame
            || gameAction.action === GameActionType.CreatePlayers
            || gameAction.action === GameActionType.SetupBoard
            || gameAction.action === GameActionType.GenerateDeck
            || gameAction.action === GameActionType.ShuffleDeck
            || gameAction.action === GameActionType.DealCards
        );

        if (isSystemAction) {
            return this.handleSystemAction(gameAction);
        }

        if (gameAction.playerId !== this.currentPlayerId) {
            throw new Error('Cannot submit action for another player');
        }
        if (gameAction.action === GameActionType.PlayCard && !this.canCurrentPlayerPlayCard()) {
            throw new Error('Already played a card this turn');
        }
        if (gameAction.action === GameActionType.MovePawn && !this.canCurrentPlayerMovePawn()) {
            throw new Error('Already moved pawn this turn');
        }
        if (gameAction.action === GameActionType.RedactCard && !this.shouldCurrentPlayerRedactCard()) {
            throw new Error('Invalid time to redact card');
        }
        if (gameAction.action === GameActionType.PassCard && !this.shouldCurrentPlayerPassCard()) {
            throw new Error('Invalid time to pass card');
        }
        if (gameAction.action === GameActionType.DrawCard && !this.canCurrentPlayerDrawCard()) {
            throw new Error('Cannot draw card');
        }

        let playerHasCard = this.players.find(p => p.id === gameAction.playerId)!.hand.find(c => c.id === gameAction.cardId) !== undefined;
        let currentPlayingCard = this.leger.length > 0 && this.leger[this.leger.length - 1].cardId === gameAction.cardId;
        if (gameAction.cardId && !playerHasCard && !currentPlayingCard) {
            throw new Error('Cannot submit action with invalid card');
        }
        if (gameAction.targetPieceId && this.pieces.find(p => p.id === gameAction.targetPieceId) === undefined) {
            throw new Error('Cannot submit action with invalid target piece');
        }
        if (gameAction.action === GameActionType.PlayCard && gameAction.cardId === null) {
            throw new Error('Cannot submit action without card');
        }

        let player = this.players.find(p => p.id === gameAction.playerId)!;
        let card = player.hand.find(c => c.id === gameAction.cardId)!;

        switch (gameAction.action) {
            case GameActionType.MovePawn:
                gameAction.dieRollResult = Math.floor(this.rng() * 6) + 1;
                this.executeMove(SelectPieceType.Self, gameAction.dieRollResult, Direction.Fwd);
                break;
            case GameActionType.PlayCard:
                let [revealedTargetType, revealedPieceType] = card.actionTarget?.revealData(this.rng) ?? [undefined, undefined];
                gameAction.revealedCard = {
                    id: card.id,
                    action: card.action.revealData(this.rng),
                    targetType: revealedTargetType,
                    pieceType: revealedPieceType,
                    placePieceType: card.placePieceType?.revealData(this.rng),
                    x: card.x?.revealData(this.rng),
                    dir: card.dir?.revealData(this.rng),
                } as RevealedCard;
                player.hand = player.hand.filter(c => c.id !== card.id);
                break;
            case GameActionType.CardAction:
                let revealedCard = this.leger.find(ga => ga.action === GameActionType.PlayCard && ga.cardId === gameAction.cardId)!.revealedCard!;
                this.executeCardAction(gameAction, revealedCard);
                break;
            case GameActionType.RedactCard:
                this.executeRedaction(gameAction);
                break;
            case GameActionType.PassCard:
                this.executePassCard(gameAction);
                break;
            case GameActionType.DrawCard:
                this.executeDrawCard();
                break;
            case GameActionType.EndTurn:
                this.executeEndTurn();
                break;
        }

        this.leger.push(gameAction);
        if (this.submitActionCallback) this.submitActionCallback();
    }
}