import { Card }   from './card';
import { Player } from './player';

export class Game {
  id: any;
  deck: Array<Card> = [];
  roundResults: Array<number> = [];
  roundNumber: number;
  roundSize: number;
  isRoundOver: boolean;
  isGameOver: boolean;
  players: Array<Player> = [];
  isSolo: boolean;
}
