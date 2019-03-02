import { Component, ElementRef, ViewChild }                                      from '@angular/core';
import { Player }                                                                from './models/player';
import { MatDialog, MatSnackBar }                                                from '@angular/material';
import { BoardService }                                                          from './services/board.service';
import { FormBuilder, FormGroup, Validators }                                    from '@angular/forms';
import { Game }                                                                  from './models/game';
import { GameInfoComponent }                                                     from './modals/game-info/game-info.component';
import { PusherService }                                                         from './services/pusher.service';
import { AudioService }                                                          from './services/audio.service';
import { animate, keyframes, query, stagger, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector   : 'app-root',
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.scss'],
  animations : [
    trigger('listAnimation', [
      state('out', style({ opacity: 1 })),

      transition('in => out', [

        query('.card-item', style({ opacity: 0 }), { optional: true }),

        query('.card-item', stagger('300ms', [
          animate('1s ease-in', keyframes([
            style({ opacity: 0, transform: 'translateX(-100%)', offset: 0 }),
            style({ opacity: .5, transform: 'translateX(35px)', offset: 0.3 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 }),
          ]))]), { optional: true })
      ])
    ]),
    trigger('itemAnimation', [
      state('in', style({ opacity: 0 }))
    ]),
  ]
})
export class AppComponent {
  pusherChannel: any;

  // Labels
  public titleLabel: string     = 'Voting RPS';
  public playLabel: string      = 'Play';
  public newGameLabel: string   = 'New Game';
  public nextRoundLabel: string = 'Next Round';
  public submitLabel: string    = 'Lock In';
  public noCardsLabel: string    = 'No Cards';

  public game: Game;
  public gameForm: FormGroup;
  public chatForm: FormGroup;
  public player: number       = 0;
  public players: number      = 0;
  public members: Array<any>  = [];
  public membersInfo: any;
  public channelId: string;
  public messages: Array<any> = [];
  public user: Player         = new Player();
  public randomUser: Player   = new Player();
  public isLoading: boolean;
  public deckImg: string;
  public cardState            = 'in';

  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  constructor(private snackBar: MatSnackBar,
              private boardService: BoardService,
              private pusherService: PusherService,
              public audioService: AudioService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog) {
  }

  toggle() {
    this.cardState = 'out';
  }

  ngOnInit() {
    this.isLoading = true;
    this.deckImg   = './assets/card-img-001.png';
    this.initPusher();
    this.gameForm = this.formBuilder.group({
      enemyId: ['', [Validators.required]],
      rounds : ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$'), Validators.max(10)]]
    });

    this.chatForm = this.formBuilder.group({
      chatMessage: ['', [Validators.required]]
    });

    // send message if connection failed
    this.checkConnection();
  }

  ngOnDestroy() {
    this.pusherChannel.unbind();
  }

