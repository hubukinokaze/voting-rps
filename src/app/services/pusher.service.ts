import { Injectable } from '@angular/core';
import { Player }     from '../models/player';

declare const Pusher: any;

@Injectable({
  providedIn: 'root'
})
export class PusherService {
  private pusherKey: string = '94c056c5d4985cdffc49';

  constructor() {
  }

  getPusher(user: Player) {
    return new Pusher(this.pusherKey, {
      authEndpoint: '/pusher/auth',
      cluster     : 'us2',
      forceTLS    : true,
      auth        : {
        params: user
      }
    });
  }

  // helper function to get a query param
  getChannelId(name) {
    const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  // helper function to create a unique presence channel
  // name for each game
  getUniqueId() {
    return 'presence-' + Math.random().toString(36).substr(2, 8);
  }
}
