import seedrandom from 'seedrandom';

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
    Mask = 'mask',
    Unmask = 'unmask'
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
        if (this.isMasked) return undefined;
        if (this.isMystery) return undefined;
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
        return [revealedTargetType];
    }
}

export interface Card {
    id: string;
    action: MaskedData<CardAction>;
    actionTarget: ActionTarget;
    placePieceType?: MaskedData<PieceType>;
    x?: MaskedData<number>;
    dir?: MaskedData<Direction>;
}

export interface Player {
    id: string;
    name: string;
    color: string;
    hand: Card[];
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
    if (action === CardAction.Unmask || action === CardAction.Mask) {
        x = undefined;
        dir = undefined;
    }
    return {id, action: maskedAction, actionTarget, x, dir, placePieceType} as Card;
}

export enum GameActionType {
    MovePawn = 'movePawn',
    PlayCard = 'playCard',
    RedactCard = 'redactCard',
    PassCard = 'passCard',
}

export interface GameAction {
    playerId: string;
    action: GameActionType;
    cardId: string | null;

    targetPieceId: string | null;
    targetTileId: string | null;
    targetCardId: string | null;
}

export class GameState {
    rng: seedrandom.StatefulPRNG<seedrandom.State.Arc4>;
    nextId: number;
    boardWidth: number;
    boardHeight: number;
    players: Player[];
    deck: Card[];
    pieces: BoardPiece[];
    leger: GameAction[];
    currentPlayerId: string;
    constructor(seed?: string) {
        this.rng = seedrandom(seed, {state: true});
        this.nextId = 0;
        this.players = [];
        this.deck = [];
        this.pieces = [];
        this.leger = [];
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
            card.actionTarget.targetType = new MaskedData<SelectPieceType|SelectObjectType>(card.actionTarget.targetType);
            card.actionTarget.pieceType = new MaskedData<PieceType>(card.actionTarget.pieceType);
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

    getNextId() {
        this.nextId++;
        return this.nextId.toString();
    }

    setupBoard(width: number, height: number) {
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

    generateDeck() {
        // generate 10 cards for each card type
        for (let i = 0; i < 10; i++) {
            this.deck.push(generateCard(this.getNextId(), this.rng, CardAction.Move));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Grow : CardAction.Shrink));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Place : CardAction.Remove));
            this.deck.push(generateCard(this.getNextId(), this.rng, this.rng() < 0.5 ? CardAction.Mask : CardAction.Unmask));
        }

        // create mask cards (face cards)
        for (let i = 0; i < 4; i++) {
            // TODO
        }
    }

    shuffleDeck() {
        this.deck.sort(() => 0.5 - this.rng());
    }

    dealCards() {
        let handSize = 4;
        for (let i = 0; i < this.players.length; i++) {
            for (let j = 0; j < handSize; j++) {
                this.players[i].hand.push(this.deck.pop());
            }
        }
    }

    submitAction(action: GameAction) {
        this.leger.push(action);
    }
}