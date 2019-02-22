import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: any;
  private isAudioOn: boolean;

  // audio src
  private startAudioSrc: string;
  private receiveMsgAudioSrc: string;
  private loseAudioSrc: string;
  private winAudioSrc: string;

  constructor() {
    this.setAudios();
  }

  public toggleIsAudioOn(isAudioOn: boolean) {
    this.isAudioOn = isAudioOn;
  }

  public getIsAudioOn(): boolean {
    return this.isAudioOn;
  }

  public startAudio() {
    this.audio.src = this.startAudioSrc;
    this.playAudio();
  }

  public receiveMsgAudio() {
    this.audio.src = this.receiveMsgAudioSrc;
    this.playAudio();
  }

  private playAudio() {
    if (this.isAudioOn) {
      this.audio.load();
      this.audio.volume = 0.1;
      this.audio.play();
    }
  }

  private setAudios() {
    this.audio     = new Audio();
    this.isAudioOn = true;

    this.startAudioSrc      = './assets/audio/start.wav';
    this.receiveMsgAudioSrc = './assets/audio/receiveMsg.wav';
  }
}
