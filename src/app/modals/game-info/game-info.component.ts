import { Component, Inject, OnInit }          from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef }      from '@angular/material';
import { AudioService }                       from '../../services/audio.service';
import { Player }                             from '../../models/player';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector   : 'app-game-info',
  templateUrl: './game-info.component.html',
  styleUrls  : ['./game-info.component.css']
})
export class GameInfoComponent implements OnInit {

  // labels
  public audioOnLabel: string;
  public audioOffLabel: string;

  // icons
  public audioOnIcon: string;
  public audioOffIcon: string;

  public player: Player = new Player();

  public settingsForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public audioService: AudioService,
    public dialogRef: MatDialogRef<GameInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Player) {
    dialogRef.disableClose = true;
    dialogRef.backdropClick().subscribe(result => {
      if (this.settingsForm.valid) {
        this.player.username = this.settingsForm.controls['username'].value;
      } else {
        console.log('Failed to save');
      }

      dialogRef.close(this.player);
    });

    this.player = this.data;

    this.settingsForm = this.formBuilder.group({
      username: [this.player.username, Validators.required]
    });
  }

  ngOnInit() {
    this.audioOnLabel  = 'Audio On';
    this.audioOffLabel = 'Audio Off';
    this.audioOnIcon   = 'volume_off';
    this.audioOffIcon  = 'volume_up';
  }
}
