import p5 from "p5";
import {GameAction, GameActionType, GameState, RedactType} from "../gamelogic";
import {CardRenderer} from "./cardRenderer";
import {DieRenderer} from "./dieRenderer";
import {GameRenderer} from "./gameRenderer";

export class HandRenderer {
    x: number;
    y: number;
    w: number;
    cardRenderers: CardRenderer[] = [];
    activeRenderers: number;
    dieRenderer: DieRenderer = new DieRenderer(0, 0, 0);
    revealedCardRenderer: CardRenderer = new CardRenderer(null, 0, 0);
    constructor(x: number, y: number, w: number) {
        this.x = x;
        this.y = y;
        this.w = w;
    }

    update(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;
        let game = gameRenderer.game!;

        let currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
        currentPlayer.hand.forEach((card, i) => {
            if (i >= this.cardRenderers.length) {
                this.cardRenderers.push(
                    new CardRenderer(card, 0, 0)
                );
            }
            this.cardRenderers[i].card = card;
        });
        this.activeRenderers = currentPlayer.hand.length;
        for (let i = 0; i < this.activeRenderers; i++) {
            this.cardRenderers[i].update(p);
        }
        this.dieRenderer.update(gameRenderer);
        this.revealedCardRenderer.update(p);
    }

    draw(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;

        // scale card dimensions
        let cardWidth = p.width / 8;
        let cardHeight = cardWidth * 1.5;

        p.push();
        p.translate(this.x, this.y);

        // player color card backgorund
        let currentPlayer = gameRenderer.game.players.find(p => p.id === gameRenderer.game.currentPlayerId)!;
        p.fill(currentPlayer.color);
        p.noStroke();
        p.ellipse(0, 0, p.width * 0.8, cardHeight);

        if (gameRenderer.game.shouldCurrentPlayerRedactCard()) {
            p.push();
            p.translate(0, -cardHeight*2);
            p.background(255, 255, 255, 200); // haze
            p.fill("#999");
            p.stroke("#333");
            p.rectMode(p.CENTER);
            p.rect(0, 0, cardHeight, cardHeight/2, 10);

            p.fill(0);
            p.textAlign(p.CENTER);
            p.textSize(20);
            p.text("Redact a Card", 0, 0);
            p.pop();
        }

        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        let isMouseInHand = mouse.x > - p.width*0.4 && mouse.x < p.width*0.4 && mouse.y > -cardHeight*0.75 && mouse.y < cardHeight/2;
        if (!isMouseInHand) {
            // move cards down
            p.translate(0, cardHeight*0.7);
        }

        p.translate(this.activeRenderers * cardWidth / 2, 0);
        gameRenderer.hoveredCard = null;
        this.cardRenderers
            .slice(0, this.activeRenderers)
            .forEach(cr => {
                let index = this.cardRenderers.indexOf(cr);
                p.push();
                p.translate((-cardWidth - 5) * index, -cardHeight/2);
                cr.w = cardWidth;
                cr.draw(p);
                if (cr.isHovered) {
                    gameRenderer.hoveredCard = cr.card;
                }
                p.pop();
            });

        p.translate((-cardWidth - 5) * (this.activeRenderers - 1), 0);

        // render die
        let dieSize = cardWidth / 2;
        p.translate(-cardWidth/2 - dieSize/2 - 10, 0);
        if (isMouseInHand) {
            p.translate(0, -cardHeight/2);
        } else {
            p.translate(0, dieSize/2 - cardHeight);
        }
        this.dieRenderer.w = cardWidth;
        this.dieRenderer.draw(p, gameRenderer.isRollingDie);

        p.pop();

        p.push();
        p.translate(p.width - cardWidth - 10, p.height/2);
        p.scale(1.5);
        this.revealedCardRenderer.card = gameRenderer.redactingCard;
        this.revealedCardRenderer.revealedCard = gameRenderer.revealedCard;
        this.revealedCardRenderer.isRedacting = gameRenderer.redactingCard !== null;
        this.revealedCardRenderer.w = cardWidth;
        this.revealedCardRenderer.draw(p);
        p.pop();
    }

    handleClick(gameRenderer: GameRenderer) {
        let game = gameRenderer.game!;

        if (game.shouldCurrentPlayerRedactCard()) {
            let redactType = null;
            if (this.revealedCardRenderer.isActionHovered) {
                redactType = RedactType.Action;
            } else if (this.revealedCardRenderer.isActionTargetTypeHovered) {
                redactType = RedactType.TargetType;
            } else if (this.revealedCardRenderer.isActionPlacePieceTypeHovered) {
                redactType = RedactType.PlacePieceType;
            } else if (this.revealedCardRenderer.isActionPieceTypeHovered) {
                redactType = RedactType.PieceType;
            } else if (this.revealedCardRenderer.isActionXHovered) {
                redactType = RedactType.X;
            } else if (this.revealedCardRenderer.isActionDirHovered) {
                redactType = RedactType.Dir;
            }
            if (redactType !== null) {
                game.submitAction({
                    playerId: game.currentPlayerId,
                    action: GameActionType.RedactCard,
                    cardId: gameRenderer.redactingCard!.id,
                    redactType: redactType,
                } as GameAction);
                gameRenderer.redactingCard = null;
                gameRenderer.revealedCard = null;
            }
        }

        for (let i = 0; i < this.activeRenderers; i++) {
            let cardRenderer = this.cardRenderers[i];
            if (cardRenderer.isHovered && game.canCurrentPlayerPlayCard()) {
                game.submitAction({
                    playerId: game.currentPlayerId,
                    action: GameActionType.PlayCard,
                    cardId: cardRenderer.card.id,
                } as GameAction)
                return;
            }
            if (cardRenderer.isHovered && game.shouldCurrentPlayerRedactCard()) {
                gameRenderer.redactingCard = cardRenderer.card;
            }
        }

        if (this.dieRenderer.isHovered && game.canCurrentPlayerMovePawn()) {
            gameRenderer.isRollingDie = true;
            return;
        }
    }
}