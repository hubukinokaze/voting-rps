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
  public players: number      = 0;
  public channelId: string;
  public messages: Array<any> = [];
  public user: Player         = new Player();

  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  constructor(private snackBar: MatSnackBar,
              private boardService: BoardService,
              private pusherService: PusherService,
              public audioService: AudioService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog) {
    this.initPusher();
  }

  ngOnInit() {
    this.gameForm = this.formBuilder.group({
      rounds: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$'), Validators.max(10)]]
    });

    this.chatForm = this.formBuilder.group({
      chatMessage: ['', [Validators.required]]
    });
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

    // subscribe to channel
    this.pusherChannel = pusher.subscribe(this.channelId);

    // listen for new players
    this.pusherChannel.bind('pusher:member_added', member => {
      this.pusherChannel.trigger('client-chat', {
        chat: this.messages
      });

      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });
      this.players++;
    });

    // listen for chat messages
    this.pusherChannel.bind('client-chat', data => {
      if (data.chat.length > 0 && this.messages.length !== data.chat.length) {
        this.audioService.receiveMsgAudio();
        this.messages = data.chat;
        this.autoScroll();
      }
    });

    // listen for successful connection to channel
    this.pusherChannel.bind('pusher:subscription_succeeded', members => {
      console.log('subscription_succeeded: ', members);

      this.listenForChanges();
      this.players = members.count;
      if (this.players && members.myID) {
        this.user.id = members.myID;
      }
      // this.setPlayer(this.players);
    });

    // listen for players leaving
    this.pusherChannel.bind('pusher:member_removed', member => {
      this.players--;
    });

    return this;
  }

  // Listen for `client-fire` events.
  // Update the board object and other properties when
  // event triggered
  private listenForChanges(): AppComponent {
    this.pusherChannel.bind('client-fire', (data) => {
      this.game = data.game;
    });
    return this;
  }

  public setRounds() {
    if (this.gameForm.valid) {
      this.audioService.startAudio();
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

      this.pusherChannel.trigger('client-fire', {
        game: this.game
      });
    }
  }

  public openHelpDialog(): void {
    const dialogRef = this.dialog.open(GameInfoComponent, {
      width: '20em',
      data : 100
    });

    dialogRef.afterClosed().subscribe(result => {
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
}
