import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-about',
  standalone: true,
  templateUrl: './settings-about.component.html',
  styleUrls: ['./settings-about.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class SettingsAboutComponent {}
