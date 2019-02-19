import { Card }   from './card';
import { Player } from './player';

export class Game {
  deck: Array<Card>;
  roundResults: Array<number>;
  roundNumber: number;
  roundSize: number;
  isGameOver: boolean;
  player1: Player     = new Player();
  player2: Player     = new Player();
}
