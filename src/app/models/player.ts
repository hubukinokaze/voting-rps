import { Card } from './card';

export class Player {
  id: string;
  playerId: number;
  username: string;
  img: string;
  rank: number;
  scores: Array<number> = [];
  wins: number;
  losses: number;
  hand: Array<Card> = [];
  isTurn: boolean;
  isSelected: boolean;
}
