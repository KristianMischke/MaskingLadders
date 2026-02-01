import p5 from "p5";
import {GameAction, GameActionType, GameState, SelectObjectType} from "../gamelogic";
import {PieceRenderer} from "./pieceRenderer";
import {GameRenderer} from "./gameRenderer";


export class BoardRenderer {
    w: number;
    h: number;
    game: GameState | undefined = undefined;
    pieceRenderers: Map<string, PieceRenderer> = new Map();
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
                pieceRenderer.x = px;
                pieceRenderer.y = py;
                pieceRenderer.w = tileWidth;
                pieceRenderer.piece = piece;
            } else {
                pieceRenderer = new PieceRenderer(px, py, tileWidth);
                pieceRenderer.piece = piece;
                this.pieceRenderers.set(piece.id, pieceRenderer);
            }
        }

        for (let [id, pieceRenderer] of this.pieceRenderers) {
            if (!game.pieces.find(p => p.id === id)) {
                this.pieceRenderers.delete(id);
            } else {
                pieceRenderer.update(p, game);
            }
        }
    }

    draw(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;
        let game = gameRenderer.game!;

        let tileWidth = this.w / game.boardWidth;
        let tileHeight = this.h / game.boardHeight;
        p.push();
        // tiles
        for (let y = 0; y < game.boardHeight; y++) {
            for (let x = 0; x < game.boardWidth; x++) {
                if (y % 2 === x % 2) {
                    p.fill("#BBCCAA");
                } else {
                    p.fill("#AA8877");
                }
                p.rect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            }
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
