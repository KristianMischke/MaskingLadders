import {GameState} from './gamelogic';

declare global {
    interface Window {
        game?: GameState;
        hasSavedGame?: boolean;
        hideGame?: boolean;
    }
}

export {};