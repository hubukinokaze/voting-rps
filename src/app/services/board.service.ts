import { Injectable } from '@angular/core';
import { Card }       from '../models/card';
import { Player }     from '../models/player';
import { Game }       from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  game: Game;

  constructor() {
  }

  public startGame(roundSize: number, user1: Player, user2: Player): Game {
    this.game             = new Game();
    this.game.roundNumber = 0;
    this.game.roundSize   = roundSize;
    this.game.isRoundOver = false;
    this.game.isGameOver  = false;
    this.game.players = [user1, user2];
    // this.game.player1.username = 'Player ' + Math.floor(Math.random() * 1001);

    this.setRoundResults(this.game.roundSize);
    this.createDeck();
    this.nextRound();
    return this.game;
  }

  private setRoundResults(roundSize: number) {
    this.game.roundResults = [2];
    for (let i = 1; i < roundSize; i++) {
      this.game.roundResults.push(2);
    }
  }

  public createDeck() {
    this.game.deck = [];

    let count = 0;
    while (count < this.game.roundSize * 6) {
      const tempCard = new Card();
      tempCard.img   = './assets/card-img-001.png';
      const rng      = Math.floor(Math.random() * 3);
      switch (rng) {
        case 0:
          tempCard.name = 'ROCK';
          break;
        case 1:
          tempCard.name = 'PAPER';
          break;
        case 2:
          tempCard.name = 'SCISSOR';
          break;
      }

      this.game.deck.push(tempCard);

      count++;
    }
  }

  public nextRound() {
    window.scrollTo(0, 0);
    this.game.isRoundOver      = false;

    this.passCards(this.game.players[0]);
    this.passCards(this.game.players[1]);
    // this.selectCard(this.game.player2, Math.floor(Math.random() * 3));

    this.game.players[0].isTurn = true;
    this.game.players[1].isTurn = true;
  }

  private passCards(player: Player) {
    player.isSelected = false;
    player.hand       = [];
    player.hand.push(this.game.deck.pop());
    player.hand.push(this.game.deck.pop());
    player.hand.push(this.game.deck.pop());

    // for (let i of [500, 1000, 1500]) {
    //   setTimeout((f) => {
    //     player.hand.push(this.deck.pop());
    //   }, i);
    // }
  }

  public selectCard(player: Player, index: number) {
    for (let i = 0; i < player.hand.length; i++) {
      if (i !== index) {
        player.hand[i].isSelected = false;
      }
    }
    player.hand[index].isSelected = !player.hand[index].isSelected;
    player.isSelected             = (player.hand[index].isSelected) ? true : false;
  }

  public submit(game: Game) {
    this.game = game;
    let msg                 = '';
    const selectedCard      = this.game.players[0].hand.filter((x) => x.isSelected === true)[0].name;
    const enemySelectedCard = this.game.players[1].hand.filter((x) => x.isSelected === true)[0].name;

    if (selectedCard === enemySelectedCard) {
      msg                                           = 'You tied!';
      this.game.roundResults[this.game.roundNumber] = 0;
    } else if (selectedCard === 'ROCK' && enemySelectedCard === 'PAPER') {
      msg                                           = 'You lose!';
      this.game.roundResults[this.game.roundNumber] = -1;
    } else if (selectedCard === 'PAPER' && enemySelectedCard === 'SCISSOR') {
      msg                                           = 'You lose!';
      this.game.roundResults[this.game.roundNumber] = -1;
    } else if (selectedCard === 'SCISSOR' && enemySelectedCard === 'ROCK') {
      msg                                           = 'You lose!';
      this.game.roundResults[this.game.roundNumber] = -1;
    } else {
      msg                                           = 'You win!';
      this.game.roundResults[this.game.roundNumber] = 1;
    }
    this.game.roundNumber++;
    this.game.isRoundOver    = true;
    if (this.game.deck.length === 0) {
      this.game.isGameOver = true;
    }
    this.checkGameOver();
    return {game: this.game, msg: msg};
  }

  private checkGameOver() {
    if (this.game.roundResults.filter(x => x === -1).length > this.game.roundSize / 2) {
      this.game.isGameOver = true;
    } else if (this.game.roundResults.filter(x => x === 1).length > this.game.roundSize / 2) {
      this.game.isGameOver = true;
    }
  }
}
