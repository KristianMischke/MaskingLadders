import p5 from "p5";
import {Card, CardAction, Direction, PieceType, SelectObjectType, SelectPieceType} from "../gamelogic";

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

function getCardDimensions(p: p5) {
    let cardWidth = p.width / 8;
    let cardHeight = cardWidth * 1.5;
    return [cardWidth, cardHeight];
}

export class CardRenderer {
    card?: Card;
    x: number;
    y: number;
    w: number;
    rotation: number = 0;
    isHovered: boolean = false;

    constructor(card: Card | null, x: number, y: number) {
        this.card = card;
        this.x = x;
        this.y = y;
    }

    update(p: p5) {
        this.isHovered = false;
    }

    draw(p: p5) {
        let card = this.card;

        let cardWidth = this.w;
        let cardHeight = cardWidth * 1.5;

        let roundedness = cardWidth / 6;
        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        let cardColor = CARD_COLORS.get(card.action.getKnownData()) || "#FF00FF";
        p.rectMode(p.CENTER);
        p.strokeWeight(3)
        p.stroke(cardColor);
        p.fill(222);
        if (mouse.x > -cardWidth/2 && mouse.x < cardWidth/2 && mouse.y > -cardHeight/2 && mouse.y < cardHeight/2) {
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
        let segmentHeight = cardHeight / numCardSegments;

        p.push();
        p.translate(0, -cardHeight/2);

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(cardWidth / 8);
        p.fill(cardColor);
        p.stroke(cardColor);
        p.strokeWeight(1);

        let actionWord = getCardActionWord(card.action.getKnownData());
        p.translate(0, segmentHeight);
        p.text(actionWord, 0, 0);

        if (card.placePieceType) {
            p.translate(0, segmentHeight);
            p.text(getPieceWord(card.placePieceType?.getKnownData()), 0, 0);
        }

        let knownActionTarget = card.actionTarget.targetType.getKnownData();
        let targetWord = getTargetWord(knownActionTarget);
        p.translate(0, segmentHeight);
        p.text(targetWord, 0, 0);

        if (knownActionTarget == SelectPieceType.All || knownActionTarget == SelectPieceType.Target) {
            let knownTargetPieceType = card.actionTarget.pieceType.getKnownData();
            let targetPieceWord = getPieceWord(knownTargetPieceType);
            p.translate(0, segmentHeight);
            p.text(targetPieceWord, 0, 0,);
        }
        if (card.x) {
            p.translate(0, segmentHeight);
            p.text(card.x.getKnownData() || "?", 0, 0);
        }
        if (card.dir) {
            p.translate(0, segmentHeight);
            p.text(getDirWord(card.dir.getKnownData()), 0, 0);
        }
        p.pop();
    }
}

