import { Component }   from '@angular/core';
import { Card }        from "./models/card";
import { Player }      from "./models/player";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title: string     = 'Voting RPS';
  deck: Array<Card> = [];
  round: Array<any> = [];
  roundNumber: number = 0;
  isGameOver: boolean;
  player1: Player   = new Player();
  player2: Player   = new Player();

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.startGame();
  }

  public startGame() {
    this.round      = [2, 2, 2, 2, 2];
    this.roundNumber = 0;
    this.createDeck();
    this.nextRound();
  }

  public nextRound() {
    this.isGameOver = false;
    this.passCards(this.player1);
    this.passCards(this.player2);
    this.selectCard(this.player2, Math.floor(Math.random() * 3));
    this.player1.isTurn = true;
    this.player2.isTurn = false;
  }

  private createDeck() {
    this.deck = [];
    let count = 0;
    while (count < 30) {
      let tempCard = new Card();
      tempCard.img = './assets/card-img-001.png';
      let rng      = Math.floor(Math.random() * 3);
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

      this.deck.push(tempCard);

      count++;
    }
  }

  private passCards(player: Player) {
    player.username   = 'Player ' + Math.floor(Math.random() * 1001);
    player.isSelected = false;
    player.hand       = [];
    player.hand.push(this.deck.pop());
    player.hand.push(this.deck.pop());
    player.hand.push(this.deck.pop());

    // for (let i of [500, 1000, 1500]) {
    //   setTimeout((f) => {
    //     player.hand.push(this.deck.pop());
    //   }, i);
    // }
  }

  public selectCard(player: Player, index: number) {
    if (!this.isGameOver) {
      for (let i = 0; i < player.hand.length; i++) {
        if (i != index) {
          player.hand[i].isSelected = false;
        }
      }
      player.hand[index].isSelected = !player.hand[index].isSelected;
      player.isSelected             = (player.hand[index].isSelected) ? true : false;
    }
  }

  public submit() {
    if (!this.isGameOver) {
      let msg               = '';
      let selectedCard      = this.player1.hand.filter((x) => x.isSelected == true)[0].name;
      let enemySelectedCard = this.player2.hand.filter((x) => x.isSelected == true)[0].name;

      if (selectedCard === enemySelectedCard) {
        msg = 'You tied!';
        this.round[this.roundNumber] = 0;
      } else if (selectedCard === 'ROCK' && enemySelectedCard === 'PAPER') {
        msg = 'You lose!';
        this.round[this.roundNumber] = -1;
      } else if (selectedCard === 'PAPER' && enemySelectedCard === 'SCISSOR') {
        msg = 'You lose!';
        this.round[this.roundNumber] = -1;
      } else if (selectedCard === 'SCISSOR' && enemySelectedCard === 'ROCK') {
        msg = 'You lose!';
        this.round[this.roundNumber] = -1;
      } else {
        msg = 'You win!';
        this.round[this.roundNumber] = 1;
      }
      this.roundNumber++;
      this.player1.isTurn = false;
      this.player2.isTurn = true;
      this.isGameOver     = true;

      this.snackBar.open(msg, '', {
        duration: 5000,
      });
    }
  }
}
