import { Component }                          from '@angular/core';
import { Player }                             from './models/player';
import { MatDialog, MatSnackBar }             from '@angular/material';
import { BoardService }                       from './services/board.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Game }                               from './models/game';
import { GameInfoComponent }                  from './modals/game-info/game-info.component';

declare const Pusher: any;

@Component({
  selector   : 'app-root',
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.scss']
})
export class AppComponent {
  pusherChannel: any;

  // Labels
  public titleLabel: string   = 'Voting RPS';
  public playLabel: string    = 'Play';
  public newGameLabel: string = 'New Game';
  public game: Game;
  public gameForm: FormGroup;
  public players: number      = 0;
  public id: any;
  public funny: any           = { data: 'funny' };

  constructor(private snackBar: MatSnackBar,
              private boardService: BoardService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog) {
    this.initPusher();
    // this.listenForChanges();
  }

  ngOnInit() {
    this.gameForm = this.formBuilder.group({
      rounds: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$'), Validators.max(10)]]
    });
  }

  // initialise Pusher and bind to presence channel
  private initPusher(): AppComponent {
    console.log('initializing pusher');
    // findOrCreate unique channel ID
    let id = this.getQueryParam('id');
    if (!id) {
      id              = this.getUniqueId();
      location.search = location.search ? '&id=' + id : 'id=' + id;
    }
    this.id = id;
    console.log('grabbed id: ', this.id);
    // init pusher
    const pusher = new Pusher('94c056c5d4985cdffc49', {
      authEndpoint: '/pusher/auth',
      cluster     : 'us2',
      forceTLS    : true
    });

    console.log('created pusher: ', pusher);

    // bind to relevant Pusher presence channel
    this.pusherChannel = pusher.subscribe(this.id);
    this.pusherChannel.bind('pusher:member_added', member => {
      console.log('add player: ', member);
      this.players++;
    });
    this.pusherChannel.bind('pusher:subscription_succeeded', members => {
      console.log('subscription_succeeded: ', members);
      this.listenForChanges();
      this.players = members.count;
      // this.setPlayer(this.players);
      console.log('connected');
    });
    this.pusherChannel.bind('pusher:member_removed', member => {
      console.log('remove player: ', member);
      this.players--;
    });

    return this;
  }

  // Listen for `client-fire` events.
  // Update the board object and other properties when
  // event triggered
  private listenForChanges(): AppComponent {
    console.log('listen for fire');
    this.pusherChannel.bind('client-fire', (obj) => {
      console.log('fire received');
      this.funny = obj;
      // this.canPlay                         = !this.canPlay;
      // this.boards[obj.boardId]             = obj.board;
      // this.boards[obj.player].player.score = obj.score;
    });
    return this;
  }

  // helper function to get a query param
  getQueryParam(name) {
    const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  // helper function to create a unique presence channel
  // name for each game
  getUniqueId() {
    return 'presence-channel';
    // return 'presence-' + Math.random().toString(36).substr(2, 8);
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

      console.log('trigger fire');
      this.pusherChannel.trigger('client-fire', {
        player : this.game.player1,
        score  : msg,
        boardId: this.id,
        board  : this.game,
        data   : 'hello'
      });
    }
  }

  public openHelpDialog(): void {
    const dialogRef = this.dialog.open(GameInfoComponent, {
      width: '250px',
      data : 234
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
