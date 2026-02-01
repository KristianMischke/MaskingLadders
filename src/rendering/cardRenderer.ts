import p5 from "p5";
import {
    Card,
    CardAction,
    Direction,
    MaskOrMystery,
    PieceType,
    RevealedCard,
    SelectObjectType,
    SelectPieceType
} from "../gamelogic";

const CARD_COLORS = new Map<CardAction, string>([
    [CardAction.Move, "#44BC66"],

    [CardAction.Grow, "#4466FF"],
    [CardAction.Shrink, "#4466FF"],

    [CardAction.Remove, "#FF4466"],
    [CardAction.Place, "#FF4466"],

    [CardAction.Draw, "#AA9966"],
    [CardAction.Skip, "#AA9966"],
]);

function getMysteryText() {
    let s = "laskdfj;238u42ji34p9t5jdlfk";
    let len = 7;
    let start = Math.floor(Math.random() * (s.length - len));
    return s.slice(start, len);
}

function getCardActionWord(action: CardAction | MaskOrMystery) {
    if (action === MaskOrMystery.Mask) return "???";
    if (action === MaskOrMystery.Mystery) return getMysteryText();
    return action.toString().toUpperCase();
}
function getTargetWord(target: SelectPieceType | SelectObjectType | MaskOrMystery) {
    if (target === MaskOrMystery.Mask) return "???";
    if (target === MaskOrMystery.Mystery) return getMysteryText();
    return target.toString().toUpperCase();
}

function getPieceWord(pieceType: PieceType | MaskOrMystery) {
    if (pieceType === MaskOrMystery.Mask) return "???";
    if (pieceType === MaskOrMystery.Mystery) return getMysteryText();
    return pieceType.toString().toUpperCase();
}

function getDirWord(dir: Direction | MaskOrMystery) {
    if (dir === MaskOrMystery.Mask) return "???";
    if (dir === MaskOrMystery.Mystery) return getMysteryText();
    return dir.toString().toUpperCase();
}

function getCardDimensions(p: p5) {
    let cardWidth = p.width / 8;
    let cardHeight = cardWidth * 1.5;
    return [cardWidth, cardHeight];
}

export class CardRenderer {
    card?: Card;
    revealedCard?: RevealedCard = null;
    x: number;
    y: number;
    w: number;
    rotation: number = 0;
    isHovered: boolean = false;
    isRedacting: boolean = false;

    isActionHovered: boolean = false;
    isActionTargetTypeHovered: boolean = false;
    isActionPlacePieceTypeHovered: boolean = false;
    isActionPieceTypeHovered: boolean = false;
    isActionXHovered: boolean = false;
    isActionDirHovered: boolean = false;

    constructor(card: Card | null, x: number, y: number) {
        this.card = card;
        this.x = x;
        this.y = y;
    }

    update(p: p5) {
        this.isHovered = false;
        this.isActionHovered = false;
        this.isActionTargetTypeHovered = false;
        this.isActionPlacePieceTypeHovered = false;
        this.isActionPieceTypeHovered = false;
        this.isActionXHovered = false;
        this.isActionDirHovered = false;
    }

