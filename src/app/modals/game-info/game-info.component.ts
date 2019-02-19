import { Component, Inject, OnInit }     from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector   : 'app-game-info',
  templateUrl: './game-info.component.html',
  styleUrls  : ['./game-info.component.css']
})
export class GameInfoComponent implements OnInit {


  constructor(
    public dialogRef: MatDialogRef<GameInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: 'stuff') {
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
