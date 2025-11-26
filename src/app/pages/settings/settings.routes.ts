import {Routes} from '@angular/router';
import {SettingsPageComponent} from './settings.component';
import {SettingsAboutComponent} from './settings-about/settings-about.component';
import {SettingsFeedbackComponent} from './settings-feedback/settings-feedback.component';

export const routes: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    children: [
      {path: 'feedback', component: SettingsFeedbackComponent},
      {path: 'about', component: SettingsAboutComponent},
      {path: '', redirectTo: 'feedback', pathMatch: 'full'},
    ],
  },
];
