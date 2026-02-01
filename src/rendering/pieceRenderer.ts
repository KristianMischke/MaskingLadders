import p5 from "p5";
import {
    BoardPiece, Card,
    GameState,
    LongBoardPiece,
    PieceType,
    RevealedCard,
    SelectObjectType,
    SelectPieceType
} from "../gamelogic";
import {BoardRenderer} from "./boardRenderer";

enum HighlightType {
    None,
    HoverSelectable,
    HoverSelecting,
    Selected,
}

export class PieceRenderer {
    x: number;
    y: number;
    w: number;
    rotation: number = 0;
    piece: BoardPiece | LongBoardPiece | undefined = undefined;
    isHovered: boolean = false;
    constructor(x: number, y: number, w: number) {
        this.x = x;
        this.y = y;
        this.w = w;
    }

    update(p: p5, game: GameState) {
        this.isHovered = false;
    }

    draw(p: p5, boardRenderer: BoardRenderer, hoveredCard: Card, revealedCard: RevealedCard) {
        let piece = this.piece;
        let game = boardRenderer.game;
        let [px, py] = boardRenderer.tileCenterToPixel(piece.x, piece.y);

        let isHighlighted = false;
        let highlightType = HighlightType.None;
        if (revealedCard || hoveredCard) {
            switch (revealedCard?.targetType ?? hoveredCard?.actionTarget.targetType.getKnownData() as SelectPieceType) {
                case SelectPieceType.All:
                    isHighlighted = true;
                    highlightType = HighlightType.Selected;
                    break;
                case SelectPieceType.Target:
                    isHighlighted = true;
                    highlightType = revealedCard ? HighlightType.HoverSelecting : HighlightType.HoverSelectable;
                    break;
                case SelectPieceType.Self:
                    isHighlighted = this.piece!.playerId === game.currentPlayerId;
                    highlightType = HighlightType.Selected;
                    break;
                case SelectPieceType.Other:
                    isHighlighted = this.piece.playerId && this.piece!.playerId !== game.currentPlayerId;
                    highlightType = HighlightType.Selected;
                    break;
            }
            let pieceType = revealedCard?.pieceType ?? hoveredCard?.actionTarget.pieceType.getKnownData();
            if (pieceType) {
                isHighlighted &&= piece.type === pieceType;
            }
        }

        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        if (mouse.x > px - this.w/2 && mouse.x < px + this.w/2 && mouse.y > py - this.w/2 && mouse.y < py + this.w/2) {
            this.isHovered = true;
        }

        if (isHighlighted) {
            p.noFill();
            switch (highlightType) {
                case HighlightType.Selected:
                    p.stroke("#00FF00AA");
                    break;
                case HighlightType.HoverSelectable:
                    p.stroke("#FFFF0077");
                    break;
                case HighlightType.HoverSelecting:
                    if (this.isHovered) {
                        p.stroke("#FFAA00AA");
                    } else {
                        p.stroke("#FFFF00AA");
                    }
                    break;
            }
            p.strokeWeight(10);
            p.rectMode(p.CENTER);
            p.rect(px, py, this.w, this.w);
        }

        if(piece.type === PieceType.Coin) {
            p.strokeWeight(3)
            p.stroke("#666644");
            p.fill("#999944");
            p.circle(px, py, this.w / 2);
        }
        if(piece.type === PieceType.Bomb) {
            p.noStroke();
            p.fill(0);
            let bombRadius = this.w / 4;
            p.circle(px, py, bombRadius*2);

            p.noFill();
            p.stroke(0);
            p.strokeWeight(3)
            p.arc(px, py - bombRadius, bombRadius, bombRadius, p.PI * 3/2, p.PI/4);
        }
        if(piece.type === PieceType.Shoot) {
            let longPiece = piece as LongBoardPiece;
            let [px2, py2] = boardRenderer.tileCenterToPixel(longPiece.x2, longPiece.y2);
            p.stroke("#666666");
            p.strokeWeight(5);
            p.noFill();
            let cx = px;
            let cy = py + this.w;
            let cx2 = px2;
            let cy2 = py2 - this.w;
            if (px < px2) {
                cx -= this.w * 2;
                cx2 += this.w * 2;
            } else {
                cx += this.w * 2;
                cx2 -= this.w * 2;
            }
            p.splineProperty('ends', p.EXCLUDE)
            p.spline(cx, cy, px, py, px2, py2, cx2, cy2);
        }
        if(piece.type === PieceType.Ladder) {
            let longPiece = piece as LongBoardPiece;
            let [px2, py2] = boardRenderer.tileCenterToPixel(longPiece.x2, longPiece.y2);
            p.stroke("#774444");
            p.strokeWeight(5);
            // latter rails
            p.line(px - this.w/4, py, px2 - this.w/4, py2);
            p.line(px + this.w/4, py, px2 + this.w/4, py2);

            // latter rungs
            let ladderLength = p.dist(px, py, px2, py2);
            let railWidth = this.w / 2;
            let rungsPerTile = 3;
            let numRungs = Math.floor(ladderLength / railWidth) * rungsPerTile;
            let dx = px2 - px;
            let dy = py2 - py;
            for (let i = 1; i < numRungs; i++) {
                let rungX = px + dx * i / numRungs;
                let rungY = py + dy * i / numRungs;
                p.strokeWeight(3);
                p.line(rungX - this.w/4, rungY, rungX + this.w/4, rungY);
            }
        }
        if (piece.type === PieceType.Pawn) {
            let headDiameter = this.w / 4;
            let bodyDiameter = this.w / 2;
            let color = game.players.find(p => p.id === piece.playerId)!.color;
            // if multiple pieces on same square, need to shift them so all are visible
            let numberOfPiecesOnSquare = game.pieces.filter(p => p.x === piece.x && p.y === piece.y).length;
            let playerIndex = game.players.findIndex(p => p.id === piece.playerId);
            let allOffset = this.w / 2 * (numberOfPiecesOnSquare - 1) / numberOfPiecesOnSquare;
            let offset = this.w / 2 * playerIndex / numberOfPiecesOnSquare;
            p.fill(color);
            p.noStroke();
            p.circle(px + offset - allOffset/2, py - headDiameter + offset, headDiameter);
            p.arc(px + offset - allOffset/2, py + offset, bodyDiameter, bodyDiameter, p.PI, 0);
        }
    }
}
