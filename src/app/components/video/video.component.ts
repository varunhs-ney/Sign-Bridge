import { AfterViewInit, Component, ElementRef, HostBinding, inject, Input, viewChild, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngxs/store';
import { combineLatest, firstValueFrom } from 'rxjs';
import { VideoSettings, VideoStateModel } from '../../core/modules/ngxs/store/video/video.state';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BaseComponent } from '../base/base.component';
import { wait } from '../../core/helpers/wait/wait';
import { LoadPoseEstimationModel, PoseVideoFrame } from '../../modules/pose/pose.actions';
import { PoseStateModel } from '../../modules/pose/pose.state';
import { PoseService } from '../../modules/pose/pose.service';
import { SignWritingStateModel } from '../../modules/sign-writing/sign-writing.state';
import { SettingsStateModel } from '../../modules/settings/settings.state';
import { SignWritingService } from '../../modules/sign-writing/sign-writing.service';
import { IonIcon } from '@ionic/angular/standalone';
import { VideoControlsComponent } from './video-controls/video-controls.component';
import { addIcons } from 'ionicons';
import { playCircleOutline } from 'ionicons/icons';
import { AsyncPipe } from '@angular/common';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AnimationModule } from '../animation/animation.module';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  imports: [AnimationModule, IonIcon, AsyncPipe, TranslocoPipe, TranslocoDirective],
})
export class VideoComponent extends BaseComponent implements AfterViewInit {
  private store = inject(Store);

  settingsState$ = this.store.select<SettingsStateModel>(state => state.settings);
  animatePose$ = this.store.select<boolean>(state => state.settings.animatePose);

  videoState$ = this.store.select<VideoStateModel>(state => state.video);
  poseState$ = this.store.select<PoseStateModel>(state => state.pose);
  signWritingState$ = this.store.select<SignWritingStateModel>(state => state.signWriting);
  signingProbability$ = this.store.select<number>(state => state.detector.signingProbability);

  private poseService = inject(PoseService);
  private signWritingService = inject(SignWritingService);
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  readonly statsEl = viewChild<ElementRef>('stats');
  appRootEl!: HTMLElement;

  @HostBinding('class') aspectRatio = 'aspect-16-9';

  @Input() displayFps = true;
  @Input() displayControls = true;

  canvasCtx!: CanvasRenderingContext2D;

  videoEnded = false;

  // stats instances will be created only in the browser
  fpsStats!: any;
  signingStats!: any;

  constructor() {
    super();

    // Don't access document or run icons registration on server
    if (isPlatformBrowser(this.platformId)) {
      // find app root in browser only
      this.appRootEl = document.querySelector('ion-app') ?? document.body;

      // Register icons only in browser
      addIcons({ playCircleOutline });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    // All DOM & browser APIs must run only in the browser
    if (!isPlatformBrowser(this.platformId)) {
      // Still dispatch model load so SSR doesn't hang if needed
      this.preloadPoseEstimationModel();
      return;
    }

    const videoEl = this.videoEl();
    this.setCamera();
    await this.setStats(); // ensure stats lib loads in browser before using
    this.trackPose();

    this.canvasCtx = this.canvasEl().nativeElement.getContext('2d') as CanvasRenderingContext2D;
    this.preloadSignWritingFont();
    this.drawChanges();

    this.preloadPoseEstimationModel();
    videoEl.nativeElement.addEventListener('loadeddata', this.appLoop.bind(this));
    videoEl.nativeElement.addEventListener('ended', () => (this.videoEnded = true));

    // Observe size changes in browser only
    const resizeObserver = new ResizeObserver(this.scaleCanvas.bind(this));
    resizeObserver.observe(this.elementRef.nativeElement);
    resizeObserver.observe(this.appRootEl); // Catch changes when canvas becomes bigger than screen
  }

  async appLoop(): Promise<void> {
    const video = this.videoEl().nativeElement;
    const poseAction = new PoseVideoFrame(video);

    let lastTime: number | null = null;
    while (true) {
      if (video.readyState === 0) {
        // if video is no longer available
        break;
      }

      // Make sure the frame changed
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;

        // Get pose estimation
        await firstValueFrom(this.store.dispatch(poseAction));
      }

      // TODO await videoframe if supported

      await wait(0);
    }
  }

