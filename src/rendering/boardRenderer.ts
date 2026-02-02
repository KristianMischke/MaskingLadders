import p5 from "p5";
import {
    BoardPiece,
    CardAction,
    GameAction,
    GameActionType,
    GameState, isLongBoardPiece,
    LongBoardPiece, pieceTypeEquals,
    SelectPieceType
} from "../gamelogic";
import {PieceRenderer} from "./pieceRenderer";
import {GameRenderer} from "./gameRenderer";

const TILE_EVEN_COLOR = "#BBCCAA";
const TILE_ODD_COLOR = "#AA8877";

export class BoardRenderer {
    w: number;
    h: number;
    game: GameState | undefined = undefined;
    pieceRenderers: Map<string, PieceRenderer> = new Map();
    elapsedTimeSeconds: number = 0;
    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
    }

    tileCornerToPixel(x: number, y: number) {
        let tileWidth = this.w / this.game.boardWidth;
        let tileHeight = this.h / this.game.boardHeight;
        return [x * tileWidth, this.h - y * tileHeight];
    }

    tileCenterToPixel(x: number, y: number) {
        let tileWidth = this.w / this.game.boardWidth;
        let tileHeight = this.h / this.game.boardHeight;
        return [(x + 0.5) * tileWidth, this.h - (y + 0.5) * tileHeight];
    }

    pixelToTile(x: number, y: number) {
        let tileWidth = this.w / this.game.boardWidth;
        let tileHeight = this.h / this.game.boardHeight;
        return [Math.floor(x / tileWidth), Math.floor(this.h + y / tileHeight)];
    }

    update(p: p5, game: GameState) {
        this.elapsedTimeSeconds += p.deltaTime / 1000;

        // rescale board
        let displayBoardWidth = Math.min(p.width - 200, p.height - 200);
        let displayBoardHeight = displayBoardWidth / game.boardWidth * game.boardHeight;
        this.w = displayBoardWidth;
        this.h = displayBoardHeight;
        this.game = game;

        let tileWidth = this.w / game.boardWidth;

        for (let i = 0; i < game.pieces.length; i++) {
            let piece = game.pieces[i];
            let [px, py] = this.tileCenterToPixel(piece.x, piece.y);
            let pieceRenderer = this.pieceRenderers.get(piece.id);
            if (pieceRenderer) {
                pieceRenderer.w = tileWidth;
                pieceRenderer.piece = piece;
            } else {
                pieceRenderer = new PieceRenderer(px, py, tileWidth);
                pieceRenderer.piece = piece;
                if (isLongBoardPiece(piece)) {
                    let longPiece = piece as LongBoardPiece;
                    let [px2, py2] = this.tileCenterToPixel(longPiece.x2, longPiece.y2);
                    pieceRenderer.x2 = px2;
                    pieceRenderer.y2 = py2;
                }
                this.pieceRenderers.set(piece.id, pieceRenderer);
            }
        }

        for (let [id, pieceRenderer] of this.pieceRenderers) {
            if (!game.pieces.find(p => p.id === id)) {
                this.pieceRenderers.delete(id);
            } else {
                pieceRenderer.update(p, this);
            }
        }
    }

    draw(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;
        let game = gameRenderer.game!;

        let tileWidth = this.w / game.boardWidth;
        let tileHeight = this.h / game.boardHeight;
        let hoveredPiece: BoardPiece | undefined = undefined;

        let placeOrRemoveTiles: {x: number, y: number}[] = [];
        if (gameRenderer.revealedCard) {
            let revealedCard = gameRenderer.revealedCard;
            this.pieceRenderers.forEach(pr => {
                if (pr.isHovered && pieceTypeEquals(pr.piece.type, revealedCard.pieceType)) {
                    hoveredPiece = pr.piece;
                }
            });
            placeOrRemoveTiles = game.getSelectedLocationsForPlaceOrRemove(
                revealedCard.targetType as SelectPieceType,
                revealedCard.pieceType,
                revealedCard.x,
                revealedCard.dir,
                hoveredPiece?.id
            );
        }

        // tiles
        p.push();
        p.translate(0, game.boardHeight * tileHeight - tileHeight);
        let winningSquare = game.winningSquare();
        for (let y = 0; y < game.boardHeight; y++) {
            p.push();
            for (let x = 0; x < game.boardWidth; x++) {
                let tileColor = p.color("#F0F");
                if (x === winningSquare.x && y === winningSquare.y) {
                    tileColor = p.color("#FFFF00");
                    tileColor.setBlue(127 + p.sin(this.elapsedTimeSeconds/2)*127);
                } else if (y % 2 === x % 2) {
                    tileColor = p.color(TILE_EVEN_COLOR);
                } else {
                    tileColor = p.color(TILE_ODD_COLOR);
                }
                p.fill(tileColor);
                p.rect(0, 0, tileWidth, tileHeight);

                p.push();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(30);
                // p.textStyle(p.BOLD);
                let fontColor = p.color("#444");
                fontColor.setAlpha(100);
                p.fill(fontColor);
                p.noStroke();
                p.text(game.getTileNumber(x, y).toString(), tileWidth/2, tileHeight/2);
                p.pop();

                if (placeOrRemoveTiles.find(t => t.x === x && t.y === y)) {
                    p.push();
                    p.fill(gameRenderer.revealedCard.action === CardAction.Remove ? "#F0F" : "#0F9");
                    p.rect(0, 0, tileWidth, tileHeight);
                    p.pop();
                }
                p.translate(tileWidth, 0);
            }
            p.pop();
            p.translate(0, -tileHeight);
        }
        p.pop();

        for (let [id, pieceRenderer] of this.pieceRenderers) {
            p.push();
            pieceRenderer.draw(p, this, gameRenderer.hoveredCard, gameRenderer.revealedCard);
            p.pop();
        }
    }

    handleClick(gameRenderer: GameRenderer) {
        if(!gameRenderer.revealedCard) return;
        for (let [id, pieceRenderer] of this.pieceRenderers) {
            if (pieceRenderer.isHovered) {
                gameRenderer.game.submitAction({
                    playerId: gameRenderer.game.currentPlayerId,
                    action: GameActionType.CardAction,
                    cardId: gameRenderer.revealedCard.id,
                    targetPieceId: id,
                } as GameAction);
                return;
            }
        }
    }
}
