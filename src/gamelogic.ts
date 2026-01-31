import seedrandom from 'seedrandom';

export enum Direction {
    Fwd = 'fwd',
    Bck = 'bck'
}

export enum PieceType {
    Pawn = 'pawn',
    Ladder = 'ladder',
    Shoot = 'shoot',
    Bomb = 'bomb',
    Coin = 'coin',
    Any = 'any'
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

export class MaskedData<T> {
    options: T[];
    index: number;
    isMasked: boolean;
    isMystery: boolean;
    constructor(options: T[], index: number | T, isMasked = false, isMystery = false) {
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

export class Card {
    id: string;
    action: MaskedData<CardAction>;
    actionTarget: ActionTarget;
    constructor(id: string, action: MaskedData<CardAction>, actionTarget: ActionTarget) {
        this.id = id;
        this.action = action;
        this.actionTarget = actionTarget;
    }
}
export class MoveCard extends Card {
    // MOVE <SELECT_PIECE> <X> <DIR>
    x: MaskedData<number>;
    dir: MaskedData<Direction>;
    constructor(id: string, actionTarget: ActionTarget, x: MaskedData<number>, dir: MaskedData<Direction>) {
        super(id, new MaskedData(Object.values(CardAction), CardAction.Move), actionTarget);
    }
}
export class ResizeCard extends Card {
    // GROW/SHRINK LADDER/SHOOT
    constructor(id: string, action: CardAction.Grow | CardAction.Shrink, actionTarget: ActionTarget) {
        super(id, new MaskedData(Object.values(CardAction), action), actionTarget);
    }
}
export class PlacementCard extends Card {
    // REMOVE/PLACE <SELECT_PIECE> <X> <DIR>
    x: MaskedData<number>;
    dir: MaskedData<Direction>;
    constructor(id: string, action: CardAction.Remove | CardAction.Place, actionTarget: ActionTarget, x: MaskedData<number>, dir: MaskedData<Direction>) {
        super(id, new MaskedData(Object.values(CardAction), action), actionTarget);
        this.x = x;
        this.dir = dir;
    }
}
export class MaskUnmaskCard extends Card {
    // (UN)MASK <SELECT_OBJ>
    constructor(id: string, action: CardAction.Mask | CardAction.Unmask, actionTarget: ActionTarget) {
        super(id, new MaskedData(Object.values(CardAction), action), actionTarget);
    }
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
    let actionTarget = new ActionTarget(
        new MaskedData(Object.values(SelectPieceType), Math.floor(rng() * Object.values(SelectPieceType).length)),
        new MaskedData(Object.values(PieceType), Math.floor(rng() * Object.values(PieceType).length)),
    );
    let dir = new MaskedData(Object.values(Direction), Math.floor(rng() * Object.values(Direction).length));
    let options = [-3, -2, -1, 0, 1, 2, 3];
    let x = new MaskedData(options, Math.floor(rng() * options.length));

    if (action === CardAction.Move) {
        return new MoveCard(id, actionTarget, x, dir);
    } else if (action === CardAction.Grow || action === CardAction.Shrink) {
        actionTarget = new ActionTarget(
            new MaskedData([SelectPieceType.Target], 0),
            new MaskedData([PieceType.Ladder, PieceType.Shoot], Math.floor(rng() * 2))
        );
        return new ResizeCard(id, action, actionTarget);
    } else if (action === CardAction.Place || action === CardAction.Remove) {
        return new PlacementCard(id, action, actionTarget, x, dir);
    } else if (action === CardAction.Mask || action === CardAction.Unmask) {
        return new MaskUnmaskCard(id, action, actionTarget);
    }
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
    rng: seedrandom.PRNG
    nextId: number;
    boardWidth: number;
    boardHeight: number;
    players: Player[];
    deck: Card[];
    pieces: BoardPiece[];
    leger: GameAction[];
    constructor(seed?: string) {
        this.rng = seedrandom(seed);
        this.nextId = 0;
        this.players = [];
        this.deck = [];
        this.pieces = [];
        this.leger = [];
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