import { Card } from './card';

export class Player {
  id: string;
  playerId: number;
  username: string;
  img: string;
  rank: number;
  wins: number;
  losses: number;
  hand: Array<Card>;
  isTurn: boolean;
  isSelected: boolean;
}
