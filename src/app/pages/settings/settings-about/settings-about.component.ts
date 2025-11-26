import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonImg,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings-about',
  standalone: true,
  templateUrl: './settings-about.component.html',
  styleUrls: ['./settings-about.component.scss'],
  imports: [
    CommonModule,
    TranslocoPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
  ],
})
export class SettingsAboutComponent {
  /**
   * Team array used by the About / Settings -> About page.
   * Make sure the image files exist under src/assets/team/ with these file names,
   * or update the `photo` values to the correct paths.
   */
  team = [
    {
      name: 'D S Lavanya',
      role: 'Developer',
      photo: 'assets/team/lavanya.jpg',
    },
    {
      name: 'Deepak M',
      role: 'Developer',
      photo: 'assets/team/deepak.jpg',
    },
    {
      name: 'H S Varun',
      role: 'Developer',
      photo: 'assets/team/varun.jpg',
    },
    {
      name: 'Monalisa S',
      role: 'Developer',
      photo: 'assets/team/monalisa.jpg',
    },
  ];
}
