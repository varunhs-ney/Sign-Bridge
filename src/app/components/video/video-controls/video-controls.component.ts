import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-controls',
  standalone: true,
  templateUrl: './video-controls.component.html',
  styleUrls: ['./video-controls.component.scss'],
  imports: [CommonModule],
})
export class VideoControlsComponent {
  // Intentionally empty — controls removed.
}
