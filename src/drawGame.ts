import p5 from "p5";
import {
    Card,
    CardAction,
    Direction,
    GameState,
    LongBoardPiece,
    PieceType,
    SelectObjectType,
    SelectPieceType
} from "./gamelogic";

function drawScoreboard(p: p5, game: GameState) {
    let scoreBoardX = p.width - 100;
    let scoreBoardY = 10;
    let scoreBoardWidth = p.width - scoreBoardX;
    let yOffset = 0;
    for (let player of game.players) {
        // p.fill(player.color);
        // p.rect(scoreBoardX, scoreBoardY + yOffset, 100, 20);

        let headDiameter = scoreBoardWidth / 10;
        let bodyDiameter = headDiameter * 2;
        p.fill(player.color);
        p.noStroke();
        p.circle(scoreBoardX, scoreBoardY + bodyDiameter + yOffset - headDiameter, headDiameter);
        p.arc(scoreBoardX, scoreBoardY + bodyDiameter + yOffset, bodyDiameter, bodyDiameter, p.PI, 0);

        p.fill(0);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(player.name + " Cards: " + player.hand.length, scoreBoardX, scoreBoardY + 12 + yOffset);
        yOffset += 20;
    }
}

function boardDisplayDims(p: p5, game: GameState) {
    let displayBoardWidth = Math.min(p.width - 200, p.height - 200);
    let displayBoardHeight = displayBoardWidth / game.boardWidth * game.boardHeight;
    return [displayBoardWidth, displayBoardHeight];
}

function boardTileCornerToPixel(p: p5, game: GameState, x: number, y: number) {
    let [displayBoardWidth, displayBoardHeight] = boardDisplayDims(p, game);
    let tileWidth = displayBoardWidth / game.boardWidth;
    let tileHeight = displayBoardHeight / game.boardHeight;
    return [x * tileWidth, displayBoardHeight - y * tileHeight];
}

function boardTileCenterToPixel(p: p5, game: GameState, x: number, y: number) {
    let [displayBoardWidth, displayBoardHeight] = boardDisplayDims(p, game);
    let tileWidth = displayBoardWidth / game.boardWidth;
    let tileHeight = displayBoardHeight / game.boardHeight;
    return [(x + 0.5) * tileWidth, displayBoardHeight - (y + 0.5) * tileHeight];
}

function pixelToBoardTile(p: p5, game: GameState, x: number, y: number) {
    let [displayBoardWidth, displayBoardHeight] = boardDisplayDims(p, game);
    let tileWidth = displayBoardWidth / game.boardWidth;
    let tileHeight = displayBoardHeight / game.boardHeight;
    return [Math.floor(x / tileWidth), Math.floor(displayBoardHeight + y / tileHeight)];
}