  /**
   * Initialize
   *
   * Initialize Pusher and bind to presence channel
   */
  private initPusher(): void {

    // findOrCreate unique channel ID
    let channelId = this.pusherService.getChannelId('id');
    if (!channelId) {
      channelId       = this.pusherService.getUniqueId();
      location.search = location.search ? '&id=' + channelId : 'id=' + channelId;
    }
    this.channelId = channelId;

    // init pusher
    this.user.username = `Player ${Math.floor(Math.random() * 11) + 11}`;
    this.user.channel  = this.channelId;
    const pusher       = this.pusherService.getPusher(this.user);

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
      this.openSnackBar('Could not connect. Check your wifi.');
    });

    // listen for successful connection to channel
    this.pusherChannel.bind('pusher:subscription_succeeded', members => {
      this.membersInfo = members;
      this.members     = Object.keys(this.membersInfo.members);
      this.members     = this.members.filter((p) => {
        return p !== this.membersInfo.myID;
      });

      console.log('subscription_succeeded: ', members);

      this.listenForChanges();
      this.players = this.membersInfo.count;
      if (this.players && this.membersInfo.myID) {
        this.user.id       = this.membersInfo.myID;
        this.user.playerId = this.player++;
        // this.user.username = `Player ${Math.floor(Math.random() * 11) + 11}`;
      }

      this.isLoading = false;
    });
  }

  /**
   * Listen for changes
   *
   * Update the board object and other properties when event triggered
   */
  private listenForChanges(): void {
    // listen for new players
    this.pusherChannel.bind('pusher:member_added', member => {
      this.isLoading = true;
      this.members.push(member.id);
      console.log('new player arrived', member);


      this.pusherChannel.trigger('client-chat', {
        chat: this.messages
      });

      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });

      this.players++;

      // check if its the second player
      if (this.players === 2) {
        // this.randomUser.playerId = this.player++;
        this.player = 0;
      }

      this.isLoading = false;
    });

    this.pusherChannel.bind('client-start-game', (data) => {
      if (!this.game) {
        this.isLoading = true;
        this.game      = data.game;

        if (!this.isValidPlayer()) {
          this.changeToSpectator();
        } else {
          this.randomUser = this.getUserFromGame('randomUser')[0];
          this.player     = this.getUserFromGame('me')[0].playerId;
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
            this.game  = temp.game;
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

    this.pusherChannel.bind('client-pass-cards', (data) => {
      if (data.isPass) {
        this.cardState = 'in';
      }
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

    // listen for players leaving
    this.pusherChannel.bind('pusher:member_removed', member => {
      if (this.game) {
        const x = this.game.players.filter((p: Player) => {
          return p.id === member.id;
        });

        if (x.length > 0) {
          this.game.isGameOver = true;
          this.openSnackBar('Enemy left. You win.');
        }
      }
      this.members = this.members.filter((p) => {
        return p !== member.id;
      });
      this.players--;
    });
  }

  /**
   * Set Rounds
   *
   * Start the game with the selected user
   * Display spectator mode for others
   */
  public setRounds(): void {
    if (this.gameForm.valid && this.players > 1) {
      if (this.game) {
        if (this.isValidPlayer()) {
          this.audioService.startAudio();
          if (!this.game.isGameOver) {
            const user       = this.getUserFromGame('me')[0];
            const randomUser = this.getUserFromGame('randomUser')[0];

            this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value, user, randomUser);

            this.game.players[this.player].hand.filter((c) => {
              c.isFaceUp = true;
            });

            this.pusherChannel.trigger('client-start-game', {
              game: this.game
            });
          } else {
            this.game = this.boardService.startGame(this.gameForm.controls['rounds'].value, this.user, this.randomUser);

            this.game.players[this.player].hand.filter((c) => {
              c.isFaceUp = true;
            });

            this.pusherChannel.trigger('client-start-game', {
              game: this.game
            });
          }
        } else if (!this.isValidPlayer()) {
          this.changeToSpectator();
        }
      } else {
        this.audioService.startAudio();
        this.user.id       = this.membersInfo.myID;
        this.user.username = this.membersInfo.members[this.user.id].username;
        this.user.playerId = 0;
        this.player        = 0;

        this.randomUser.id       = this.gameForm.controls['enemyId'].value;
        this.randomUser.username = this.membersInfo.members[this.randomUser.id].username;
        this.randomUser.playerId = 1;
        this.game                = this.boardService.startGame(this.gameForm.controls['rounds'].value, this.user, this.randomUser);

        this.pusherChannel.trigger('client-start-game', {
          game: this.game
        });
      }
    } else if (this.gameForm.valid && this.players === 1) {
      this.openSnackBar('Need 1 more player');
    } else if (!this.gameForm.valid) {
      this.openSnackBar('Enter a valid number');
    }
  }

  /**
   * Next Round
   *
   * Go to next round of the game
   * Reset cardState
   */
  public nextRound(): void {
    if (this.isValidPlayer()) {
      this.cardState = 'in';
      this.pusherChannel.trigger('client-pass-cards', { isPass: true });
      this.boardService.nextRound();
      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });
    } else if (!this.isValidPlayer()) {
      this.changeToSpectator();
    }
  }

  /**
   * Select Card
   *
   * Send temporary selected card to other player
   *
   * @param player
   * @param index
   */
  public selectCard(player: Player, index: number): void {
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

  /**
   * Submit Selected Card
   *
   * Set the user's turn to false and send confirmed card data to other player
   */
  public submit(): void {
    if (!this.game.isRoundOver) {
      this.game.players[this.player].isTurn = false;
      this.game.players[this.player].hand.forEach((c) => {
        if (c.isSelected) {
          c.isFaceUp = true;
        }
      });

      this.openSnackBar('Locked in');

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

  /**
   * Open Help/Settings
   *
   * Display popup for play instructions and settings
   */
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

  /**
   * Send Chat
   *
   * Send the message to everyone
   */
  public sendChat(): void {
    if (this.chatForm.valid) {
      const id      = !!this.user.id ? this.user.id : 'Anon';
      const tempMsg = {
        userId  : id,
        username: this.user.username,
        message : this.chatForm.controls['chatMessage'].value
      };
      this.messages.push(tempMsg);

      // start removing first message if message list reaches 200
      if (this.messages.length > 200) {
        this.messages.shift();
      }

      this.chatForm.controls['chatMessage'].reset();

      this.autoScroll();
      this.pusherChannel.trigger('client-chat', {
        chat: this.messages
      });
    }
  }

  /**
   * Auto Scroll
   *
   * Scroll to the bottom of the comment box
   */
  public autoScroll(): void {
    setTimeout((f) => {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }, 100);
  }

  /**
   * Snack Bar
   *
   * Displays a popup message for 2 seconds
   *
   * @param msg
   */
  private openSnackBar(msg: string): void {
    this.snackBar.open(msg, '', {
      duration: 2000,
    });
  }

  /**
   * Valid Player
   *
   * Check if user is a player
   *
   * @returns boolean
   */
  private isValidPlayer(): boolean {
    if (this.game && this.game.players.length === 2) {
      return this.getUserFromGame('me').length > 0;
    }
    return false;
  }

  /**
   * Get User from Game
   *
   * Grab the correct user in the game
   *
   * @param user
   *
   * @returns Array<Player>
   */
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

  /**
   * Change to Spectator
   *
   * Change the user into a spectator
   */
  private changeToSpectator(): void {
    if (this.player < 2) {
      this.player = Math.floor(Math.random() * 1001) + 2;
    }

    this.openSnackBar('Spectating');
  }

  /**
   * Check Connection
   *
   * Abort if user doesnt connect to channel in 10 seconds
   */
  private checkConnection(): void {
    setTimeout((f) => {
      if (this.players === 0) {
        this.openSnackBar('Connection failed. Make sure you have good connection.');
        this.isLoading = false;
      }
    }, 10000);
  }

  public calcDeckSize(): number {
    let size = (this.game.deck.length / 2) + 3;
    if (this.cardState === 'in') {
      return size;
    } else {
      size -= 3;
      return (size < 0) ? 0 : size;
    }

  }
}
