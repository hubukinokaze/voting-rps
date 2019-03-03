import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: any;
  private bgAudio: any;
  private isAudioOn: boolean;

  // audio src
  private bgAudioSrc: string;
  private startAudioSrc: string;
  private receiveMsgAudioSrc: string;
  private loseAudioSrc: string;
  private winAudioSrc: string;

  constructor() {
    this.setAudios();

    this.bgAudio.src = this.bgAudioSrc;
    this.bgAudio.load();
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0.3;
    this.bgAudio.play();

    if (localStorage.getItem('isSound') === 'false') {
      this.toggleIsAudioOn(false);
    }
  }

  public toggleIsAudioOn(isAudioOn: boolean): void {
    this.isAudioOn = isAudioOn;
    this.bgAudio.muted = !isAudioOn;
    if (!isAudioOn) {
      localStorage.setItem('isSound', 'false');
    } else {
      localStorage.clear();
    }
  }

  public getIsAudioOn(): boolean {
    return this.isAudioOn;
  }

  public startAudio(): void {
    this.audio.src = this.startAudioSrc;
    this.playAudio();
  }

  public receiveMsgAudio(): void {
    this.audio.src = this.receiveMsgAudioSrc;
    this.playAudio();
  }

  private playAudio(): void {
    if (this.isAudioOn) {
      this.audio.load();
      this.audio.volume = 0.1;
      this.audio.play();
    }
  }

  private setAudios() {
    this.bgAudio   = new Audio();
    this.audio     = new Audio();
    this.isAudioOn = true;

    this.bgAudioSrc         = './assets/audio/bg.wav';
    this.startAudioSrc      = './assets/audio/start.wav';
    this.receiveMsgAudioSrc = './assets/audio/receiveMsg.wav';
  }
}