function drawBoard(p: p5, game: GameState) {
    let displayBoardWidth = Math.min(p.width - 200, p.height - 200);
    let displayBoardHeight = displayBoardWidth / game.boardWidth * game.boardHeight;
    let tileWidth = displayBoardWidth / game.boardWidth;
    let tileHeight = displayBoardHeight / game.boardHeight;

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

    // pieces
    for (const piece of game.pieces) {
        let [px, py] = boardTileCenterToPixel(p, game, piece.x, piece.y);
        if(piece.type === PieceType.Coin) {
            p.strokeWeight(3)
            p.stroke("#666644");
            p.fill("#999944");
            p.circle(px, py, tileWidth / 2);
        }
        if(piece.type === PieceType.Bomb) {
            p.noStroke();
            p.fill(0);
            let bombRadius = tileWidth / 4;
            p.circle(px, py, bombRadius*2);

            p.noFill();
            p.stroke(0);
            p.strokeWeight(3)
            p.arc(px, py - bombRadius, bombRadius, bombRadius, p.PI * 3/2, p.PI/4);
        }
        if(piece.type === PieceType.Shoot) {
            let longPiece = piece as LongBoardPiece;
            let [px2, py2] = boardTileCenterToPixel(p, game, longPiece.x2, longPiece.y2);
            p.stroke("#666666");
            p.strokeWeight(5);
            p.noFill();
            let cx = px;
            let cy = py + tileHeight;
            let cx2 = px2;
            let cy2 = py2 - tileHeight;
            if (px < px2) {
                cx -= tileWidth * 2;
                cx2 += tileWidth * 2;
            } else {
                cx += tileWidth * 2;
                cx2 -= tileWidth * 2;
            }
            p.splineProperty('ends', p.EXCLUDE)
            p.spline(cx, cy, px, py, px2, py2, cx2, cy2);
        }
        if(piece.type === PieceType.Ladder) {
            let longPiece = piece as LongBoardPiece;
            let [px2, py2] = boardTileCenterToPixel(p, game, longPiece.x2, longPiece.y2);
            p.stroke("#774444");
            p.strokeWeight(5);
            // latter rails
            p.line(px - tileWidth/4, py, px2 - tileWidth/4, py2);
            p.line(px + tileWidth/4, py, px2 + tileWidth/4, py2);

            // latter rungs
            let ladderLength = p.dist(px, py, px2, py2);
            let railWidth = tileWidth / 2;
            let rungsPerTile = 3;
            let numRungs = Math.floor(ladderLength / railWidth) * rungsPerTile;
            let dx = px2 - px;
            let dy = py2 - py;
            for (let i = 1; i < numRungs; i++) {
                let rungX = px + dx * i / numRungs;
                let rungY = py + dy * i / numRungs;
                p.strokeWeight(3);
                p.line(rungX - tileWidth/4, rungY, rungX + tileWidth/4, rungY);
            }
        }
        if (piece.type === PieceType.Pawn) {
            let headDiameter = tileWidth / 4;
            let bodyDiameter = tileWidth / 2;
            let color = game.players.find(p => p.id === piece.playerId)!.color;
            // if multiple pieces on same square, need to shift them so all are visible
            let numberOfPiecesOnSquare = game.pieces.filter(p => p.x === piece.x && p.y === piece.y).length;
            let playerIndex = game.players.findIndex(p => p.id === piece.playerId);
            let allOffset = tileWidth / 2 * (numberOfPiecesOnSquare - 1) / numberOfPiecesOnSquare;
            let offset = tileWidth / 2 * playerIndex / numberOfPiecesOnSquare;
            p.fill(color);
            p.noStroke();
            p.circle(px + offset - allOffset/2, py - headDiameter + offset, headDiameter);
            p.arc(px + offset - allOffset/2, py + offset, bodyDiameter, bodyDiameter, p.PI, 0);
        }
    }

    p.noStroke();
    p.pop();
}

function getCardDimensions(p: p5) {
    let cardWidth = p.width / 8;
    let cardHeight = cardWidth * 1.5;
    return [cardWidth, cardHeight];
}
const CARD_COLORS = new Map<CardAction, string>([
    [CardAction.Move, "#44BC66"],

    [CardAction.Grow, "#4466FF"],
    [CardAction.Shrink, "#4466FF"],

    [CardAction.Remove, "#FF4466"],
    [CardAction.Place, "#FF4466"],

    [CardAction.Unmask, "#AA9966"],
    [CardAction.Mask, "#AA9966"],
]);

function getCardActionWord(action: CardAction | undefined) {
    if (!action) return "???";
    return action.toString().toUpperCase();
}
function getTargetWord(target: SelectPieceType | SelectObjectType | undefined) {
    if (!target) return "???";
    return target.toString().toUpperCase();
}

function getPieceWord(pieceType: PieceType | undefined) {
    if (!pieceType) return "???";
    return pieceType.toString().toUpperCase();
}

function getDirWord(dir: Direction | undefined) {
    if (!dir) return "???";
    return dir.toString().toUpperCase();
}

