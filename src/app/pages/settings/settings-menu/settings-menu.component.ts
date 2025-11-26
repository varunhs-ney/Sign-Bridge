import {Component} from '@angular/core';
import {SettingsAboutComponent} from '../settings-about/settings-about.component';
import {SettingsFeedbackComponent} from '../settings-feedback/settings-feedback.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNavLink,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {airplane, chatbubbles, informationCircle, mic, personCircle, volumeMedium} from 'ionicons/icons';

interface Page {
  path: string;
  icon: string;
  component: any;
}

interface PagesGroup {
  name: string;
  pages: Page[];
}

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.scss'],
  imports: [
    TranslocoDirective,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonLabel,
    IonNavLink,
    IonItem,
    IonIcon,
  ],
})
export class SettingsMenuComponent {
  groups: PagesGroup[] = [
    {
      name: 'support',
      pages: [
        {path: 'feedback', icon: 'chatbubbles', component: SettingsFeedbackComponent},
        {path: 'about', icon: 'information-circle', component: SettingsAboutComponent},
      ],
    },

    

    
  ]

  constructor() {
    addIcons({chatbubbles, informationCircle, mic, volumeMedium, airplane, personCircle});
  }
}