  setCamera(): void {
    const video = this.videoEl().nativeElement;
    video.muted = true;
    video.addEventListener('loadedmetadata', () => video.play());

    this.videoState$
      .pipe(
        tap(({ camera, src }) => {
          this.videoEnded = false;
          // Either video feed or camera
          video.src = src || '';
          // srcObject is a browser API — safe because this is only used in browser lifecycle
          // (ngAfterViewInit is guarded to run only in browser)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          video.srcObject = camera;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    this.videoState$
      .pipe(
        map(state => state.videoSettings),
        filter(Boolean),
        tap(({ width, height }) => {
          const canvasEl = this.canvasEl();
          canvasEl.nativeElement.width = width;
          canvasEl.nativeElement.height = height;

          // It is required to wait for next frame, as grid element might still be resizing
          requestAnimationFrame(this.scaleCanvas.bind(this));
        }),
        tap((settings: VideoSettings) => (this.aspectRatio = 'aspect-' + settings.aspectRatio)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  scaleCanvas(): void {
    requestAnimationFrame(() => {
      // Zoom canvas to 100% width
      const bbox = this.elementRef.nativeElement.getBoundingClientRect();
      const documentBbox = this.appRootEl.getBoundingClientRect();

      const width = Math.min(bbox.width, documentBbox.width);
      const canvasEl = this.canvasEl().nativeElement;
      const scale = width / canvasEl.width;
      canvasEl.style.transform = `scale(-${scale}, ${scale}) translateX(-100%)`;

      // Set parent element height
      this.elementRef.nativeElement.style.height = canvasEl.height * scale + 'px';
      // Set canvas parent element width
      if (canvasEl.parentElement) {
        canvasEl.parentElement.style.width = width + 'px';
      }
    });
  }

  trackPose(): void {
    this.poseState$
      .pipe(
        map(state => state.pose),
        filter(Boolean),
        tap(() => {
          // fpsStats is created in setStats (browser only)
          try {
            this.fpsStats.end(); // End previous frame time
            this.fpsStats.begin(); // Start new frame time
          } catch (e) {
            // safe fallback if stats not available
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  preloadSignWritingFont(): void {
    // canvasCtx is set in ngAfterViewInit (browser only)
    try {
      this.canvasCtx.font = '100px SuttonSignWritingOneD';
      this.canvasCtx.fillText('Preload SignWriting', 0, 0);
    } catch (e) {
      // ignore in SSR or if canvas not ready
    }
  }

  preloadPoseEstimationModel(): void {
    this.store.dispatch(LoadPoseEstimationModel);
  }

  drawChanges(): void {
    const ctx = this.canvasCtx;
    const canvas = ctx.canvas;
    combineLatest([this.poseState$, this.signWritingState$, this.settingsState$])
      .pipe(
        distinctUntilChanged((x, y) => x[1].timestamp === y[1].timestamp),
        tap(([poseState, signWritingState, settingsState]) => {
          if (poseState.pose) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw video or white background
            if (settingsState.drawVideo) {
              ctx.drawImage(poseState.pose.image, 0, 0, canvas.width, canvas.height);
            } else {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw pose (skeleton) — attempt to disable face/avatar
            if (settingsState.drawPose) {
              try {
                // Try to call poseService.draw with an option to suppress face drawing.
                // If PoseService.draw accepts options like { drawFace: false } this will remove avatar/face.
                // If it does NOT support options, the call may throw — we catch and fallback.
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.poseService.draw(poseState.pose, ctx, { drawFace: false });
              } catch (e) {
                console.warn(
                  'poseService.draw(options) not supported — falling back. To remove face/avatar drawing, update PoseService.draw to accept {drawFace: false}.',
                  e
                );
                this.poseService.draw(poseState.pose, ctx);
              }
            }

            // Draw Sign Writing
            if (settingsState.drawSignWriting) {
              this.signWritingService.draw(signWritingState, ctx);
            }
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  // create stats only in browser
  async setStats(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    // dynamically import stats.js so SSR won't load it
    const StatsModule = await import('stats.js');
    const Stats = (StatsModule && (StatsModule as any).default) || (StatsModule as any);

    this.fpsStats = new Stats();
    this.fpsStats.showPanel(0);
    this.fpsStats.dom.style.position = 'absolute';
    try {
      this.statsEl().nativeElement.appendChild(this.fpsStats.dom);
    } catch (e) {
      // ignore if element not available yet
    }

    // TODO this on change of input property
    if (!this.displayFps) {
      this.fpsStats.dom.style.display = 'none';
    }

    // Sign detection panel
    const signingPanel = new (Stats as any).Panel('Signing', '#ff8', '#221');
    this.signingStats = new Stats();
    this.signingStats.dom.innerHTML = '';
    this.signingStats.addPanel(signingPanel);
    this.signingStats.showPanel(0);
    this.signingStats.dom.style.position = 'absolute';
    this.signingStats.dom.style.left = '80px';
    try {
      this.statsEl().nativeElement.appendChild(this.signingStats.dom);
    } catch (e) {
      // ignore if element not available yet
    }

    this.setDetectorListener(signingPanel);
  }

  setDetectorListener(panel: any): void {
    // Update panel value
    this.signingProbability$
      .pipe(
        tap(v => {
          try {
            panel.update(v * 100, 100);
          } catch (e) {
            // ignore if panel not ready
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Show hide panel
    this.settingsState$
      .pipe(
        map(settings => settings.detectSign),
        distinctUntilChanged(),
        tap(detectSign => {
          try {
            this.signingStats.dom.style.display = detectSign ? 'block' : 'none';
          } catch (e) {
            // ignore if signingStats not ready
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  replayVideo() {
    this.videoEnded = false;
    const videoEl = this.videoEl().nativeElement;
    videoEl.currentTime = 0;
    return videoEl.play();
  }
}