function drawCard(p: p5, card: Card) {
    let [cardWidth, cardHeight] = getCardDimensions(p);
    let roundedness = cardWidth / 6;
    let mouse = p.screenToWorld(p.mouseX, p.mouseY);
    let cardColor = CARD_COLORS.get(card.action.getKnownData()) || "#FF00FF";
    p.strokeWeight(3)
    p.stroke(cardColor);
    p.fill(222);
    if (mouse.x > 0 && mouse.x < cardWidth && mouse.y > 0 && mouse.y < cardHeight) {
        // hovered
        p.rotate(p.radians(-5));
        p.scale(1.1);
        p.rect(0, 0, cardWidth, cardHeight, roundedness);
    } else {
        p.rect(0, 0, cardWidth, cardHeight, roundedness);
    }

    let numCardSegments = 4;
    if (card.placePieceType) numCardSegments++;
    if (card.actionTarget.targetType.getKnownData() in [SelectPieceType.All, SelectPieceType.Target]) {
        numCardSegments++;
    }
    if (card.x) numCardSegments++;
    if (card.dir) numCardSegments++;

    let segment = 1;
    let actionWord = getCardActionWord(card.action.getKnownData());
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(cardWidth / 8);
    p.fill(cardColor);
    p.stroke(cardColor);
    p.strokeWeight(1);
    p.text(actionWord, cardWidth / 2, cardHeight * segment / numCardSegments);

    if (card.placePieceType) {
        segment++;
        p.text(getPieceWord(card.placePieceType?.getKnownData()), cardWidth / 2, cardHeight * segment / numCardSegments);
    }

    segment++;
    let knownActionTarget = card.actionTarget.targetType.getKnownData();
    let targetWord = getTargetWord(knownActionTarget);
    p.text(targetWord, cardWidth / 2, cardHeight * segment / numCardSegments);

    if (knownActionTarget == SelectPieceType.All || knownActionTarget == SelectPieceType.Target) {
        segment++;
        let knownTargetPieceType = card.actionTarget.pieceType.getKnownData();
        let targetPieceWord = getPieceWord(knownTargetPieceType);
        p.text(targetPieceWord, cardWidth / 2, cardHeight * segment / numCardSegments);
    }
    if (card.x) {
        segment++;
        p.text(card.x.getKnownData() || "?", cardWidth / 2, cardHeight * segment / numCardSegments);
    }
    if (card.dir) {
        segment++;
        p.text(getDirWord(card.dir.getKnownData()), cardWidth / 2, cardHeight * segment / numCardSegments);
    }
}

function drawDie(p: p5) {
    let [cardWidth, cardHeight] = getCardDimensions(p);
    let dieSize = cardWidth / 2;
    let mouse = p.screenToWorld(p.mouseX, p.mouseY);
    let hover = false;
    if (mouse.x > -dieSize/2 && mouse.x < dieSize/2 && mouse.y > -dieSize/2 && mouse.y < dieSize/2) {
        p.rotate(p.radians(-10));
        hover = true;
    }

    let roundedness = cardWidth / 6;
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(0, 0, dieSize, dieSize, roundedness);

    let dieState = 5;
    let dotSize = dieSize/8;
    p.fill(0);
    switch (dieState) {
        case 1:
            p.circle(0, 0, dotSize);
            break;
        case 2:
            p.circle(-dotSize*2, -dotSize*2, dotSize);
            p.circle(dotSize*2, dotSize*2, dotSize);
            break;
        case 3:
            p.circle(-dotSize*3, -dotSize*3, dotSize);
            p.circle(0, 0, dotSize);
            p.circle(dotSize*3, dotSize*3, dotSize);
            break;
        case 4:
            p.circle(-dotSize*2, -dotSize*2, dotSize);
            p.circle(dotSize*2, dotSize*2, dotSize);
            p.circle(-dotSize*2, dotSize*2, dotSize);
            p.circle(dotSize*2, -dotSize*2, dotSize);
            break;
        case 5:
            p.circle(-dotSize*2, -dotSize*2, dotSize);
            p.circle(dotSize*2, dotSize*2, dotSize);
            p.circle(-dotSize*2, dotSize*2, dotSize);
            p.circle(dotSize*2, -dotSize*2, dotSize);
            p.circle(0, 0, dotSize);
            break;
        case 6:
            p.circle(-dotSize*2, -dotSize*3, dotSize);
            p.circle(dotSize*2, -dotSize*3, dotSize);
            p.circle(-dotSize*2, 0, dotSize);
            p.circle(-dotSize*2, 0, dotSize);
            p.circle(dotSize*2, dotSize*3, dotSize);
            p.circle(dotSize*2, dotSize*3, dotSize);
            break;
    }
}

function drawHand(p: p5, game: GameState) {
    let [cardWidth, cardHeight] = getCardDimensions(p);
    let currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
    p.push();
    p.translate(p.width / 2 + currentPlayer.hand.length * cardWidth / 2, p.height - cardHeight);
    for (let card of currentPlayer.hand) {
        p.translate(-cardWidth - 5, 0);

        p.push();
        drawCard(p, card);
        p.pop();
    }

    let dieSize = cardWidth / 2;
    p.translate(-dieSize/2 - 5, cardHeight / 2);
    p.push();
    drawDie(p);
    p.pop();

    p.pop();
}

export function drawGame(p: p5) {
    p.background(255);
    const game = window.game;

    drawBoard(p, game);
    drawHand(p, game);
    drawScoreboard(p, game);
}