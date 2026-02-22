import seedrandom from 'seedrandom';

const MAX_HAND_SIZE = 4;
const MAX_PLAYS_PER_TURN = 3;
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
const ALL_REAL_PIECE_TYPES = [
    PieceType.Pawn,
    PieceType.Ladder,
    PieceType.Shoot,
    PieceType.Bomb,
    PieceType.Coin,
];
export function pieceTypeEquals(a: PieceType, b: PieceType) {
    return a === b || a === PieceType.Anything || b === PieceType.Anything;
}
export function isLongBoardPiece(piece: BoardPiece) {
    return piece.type === PieceType.Shoot || piece.type === PieceType.Ladder;
}

export enum SelectPieceType {
    // Note: All & Target require a pieceType
    All = 'all',
    Target = 'target',
    Self = 'self',
    Opponent = 'opponent'
}

export enum SelectObjectType {
    All = 'all',
    Target = 'target',
    Self = 'self',
    Opponent = 'opponent',

    Card = 'card',
    Tile = 'tile'
}

export enum CardAction {
    Move = 'move',

    Grow = 'grow',
    Shrink = 'shrink',

    Remove = 'remove',
    Place = 'place',
    Swap = 'swap',

    Draw = 'draw',
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
    operatePieceType?: MaskedData<PieceType>;
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
    let operatePieceType = undefined;

    if (action === CardAction.Place || action == CardAction.Swap) {
        operatePieceType = new MaskedData({options: ALL_REAL_PIECE_TYPES, index: Math.floor(rng() * ALL_REAL_PIECE_TYPES.length)});
    }
    if (action === CardAction.Swap) {
        x = undefined;
        dir = undefined;
    }
    if (action === CardAction.Remove) {
        operatePieceType = new MaskedData({options: Object.values(PieceType), index: Math.floor(rng() * Object.values(PieceType).length)});
    }
    if (action === CardAction.Grow || action === CardAction.Shrink) {
        actionTarget = new ActionTarget(
            new MaskedData({options: [SelectPieceType.Target, SelectPieceType.All], index: Math.floor(rng() * 2)}),
            new MaskedData({options: [PieceType.Ladder, PieceType.Shoot], index: Math.floor(rng() * 2)})
        );
        x = undefined;
        dir = undefined;
    }
    if (action === CardAction.Draw) {
        options = [2, 3, 4];
        x = new MaskedData({options, index: Math.floor(rng() * options.length)});
        actionTarget = undefined;
        dir = undefined;
    }
    return {id, action: maskedAction, actionTarget, x, dir, operatePieceType} as Card;
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
    gameType: GameType | null;
    redactType: RedactType | null;
}

export enum GameType {
    PassAndPlay,
    PBEM,
    P2P
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
    gameType: GameType = GameType.PassAndPlay;

