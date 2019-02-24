import { Component, ElementRef, ViewChild }   from '@angular/core';
import { Player }                             from './models/player';
import { MatDialog, MatSnackBar }             from '@angular/material';
import { BoardService }                       from './services/board.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Game }                               from './models/game';
import { GameInfoComponent }                  from './modals/game-info/game-info.component';
import { PusherService }                      from './services/pusher.service';
import { AudioService }                       from './services/audio.service';

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
  public chatForm: FormGroup;
  public player: number       = 0;
  public players: number      = 0;
  public channelId: string;
  public messages: Array<any> = [];
  public user: Player         = new Player();
  public randomUser: Player   = new Player();
  public isLoading: boolean;

  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  constructor(private snackBar: MatSnackBar,
              private boardService: BoardService,
              private pusherService: PusherService,
              public audioService: AudioService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.isLoading = true;
    this.initPusher();
    this.gameForm = this.formBuilder.group({
      rounds: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$'), Validators.max(10)]]
    });

    this.chatForm = this.formBuilder.group({
      chatMessage: ['', [Validators.required]]
    });

    // send message if connection failed
    this.checkConnection();
  }

  // initialise Pusher and bind to presence channel
  private initPusher(): AppComponent {

    // findOrCreate unique channel ID
    let channelId = this.pusherService.getChannelId('id');
    if (!channelId) {
      channelId       = this.pusherService.getUniqueId();
      location.search = location.search ? '&id=' + channelId : 'id=' + channelId;
    }
    this.channelId = channelId;

    // init pusher
    const pusher = this.pusherService.getPusher();

    // handle error
    pusher.connection.bind('error', (err) => {
      this.isLoading = false;
      const msg      = 'Could not connect. Check your wifi.';
      this.openSnackBar(msg);
    });

    // subscribe to channel
    this.pusherChannel = pusher.subscribe(this.channelId);

    // handle error
    this.pusherChannel.bind('pusher:connection_failed', err => {
      this.isLoading = false;
      const msg      = 'Could not connect. Check your wifi.';
      this.openSnackBar(msg);
    });

    // listen for new players
    this.pusherChannel.bind('pusher:member_added', member => {
      this.isLoading = true;
      console.log('new player arrived');

      this.pusherChannel.trigger('client-chat', {
        chat: this.messages
      });

      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });

      this.players++;

      // check if its the second player
      if (this.players === 2) {
        this.randomUser.id       = member.id;
        this.randomUser.playerId = this.player++;
        this.randomUser.username = `Player ${Math.floor(Math.random() * 11) + 21}`;
        this.player              = 0;
      }

      this.isLoading = false;
    });

    // listen for chat messages
    this.pusherChannel.bind('client-chat', data => {
      if (data.chat.length > 0 && this.messages.length !== data.chat.length) {
        this.isLoading = true;
        this.audioService.receiveMsgAudio();
        this.messages = data.chat;
        this.autoScroll();
        this.isLoading = false;
      }
    });

    // listen for successful connection to channel
    this.pusherChannel.bind('pusher:subscription_succeeded', members => {
      console.log('subscription_succeeded: ', members);

      this.listenForChanges();
      this.players = members.count;
      if (this.players && members.myID) {
        this.user.id       = members.myID;
        this.user.playerId = this.player++;
        this.user.username = `Player ${Math.floor(Math.random() * 11) + 11}`;
      }
      this.isLoading = false;
      // this.setPlayer(this.players);
    });

    // listen for players leaving
    this.pusherChannel.bind('pusher:member_removed', member => {
      if (this.game) {
        const x = this.game.players.filter((p: Player) => {
          return p.id === member.id;
        });

        if (x.length > 0) {
          this.game.isGameOver = true;
          const msg            = 'Enemy left. You win.';

          this.openSnackBar(msg);
        }
      }
      this.players--;
    });

    return this;
  }

  // Listen for `client-fire` events.
  // Update the board object and other properties when
  // event triggered
  private listenForChanges(): AppComponent {
    this.pusherChannel.bind('client-start-game', (data) => {
      if (!this.game) {
        this.isLoading  = true;
        this.game       = data.game;
        this.randomUser = this.getUserFromGame('randomUser')[0];

        if (!this.isValidPlayer()) {
          this.changeToSpectator();
        }
        this.isLoading = false;
      } else {
        this.game = data.game;
      }
    });

    this.pusherChannel.bind('client-fire', (data) => {
      if (this.game) {
        this.isLoading = true;
        this.game      = data.game;
        if (this.isValidPlayer()) {
          if (!this.game.players[this.player].isTurn) {
            const temp = this.boardService.submit(this.game);
            this.game = temp.game;
            this.openSnackBar(temp.msg);
          }
        } else if (!this.isValidPlayer()) {
          this.changeToSpectator();
        }
        this.isLoading = false;
      } else if (!this.game && data.game) {
        this.game = data.game;
        if (!this.isValidPlayer()) {
          this.changeToSpectator();
        }
      }
    });

    this.pusherChannel.bind('client-select-card', (data) => {
      if (this.game) {
        this.isLoading = true;
        this.boardService.selectCard(this.game.players[data.playerId], data.index);
        this.isLoading = false;
      }
    });
    return this;
  }

  public setRounds() {

    if (this.gameForm.valid && this.players > 1) {
      if (this.game) {
        if (this.isValidPlayer()) {
          this.audioService.startAudio();
          if (!this.game.isGameOver) {
            const user       = this.getUserFromGame('me')[0];
            const randomUser = this.getUserFromGame('randomUser')[0];

            this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value, user, randomUser);

            this.pusherChannel.trigger('client-start-game', {
              game: this.game
            });
          } else {
            this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value, this.user, this.randomUser);

            this.pusherChannel.trigger('client-start-game', {
              game: this.game
            });
          }
        } else if (!this.isValidPlayer()) {
          this.changeToSpectator();
        }
      } else {
        this.audioService.startAudio();
        this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value, this.user, this.randomUser);

        this.pusherChannel.trigger('client-start-game', {
          game: this.game
        });
      }
    } else if (this.gameForm.valid && this.players === 1) {
      const msg = 'Need 1 more player';
      this.openSnackBar(msg);
    } else if (!this.gameForm.valid) {
      const msg = 'Enter a valid number';
      this.openSnackBar(msg);
    }
  }

  public nextRound() {
    if (this.isValidPlayer()) {
      this.boardService.nextRound();
      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });
    } else if (!this.isValidPlayer()) {
      this.changeToSpectator();
    }
  }

  public selectCard(player: Player, index: number) {
    if (!this.game.isRoundOver) {
      if (this.isValidPlayer()) {
        this.boardService.selectCard(player, index);

        this.pusherChannel.trigger('client-select-card', {
          playerId: player.playerId,
          index   : index
        });
      } else if (!this.isValidPlayer()) {
        this.changeToSpectator();
      }

    }
  }

  public submit() {
    if (!this.game.isRoundOver) {
      this.game.players[this.player].isTurn = false;

      const msg = 'Locked in';

      this.openSnackBar(msg);

      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });

      if (!this.game.players[this.randomUser.playerId].isTurn) {
        const msg2 = this.boardService.submit(this.game);
        this.game  = msg2.game;
        this.openSnackBar(msg2.msg);
      }
    }
  }

  public openHelpDialog(): void {
    const dialogRef = this.dialog.open(GameInfoComponent, {
      width: '20em',
      data : this.user
    });

    dialogRef.afterClosed().subscribe(result => {
      this.user = result;
      if (this.game) {
        this.game.players.filter((p) => {
          if (p.id === this.user.id) {
            p.username = this.user.username;
          }
        });

        this.pusherChannel.trigger('client-fire', {
          game: this.game
        });
      }
    });
  }

  public sendChat() {
    if (this.chatForm.valid) {
      const id      = !!this.user.id ? this.user.id : 'Anon';
      const tempMsg = {
        userId : id,
        message: this.chatForm.controls['chatMessage'].value
      };
      this.messages.push(tempMsg);
      this.chatForm.controls['chatMessage'].reset();
      // this.chatForm.controls['chatMessage'].markAsPristine();
      // this.chatForm.controls['chatMessage'].markAsUntouched();
      // this.chatForm.controls['chatMessage'].clearValidators();
      // this.chatForm.reset();

      this.autoScroll();
      this.pusherChannel.trigger('client-chat', {
        chat: this.messages
      });

    }
  }

  public autoScroll() {
    setTimeout((f) => {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }, 100);
  }

  private openSnackBar(msg: string) {
    this.snackBar.open(msg, '', {
      duration: 2000,
    });
  }

  private isValidPlayer(): boolean {
    if (this.game && this.game.players.length === 2) {
      return this.getUserFromGame('me').length > 0;
    }
    return false;
  }

  private getUserFromGame(user: string): Array<Player> {
    if (user === 'me') {
      return this.game.players.filter((p) => {
        return p.id === this.user.id;
      });
    } else {
      return this.game.players.filter((p) => {
        return p.id !== this.user.id;
      });
    }
  }


  private changeToSpectator() {
    if (this.player < 2) {
      this.player = Math.floor(Math.random() * 1001) + 2;
    }

    const msg   = 'Spectating';
    this.openSnackBar(msg);
  }

  private checkConnection() {
    setTimeout((f) => {
      if (this.players === 0) {
        const msg = 'Connection failed. Make sure you have good connection.';
        this.openSnackBar(msg);
        this.isLoading = false;
      }
    }, 10000);
  }
}
