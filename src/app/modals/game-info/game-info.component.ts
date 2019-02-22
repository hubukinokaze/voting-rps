import { Component, Inject, OnInit }     from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AudioService }                  from '../../services/audio.service';

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

  constructor(
    public audioService: AudioService,
    public dialogRef: MatDialogRef<GameInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: 'stuff') {
  }

  ngOnInit() {
    this.audioOnLabel  = 'Audio On';
    this.audioOffLabel = 'Audio Off';
    this.audioOnIcon   = 'volume_off';
    this.audioOffIcon  = 'volume_up';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