    draw(p: p5) {
        if (!this.card && !this.revealedCard) return;

        let action: CardAction | MaskOrMystery = undefined;
        let actionTargetType: SelectObjectType | SelectPieceType | MaskOrMystery | undefined = undefined;
        let actionPieceType: PieceType | MaskOrMystery | undefined = undefined;
        let placePieceType: PieceType | MaskOrMystery | undefined = undefined;
        let x: number | MaskOrMystery | undefined = undefined;
        let dir: Direction | MaskOrMystery | undefined = undefined;
        if (this.revealedCard) {
            action = this.revealedCard.action;
            actionTargetType = this.revealedCard.targetType;
            actionPieceType = this.revealedCard.pieceType;
            placePieceType = this.revealedCard.placePieceType;
            x = this.revealedCard.x;
            dir = this.revealedCard.dir;
        }
        if (this.card) {
            action = this.card.action.getKnownData();
            actionTargetType = this.card.actionTarget?.targetType.getKnownData();
            actionPieceType = this.card.actionTarget?.pieceType.getKnownData();
            placePieceType = this.card.placePieceType?.getKnownData();
            x = this.card.x?.getKnownData();
            dir = this.card.dir?.getKnownData();
        }

        let cardWidth = this.w;
        let cardHeight = cardWidth * 1.5;

        let roundedness = cardWidth / 6;
        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        let cardColor: p5.Color;
        if (action === MaskOrMystery.Mask) {
            cardColor = p.color("#FF00FF");
        } else if (action == MaskOrMystery.Mystery) {
            cardColor = p.color(p.random(255), 0, p.random(255));
        } else {
            cardColor = p.color(CARD_COLORS.get(action));
        }
        p.rectMode(p.CENTER);
        p.strokeWeight(3)
        p.stroke(cardColor);
        p.fill(222);

        if (!this.isRedacting && mouse.x > -cardWidth/2 && mouse.x < cardWidth/2 && mouse.y > -cardHeight/2 && mouse.y < cardHeight/2) {
            // hovered
            this.isHovered = true;
            p.rotate(p.radians(-5));
            p.scale(1.1);
        }
        p.rect(0, 0, cardWidth, cardHeight, roundedness);

        let numCardSegments = 4;
        if (placePieceType) numCardSegments++;
        if (actionTargetType in [SelectPieceType.All, SelectPieceType.Target]) {
            numCardSegments++;
        }
        if (x) numCardSegments++;
        if (dir) numCardSegments++;
        let segmentHeight = cardHeight / numCardSegments;

        p.push();
        p.translate(0, -cardHeight/2);

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(cardWidth / 8);
        p.fill(cardColor);
        p.stroke(cardColor);
        p.strokeWeight(1);

        let isSegmentHovered = () => {
            let mouse = p.screenToWorld(p.mouseX, p.mouseY);
            let isHovered = mouse.x > -cardWidth/2 && mouse.x < cardWidth/2 && mouse.y > -segmentHeight/2 && mouse.y < segmentHeight/2;
            if (this.isRedacting) {
                let color = p.color(cardColor);
                p.push();
                color.setAlpha(isHovered ? 255 : 45);
                p.fill(color);
                p.noStroke();
                p.rect(0, 0, cardWidth - 10, segmentHeight - 2, 5);
                p.pop();
            }
            return isHovered;
        };

        let actionWord = getCardActionWord(action);
        p.translate(0, segmentHeight);
        p.text(actionWord, 0, 0);
        this.isActionHovered = isSegmentHovered();

        if (placePieceType) {
            p.translate(0, segmentHeight);
            p.text(getPieceWord(placePieceType), 0, 0);
            this.isActionPlacePieceTypeHovered = isSegmentHovered();
        }

        if (actionTargetType) {
            let targetWord = getTargetWord(actionTargetType);
            p.translate(0, segmentHeight);
            p.text(targetWord, 0, 0);
            this.isActionTargetTypeHovered = isSegmentHovered();
        }

        if (actionTargetType == SelectPieceType.All || actionTargetType == SelectPieceType.Target) {
            let targetPieceWord = getPieceWord(actionPieceType);
            p.translate(0, segmentHeight);
            p.text(targetPieceWord, 0, 0,);
            this.isActionPieceTypeHovered = isSegmentHovered();
        }
        if (x) {
            let xWord = x.toString();
            if (x === MaskOrMystery.Mask) xWord = "???";
            if (x === MaskOrMystery.Mystery) xWord = getMysteryText();
            p.translate(0, segmentHeight);
            p.text(xWord, 0, 0);
            this.isActionXHovered = isSegmentHovered();
        }
        if (dir) {
            p.translate(0, segmentHeight);
            p.text(getDirWord(dir), 0, 0);
            this.isActionDirHovered = isSegmentHovered();
        }
        p.pop();
    }
}

