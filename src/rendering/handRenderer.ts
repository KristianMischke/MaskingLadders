import p5 from "p5";
import {GameState} from "../gamelogic";
import {CardRenderer} from "./cardRenderer";

export class HandRenderer {
    x: number;
    y: number;
    w: number;
    cardRenderers: CardRenderer[] = [];
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
    }

    draw(p: p5, game: GameState) {
        // scale card dimensions
        let cardWidth = p.width / 8;
        let cardHeight = cardWidth * 1.5;

        let currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
        p.push();
        // p.translate(p.width / 2 + currentPlayer.hand.length * cardWidth / 2, p.height);
        p.translate(this.x + currentPlayer.hand.length * cardWidth / 2, this.y);
        currentPlayer.hand.forEach((card, i) => {
            p.translate(-cardWidth - 5, 0);
            p.push();
            p.translate(0, -cardHeight/2);
            let cardRenderer = this.cardRenderers[i];
            cardRenderer.w = cardWidth;
            cardRenderer.x = cardWidth / 2;
            this.cardRenderers[i].draw(p);
            p.pop();
        });

        let dieSize = cardWidth / 2;
        p.translate(-dieSize/2 - 5, 0);
        // draw die
        p.pop();
    }
}