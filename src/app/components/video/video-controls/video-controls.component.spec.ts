import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoControlsComponent } from './video-controls.component';
import { AppTranslocoTestingModule } from '../../../core/modules/transloco/transloco-testing.module';

describe('VideoControlsComponent', () => {
  let component: VideoControlsComponent;
  let fixture: ComponentFixture<VideoControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTranslocoTestingModule, VideoControlsComponent],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
