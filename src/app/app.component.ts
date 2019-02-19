import { Component }                          from '@angular/core';
import { Player }                             from './models/player';
import { MatSnackBar }                        from '@angular/material';
import { BoardService }                       from './services/board.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Game }                               from './models/game';

@Component({
  selector   : 'app-root',
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.scss']
})
export class AppComponent {

  // Labels
  titleLabel: string   = 'Voting RPS';
  playLabel: string    = 'Play';
  newGameLabel: string = 'New Game';
  game: Game;
  gameForm: FormGroup;

  constructor(private snackBar: MatSnackBar,
              private boardService: BoardService,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.gameForm = this.formBuilder.group({
      rounds: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$'), Validators.max(10)]]
    });
  }

  public setRounds() {
    if (this.gameForm.valid) {
      this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value);
    }
  }

  public nextRound() {
    if (this.game.isRoundOver) {
      this.boardService.nextRound();
    }
  }

  public selectCard(player: Player, index: number) {
    if (!this.game.isRoundOver) {
      this.boardService.selectCard(player, index);
    }
  }

  public submit() {
    if (!this.game.isRoundOver) {
      const msg = this.boardService.submit();

      this.snackBar.open(msg, '', {
        duration: 2000,
      });
    }
  }
}
