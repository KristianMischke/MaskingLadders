import {GameState} from './gamelogic';

declare global {
    interface Window {
        game?: GameState;
    }
}

export {};