    submitActionCallback?: () => void;
    onTurnChangeCallback?: () => void;
    constructor(seed?: string, gameType = GameType.PassAndPlay) {
        this.rng = seedrandom(seed, {state: true});
        this.nextId = 0;
        this.players = [];
        this.deck = [];
        this.pieces = [];
        this.leger = [{
            action: GameActionType.InitGame,
            rngState: this.rng.state(),
            gameType: gameType,
        } as GameAction];
        this.gameType = gameType;
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
            if (card.operatePieceType) card.operatePieceType = new MaskedData<PieceType>(card.operatePieceType);
        }
        this.deck.forEach(fixCardMaskedDataObjects);
        this.players
            .map(p => p.hand)
            .forEach(hand =>
                hand.forEach(fixCardMaskedDataObjects)
            );
    }

    reconstructFromLeger(leger: GameAction[]) {
        leger.forEach(gameAction => this.submitAction(gameAction));
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
            if (y > 0 && this.rng() < 0.5) {
                // place a coin randomly on this row
                let x = Math.floor(this.rng() * width);
                this.pieces.push({id: this.getNextId(), type: PieceType.Coin, x, y} as BoardPiece);
            }
            if (y > 0 && this.rng() < 0.5) {
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
        let cardPercents = [
            {action: CardAction.Move, percent: 0.25},
            {action: CardAction.Grow, percent: 0.05},
            {action: CardAction.Shrink, percent: 0.05},
            {action: CardAction.Place, percent: 0.25},
            {action: CardAction.Remove, percent: 0.10},
            {action: CardAction.Swap, percent: 0.20},
            {action: CardAction.Draw, percent: 0.10},
        ];
        for (let i = 0; i < 100; i++) {
            let r = this.rng();
            for (let {action, percent} of cardPercents) {
                if (r < percent) {
                    this.deck.push(generateCard(this.getNextId(), this.rng, action));
                    break;
                } else {
                    r -= percent;
                }
            }
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

    winningSquare() {
        let lastRowY = this.boardHeight - 1;
        let xForward = lastRowY % 2 === 0;
        let lastRowX = xForward ? this.boardWidth - 1 : 0;
        return {x: lastRowX, y: lastRowY};
    }

    getTileNumber(x: number, y: number) {
        let xForward = y % 2 === 0;
        let prevRows = y * this.boardWidth;
        return 1 + prevRows + (xForward ? x : this.boardWidth-1-x);
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

    tryGetPieceByTypeAtPos(pieceType: PieceType, x: number, y: number) {
        return this.pieces.find(p => pieceTypeEquals(p.type, pieceType) && p.x === x && p.y === y);
    }

    private landPiece(piece: BoardPiece, depth = 0) {
        if (isLongBoardPiece(piece)) return; // shoots and ladders don't land
        if (depth > 10) return; // don't allow infinite recurse

        let shootAtLocation = this.tryGetPieceByTypeAtPos(PieceType.Shoot, piece.x, piece.y) as LongBoardPiece;
        if (shootAtLocation) {
            piece.x = shootAtLocation.x2;
            piece.y = shootAtLocation.y2;
            this.landPiece(piece, depth+1);
            return;
        }

        let ladderAtLocation = this.tryGetPieceByTypeAtPos(PieceType.Ladder, piece.x, piece.y) as LongBoardPiece;
        if (ladderAtLocation) {
            piece.x = ladderAtLocation.x2;
            piece.y = ladderAtLocation.y2;
            this.landPiece(piece, depth+1);
            return;
        }

        if (piece.type === PieceType.Pawn) {
            let coinAtLocation = this.tryGetPieceByTypeAtPos(PieceType.Coin, piece.x, piece.y);
            if (coinAtLocation) {
                this.pieces.splice(this.pieces.indexOf(coinAtLocation), 1);
                this.players.find(p => p.id === piece.playerId)!.score += 25;
            }

            let bombAtLocation = this.tryGetPieceByTypeAtPos(PieceType.Bomb, piece.x, piece.y);
            if (bombAtLocation) {
                this.pieces.splice(this.pieces.indexOf(bombAtLocation), 1);
                this.players.find(p => p.id === piece.playerId)!.score -= 30;
                // delete non-pawn neighbors pieces in 3x3
                let neighbors = this.pieces.filter(p => Math.abs(p.x - piece.x) <= 1 && Math.abs(p.y - piece.y) <= 1 && p.type !== PieceType.Pawn);
                neighbors.forEach(p => this.pieces.splice(this.pieces.indexOf(p), 1));

                // move neighboring pawns backwards 3
                let pawnNeighbors = this.pieces.filter(p => Math.abs(p.x - piece.x) <= 1 && Math.abs(p.y - piece.y) <= 1 && p.type === PieceType.Pawn);
                pawnNeighbors.forEach(p => {
                    for (let i = 0; i < 3; i++) {
                        let [newX, newY] = this.movePos(p.x, p.y, Direction.Bck);
                        p.x = newX;
                        p.y = newY;
                    }
                    this.landPiece(p);
                })
                return;
            }

            let winningSquare = this.winningSquare();
            if (piece.x === winningSquare.x && piece.y === winningSquare.y) {
                this.players.find(p => p.id === piece.playerId)!.score += 100;
            }
        }
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
                selectedPieces = this.pieces.filter(p => pieceTypeEquals(p.type, targetPieceType!));
                break;
            case SelectPieceType.Target:
                selectedPieces = this.pieces.filter(p => p.id === targetPieceId);
                break;
            case SelectPieceType.Self:
                selectedPieces = this.pieces.filter(p => p.playerId === this.currentPlayerId);
                break;
            case SelectPieceType.Opponent:
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

    private executeGrowShrink(isGrow: boolean, selectPieceType: SelectPieceType, targetPieceId: string | null) {
        this.pieces.forEach(p => {
            if (p.id === targetPieceId || selectPieceType === SelectPieceType.All) {
                let longPiece = p as LongBoardPiece;
                if (p.type === PieceType.Ladder) {
                    longPiece.y2 = Math.min(this.boardHeight-1, longPiece.y2 + (isGrow ? 1 : -1));
                }
                if (p.type === PieceType.Shoot) {
                    longPiece.y2 = Math.max(0, longPiece.y2 + (isGrow ? -1 : 1));
                }
            }
        });
    }

    private getSelectedPiecesForOperation(selectType: SelectPieceType, pieceType: PieceType, targetPieceId: string | null) {
        let selectedPieces: BoardPiece[] = [];
        this.pieces.forEach(p => {
            if (selectType == SelectPieceType.Target && p.type === pieceType && p.id === targetPieceId) {
                selectedPieces.push(p);
            } else if (selectType == SelectPieceType.All && pieceTypeEquals(p.type, pieceType)) {
                selectedPieces.push(p);
            } else if (selectType == SelectPieceType.Self && p.playerId === this.currentPlayerId) {
                selectedPieces.push(p);
            } else if (selectType == SelectPieceType.Opponent && p.playerId && p.playerId !== this.currentPlayerId) {
                selectedPieces.push(p);
            }
        });
        return selectedPieces;
    }

    getSelectedLocationsForPlaceOrRemove(selectType: SelectPieceType, pieceType: PieceType, x: number, dir: Direction, targetPieceId: string | null) {
        let selectedPieces = this.getSelectedPiecesForOperation(selectType, pieceType, targetPieceId);
        let allLocations: {x: number, y: number}[] = [];
        selectedPieces.forEach(p => {
            let [tx, ty] = [p.x, p.y];
            for (let i = 0; i < x; i++) {
                [tx, ty] = this.movePos(tx, ty, dir!);
                allLocations.push({x: tx, y: ty});
            }
        });
        return allLocations;
    }

    private executeRemove(selectType: SelectPieceType, removePieceType: PieceType, pieceType: PieceType, x: number, dir: Direction, targetPieceId: string | null) {
        this.getSelectedLocationsForPlaceOrRemove(selectType, pieceType, x, dir, targetPieceId)
            .forEach(({x, y}) => {
                let piece = this.pieces.find(p => p.x === x && p.y === y);
                if (piece && pieceTypeEquals(piece.type, removePieceType)) {
                    this.pieces.splice(this.pieces.indexOf(piece), 1);
                }
            });
    }

    private executeSwap(selectType: SelectPieceType, placePieceType: PieceType, pieceType: PieceType, targetPieceId: string | null) {
        this.getSelectedPiecesForOperation(selectType, pieceType, targetPieceId)
            .forEach(p => {
                p.type = placePieceType;

                if (isLongBoardPiece(p)) {
                    let longPiece = p as LongBoardPiece;
                    longPiece.x2 = longPiece.x;
                    longPiece.y2 = placePieceType === PieceType.Ladder ? longPiece.y+1 : longPiece.y-1;
                    longPiece.y2 = Math.min(this.boardHeight-1, Math.max(0, longPiece.y2));
                }

                if (placePieceType === PieceType.Pawn) {
                    p.playerId = this.currentPlayerId;
                } else {
                    p.playerId = null;
                }
            });
    }

    private executePlace(selectType: SelectPieceType, placePieceType: PieceType, pieceType: PieceType, x: number, dir: Direction, targetPieceId: string | null) {
        this.getSelectedLocationsForPlaceOrRemove(selectType, pieceType, x, dir, targetPieceId)
            .forEach(({x, y}) => {
                if (placePieceType === PieceType.Ladder) {
                    let x2 = Math.max(Math.min(x + Math.floor(this.rng() * 5) - 2, this.boardWidth - 1), 0);
                    let y2 = Math.min(y + Math.ceil(this.rng() * 3), this.boardHeight - 1);
                    this.pieces.push({id: this.getNextId(), type: placePieceType, x, y, x2, y2} as LongBoardPiece);
                } else if (placePieceType === PieceType.Shoot) {
                    let x2 = Math.max(Math.min(x + Math.floor(this.rng() * 5) - 2, this.boardWidth - 1), 0);
                    let y2 = Math.max(y - Math.ceil(this.rng() * 3), 0);
                    this.pieces.push({id: this.getNextId(), type: placePieceType, x, y, x2, y2} as LongBoardPiece);
                } else if (placePieceType === PieceType.Pawn) {
                    this.pieces.push({id: this.getNextId(), type: placePieceType, x, y, playerId: this.currentPlayerId} as BoardPiece);
                    this.landPiece(this.pieces[this.pieces.length - 1]);
                } else {
                    this.pieces.push({id: this.getNextId(), type: placePieceType, x, y} as BoardPiece);
                }
            });
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
                this.executeGrowShrink(true, revealedCard.targetType as SelectPieceType, gameAction.targetPieceId);
                break;
            case CardAction.Shrink:
                this.executeGrowShrink(false, revealedCard.targetType as SelectPieceType, gameAction.targetPieceId);
                break;
            case CardAction.Remove:
                this.executeRemove(
                    revealedCard.targetType as SelectPieceType,
                    revealedCard.placePieceType,
                    revealedCard.pieceType,
                    revealedCard.x,
                    revealedCard.dir,
                    gameAction.targetPieceId
                )
                break;
            case CardAction.Place:
                this.executePlace(
                    revealedCard.targetType as SelectPieceType,
                    revealedCard.placePieceType,
                    revealedCard.pieceType,
                    revealedCard.x,
                    revealedCard.dir,
                    gameAction.targetPieceId
                )
                break;
            case CardAction.Swap:
                this.executeSwap(
                    revealedCard.targetType as SelectPieceType,
                    revealedCard.placePieceType,
                    revealedCard.pieceType,
                    gameAction.targetPieceId
                )
                break;
            case CardAction.Draw:
                for (let i = 0; i < revealedCard.x; i++) {
                    this.executeDrawCard();
                }
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
                chosenCard.operatePieceType.isMasked = true;
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
        let card = this.deck.pop();
        if (card) currentPlayer.hand.push(card);
    }

    private executeEndTurn() {
        let currentPlayer = this.players.find(p => p.id === this.currentPlayerId)!;
        let playerIndex = this.players.findIndex(p => p.id === currentPlayer.id);
        let nextPlayerIndex = (playerIndex + 1) % this.players.length;
        let nextPlayer = this.players[nextPlayerIndex];
        this.currentPlayerId = nextPlayer.id;

        // if new current player has no pawn, respawn at start
        let currentPlayerPawnCount = this.pieces.filter(p => p.playerId === this.currentPlayerId).length;
        if (currentPlayerPawnCount === 0) {
            this.pieces.push({id: this.getNextId(), type: PieceType.Pawn, x: 0, y: 0, playerId: this.currentPlayerId});
        }
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
        if (this.deck.length === 0) return false;
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
        let hasPlayedCard = this.getPlayerActionsSinceEndTurn()
            .some(ga => ga.action === GameActionType.PlayCard);
        // let numCardsPlayed = this.getPlayerActionsSinceEndTurn().filter(ga => ga.action === GameActionType.PlayCard).length;
        // if (numCardsPlayed <= MAX_PLAYS_PER_TURN) {
        if (currentPlayer.hand.length > MAX_HAND_SIZE || !hasPlayedCard) {
            let lastGameAction = this.leger[this.leger.length - 1];
            return lastGameAction.action !== GameActionType.PlayCard;
        }
        return false;
    }

    canCurrentPlayerSubmitCard() {
        let lastGameAction = this.leger[this.leger.length - 1];
        return lastGameAction.action === GameActionType.PlayCard;
        // return !this.canCurrentPlayerPlayCard()
        //     && !this.getPlayerActionsSinceEndTurn()
        //         .some(ga => ga.action === GameActionType.CardAction);
    }

    anyValidTargetsForCard(revealedCard: RevealedCard) {
        return (
            revealedCard.targetType === SelectPieceType.Target
            && this.pieces.some(p => pieceTypeEquals(p.type, revealedCard.pieceType))
        );
    }

    isCardRedactable(card: Card) {
        return [
            card.action.getKnownData(),
            card.actionTarget?.targetType.getKnownData(),
            card.actionTarget?.pieceType.getKnownData(),
            card.operatePieceType?.getKnownData(),
            card.dir?.getKnownData(),
            card.x?.getKnownData(),
        ].some(x => x !== MaskOrMystery.Mystery && x !== MaskOrMystery.Mystery);
    }

    shouldCurrentPlayerRedactCard() {
        return !this.canCurrentPlayerMovePawn()
            && !this.canCurrentPlayerDrawCard()
            && !this.canCurrentPlayerPlayCard()
            && !this.canCurrentPlayerSubmitCard()
            && !this.getPlayerActionsSinceEndTurn()
                .some(ga => ga.action === GameActionType.RedactCard);
    }

    shouldCurrentPlayerPassCard() {
        return !this.canCurrentPlayerMovePawn()
            && !this.canCurrentPlayerDrawCard()
            && !this.canCurrentPlayerPlayCard()
            && !this.canCurrentPlayerSubmitCard()
            && !this.shouldCurrentPlayerRedactCard();
    }

    isGameOver() {
        let winningSquare = this.winningSquare();
        let pawnInWinningSquare = this.pieces.find(p => p.x === winningSquare.x && p.y === winningSquare.y && p.type === PieceType.Pawn);
        return pawnInWinningSquare || this.players.every(p => p.hand.length === 0);
    }

    getWinningPlayer() {
        // get winning player by score
        return this.players.reduce((prev, curr) => prev.score > curr.score ? prev : curr);
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
                this.gameType = gameAction.gameType;
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

        let targetPiece = this.pieces.find(p => p.id === gameAction.targetPieceId);

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
                    placePieceType: card.operatePieceType?.revealData(this.rng),
                    x: card.x?.revealData(this.rng),
                    dir: card.dir?.revealData(this.rng),
                } as RevealedCard;
                player.hand = player.hand.filter(c => c.id !== card.id);
                break;
            case GameActionType.CardAction:
                let revealedCard = this.leger.find(ga => ga.action === GameActionType.PlayCard && ga.cardId === gameAction.cardId)!.revealedCard!;
                if (revealedCard.targetType === SelectPieceType.Target && targetPiece && !pieceTypeEquals(targetPiece.type, revealedCard.pieceType)) {
                    throw new Error("Invalid piece type for card")
                }
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
        if (gameAction.action === GameActionType.EndTurn && this.onTurnChangeCallback) this.onTurnChangeCallback();
    }
}