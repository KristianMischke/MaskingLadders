import p5 from "p5";
import {GameAction, GameActionType, GameState} from "../gamelogic";
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

    update(p: p5, game: GameState) {
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
        this.dieRenderer.update(p);
        this.revealedCardRenderer.update(p);
    }

    draw(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;

        // scale card dimensions
        let cardWidth = p.width / 8;
        let cardHeight = cardWidth * 1.5;

        p.push();
        p.translate(this.x, this.y);

        let currentPlayer = gameRenderer.game.players.find(p => p.id === gameRenderer.game.currentPlayerId)!;
        p.fill(currentPlayer.color);
        p.noStroke();
        p.ellipse(0, 0, p.width * 0.8, cardHeight);

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
        this.dieRenderer.draw(p);

        p.pop();

        p.push();
        p.translate(p.width - cardWidth - 10, p.height/2);
        p.scale(1.5);
        this.revealedCardRenderer.revealedCard = gameRenderer.revealedCard;
        this.revealedCardRenderer.w = cardWidth;
        this.revealedCardRenderer.draw(p);
        p.pop();
    }

    handleClick(gameRenderer: GameRenderer) {
        for (let i = 0; i < this.activeRenderers; i++) {
            let cardRenderer = this.cardRenderers[i];
            if (cardRenderer.isHovered) {
                gameRenderer.game.submitAction({
                    playerId: gameRenderer.game.currentPlayerId,
                    action: GameActionType.PlayCard,
                    cardId: cardRenderer.card.id,
                } as GameAction)
                return;
            }
        }
        if (this.dieRenderer.isHovered) {
            gameRenderer.rollDie = true;
            return;
        }
    }
}