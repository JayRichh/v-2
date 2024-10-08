<template>
  <ion-content class="ion-padding" style="overflow: hidden; background-color: dimgrey;">
    <!-- Hidden file input for uploading audio files -->
    <input
      type="file"
      ref="fileInputRef"
      style="display: none;"
      @change="handleFileUpload"
      accept="audio/*"
      multiple
    />
    <visualizer-canvas
      ref="visualizerCanvas"
      :effect-type="effectType"
      :detail-level="detailLevel"
      :movement-speed="movementSpeed"
      :color-intensity="colorIntensity"
      :bpm="bpm"
      :audio-data="dataArray"
      :is-animating="isAnimating"
    />

    <!-- Welcome message for new users -->
    <welcome-message v-if="!currentTrack" @open-file-upload="openFileUpload" />

    <!-- Playlist Manager -->
    <playlist-manager
      v-if="currentTrack"
      :current-track="currentTrack"
      :current-track-index="currentTrackIndex"
      :playlist="playlist"
      :current-time="currentTime"
      :duration="duration"
      @seek="handleSeek"
      @load-track="loadTrack"
      @remove-track="removeTrack"
      @open-file-upload="openFileUpload"
    />

    <!-- Floating action button to open controls -->
    <ion-fab vertical="top" horizontal="end" slot="fixed" style="padding: 0.5rem; z-index: 9000">
      <ion-fab-button @click="toggleControls">
        <ion-icon :icon="controlsOpen ? closeOutline : optionsOutline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Controls modal -->
    <controls-modal
      :is-open="controlsOpen"
      :effect-type="effectType"
      :detail-level="detailLevel"
      :movement-speed="movementSpeed"
      :color-intensity="colorIntensity"
      :bpm="bpm"
      :auto-bpm="autoBpm"
      :effects="effects"
      :playlist="playlist"
      :current-track-index="currentTrackIndex"
      :is-playing="isPlaying"
      :is-animating="isAnimating"
      :is-previewing="isPreviewing"
      @close="toggleControls"
      @effect-change="handleEffectTypeChange"
      @detail-change="handleDetailChange"
      @speed-change="handleSpeedChange"
      @intensity-change="handleIntensityChange"
      @bpm-change="handleBPMChange"
      @auto-bpm-change="handleAutoBPMChange"
      @randomize="randomizeSettings"
      @reset="resetSettings"
      @toggle-visualization="toggleVisualization"
      @preview-visualization="previewVisualization"
      @load-and-toggle-track="loadAndToggleTrack"
      @remove-track="removeTrack"
      @open-file-upload="openFileUpload"
    />

    <!-- Audio Controls -->
    <ion-footer>
      <audio-controls
        :is-playing="isPlaying"
        :volume="volume"
        :current-time="currentTime"
        :duration="duration"
        @previous="playPreviousTrack"
        @toggle-play="togglePlay"
        @stop="stopAudio"
        @next="playNextTrack"
        @volume-change="handleVolumeChange"
        @seek="handleSeek"
        @open-file-upload="openFileUpload"
      />
    </ion-footer>

    <!-- Toast for notifications -->
    <ion-toast
      :is-open="toastIsOpen"
      :message="toastMessage"
      :duration="3000"
      :position="'bottom'"
      :color="'dark'"
      @didDismiss="toastIsOpen = false"
    >
      <ion-button slot="end" @click="toastIsOpen = false">OK</ion-button>
    </ion-toast>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonFooter,
  IonToast,
  IonButton,
} from '@ionic/vue';
import { closeOutline, optionsOutline } from 'ionicons/icons';
import { AudioTrack, EffectType } from '@/types';
import AudioControls from './AudioControls.vue';
import PlaylistManager from './PlaylistManager.vue';
import WelcomeMessage from './WelcomeMessage.vue';
import VisualizerCanvas from './VisualizerCanvas.vue';
import ControlsModal from './ControlsModal.vue';

export default defineComponent({
  name: 'AudioVisualizer',
  components: {
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonFooter,
    IonToast,
    IonButton,
    AudioControls,
    PlaylistManager,
    WelcomeMessage,
    VisualizerCanvas,
    ControlsModal,
  },
  setup() {
    const fileInputRef = ref<HTMLInputElement | null>(null);
    const visualizerCanvas = ref<InstanceType<typeof VisualizerCanvas> | null>(null);
    const effectType = ref<EffectType>('Waveform');
    const detailLevel = ref<number>(5);
    const movementSpeed = ref<number>(1.0);
    const colorIntensity = ref<number>(0.7);
    const volume = ref<number>(0.5);
    const isPlaying = ref<boolean>(false);
    const isAnimating = ref<boolean>(false);
    const isPreviewing = ref<boolean>(false);
    const bpm = ref<number>(120);
    const autoBpm = ref<boolean>(false);
    const currentTrack = ref<AudioTrack | null>(null);
    const currentTrackIndex = ref<number>(0);
    const playlist = ref<AudioTrack[]>([]);
    const controlsOpen = ref<boolean>(false);
    const currentTime = ref<number>(0);
    const duration = ref<number>(0);
    const dataArray = ref<Uint8Array>(new Uint8Array());
    const toastIsOpen = ref<boolean>(false);
    const toastMessage = ref<string>('');

    const effects: EffectType[] = [
      'Waveform',
      'Bars',
      'Circle',
      'Particles',
      'Spectrum',
      'Terrain',
      'Grid',
      'Flow',
      'Ripple',
      'Fractal',
    ];

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let gainNode: GainNode | null = null;
    let source: AudioBufferSourceNode | null = null;

    let playbackStartTime: number = 0;
    let pauseTime: number = 0;

    let animationId: number | null = null;
    let lastTime: number = 0;

    let oscillator: OscillatorNode | null = null;

    // BPM detection variables
    let lastBeatTime = 0;
    const beatThreshold = 0.15;
    const beatHistory: number[] = [];
    const beatHistoryMax = 10;

    const hasTrack = computed(() => currentTrack.value !== null);

    onMounted(() => {
      initAudio();
    });

    onUnmounted(() => {
      cleanupResources();
    });

    watch(effectType, handleEffectTypeChange);
    watch([detailLevel, movementSpeed, colorIntensity], updateVisualizerSettings);

    const toggleControls = (): void => {
      controlsOpen.value = !controlsOpen.value;
    };

    function initAudio(): void {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = volume.value;
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray.value = new Uint8Array(analyser.frequencyBinCount);
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (error) {
        console.error('Error initializing audio context:', error);
        showToast('Error initializing audio context.');
      }
    }

    function handleEffectTypeChange(newEffectType: EffectType): void {
      effectType.value = newEffectType;
    }

    function handleDetailChange(newDetailLevel: number): void {
      detailLevel.value = newDetailLevel;
    }

    function handleSpeedChange(newSpeed: number): void {
      movementSpeed.value = newSpeed;
    }

    function handleIntensityChange(newIntensity: number): void {
      colorIntensity.value = newIntensity;
    }

    function handleBPMChange(newBPM: number): void {
      bpm.value = newBPM;
      updateBPM();
    }

    function handleAutoBPMChange(newAutoBPM: boolean): void {
      autoBpm.value = newAutoBPM;
      if (autoBpm.value) {
        beatHistory.length = 0;
        lastBeatTime = 0;
      }
    }

    function updateVisualizerSettings(): void {
      // The visualizer settings are now updated reactively through props
    }

    function updateBPM(): void {
      if (isPreviewing.value && oscillator) {
        oscillator.frequency.value = bpm.value * 2;
      }
    }

    function detectBPM(): void {
      if (!analyser || !dataArray.value.length) return;

      const sum = dataArray.value.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.value.length;

      const now = audioContext!.currentTime;
      if (average > beatThreshold && now - lastBeatTime > 0.3) {
        if (lastBeatTime) {
          const beatInterval = now - lastBeatTime;
          beatHistory.push(beatInterval);
          if (beatHistory.length > beatHistoryMax) {
            beatHistory.shift();
          }

          if (beatHistory.length >= 4) {
            const averageBeatInterval = beatHistory.reduce((a, b) => a + b, 0) / beatHistory.length;
            const detectedBPM = Math.round(60 / averageBeatInterval);
            if (Math.abs(detectedBPM - bpm.value) > 5) {
              bpm.value = detectedBPM;
              showToast(`BPM updated to ${detectedBPM}`);
            }
          }
        }
        lastBeatTime = now;
      }
    }

    function randomizeSettings(): void {
      effectType.value = effects[Math.floor(Math.random() * effects.length)];
      detailLevel.value = Math.floor(Math.random() * 10) + 1;
      movementSpeed.value = Math.random() * 5 + 0.1;
      colorIntensity.value = Math.random();
      bpm.value = Math.floor(Math.random() * 270) + 30;
    }

    function resetSettings(): void {
      effectType.value = 'Waveform';
      detailLevel.value = 5;
      movementSpeed.value = 1.0;
      colorIntensity.value = 0.7;
      bpm.value = 120;
      autoBpm.value = false;
    }

    function toggleVisualization(): void {
      if (isAnimating.value) {
        stopVisualization();
      } else {
        startVisualization();
      }
    }

    function startVisualization(): void {
      if (!isAnimating.value) {
        isAnimating.value = true;
        lastTime = performance.now();
        animate();
      }
    }

    function stopVisualization(): void {
      if (isAnimating.value) {
        isAnimating.value = false;
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    }

    function animate(): void {
      if (!isAnimating.value) return;

      animationId = requestAnimationFrame(animate);

      if (analyser && dataArray.value.length > 0) {
        analyser.getByteFrequencyData(dataArray.value);
      }

      // Update current time
      if (audioContext) {
        if (isPlaying.value) {
          currentTime.value = audioContext.currentTime - playbackStartTime;
        } else {
          currentTime.value = pauseTime;
        }
      }

      if (autoBpm.value) {
        detectBPM();
      }
    }

    function togglePlay(): void {
      if (isPlaying.value) {
        pauseAudio();
      } else {
        playAudio();
      }
    }

    function playAudio(): void {
      if (!hasTrack.value) {
        showToast('Please upload an audio file first.');
        return;
      }

      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (source) {
        return;
      }

      try {
        if (!audioContext || !gainNode) return;

        source = audioContext.createBufferSource();
        source.buffer = currentTrack.value!.buffer;
        source.connect(gainNode);
        source.start(0, pauseTime);
        playbackStartTime = audioContext.currentTime - pauseTime;
        source.onended = handleTrackEnd;

        isPlaying.value = true;
        startVisualization();
      } catch (error) {
        console.error('Error playing audio:', error);
        showToast('Error playing audio.');
      }
    }

    function pauseAudio(): void {
      if (source && audioContext) {
        source.stop();
        source.disconnect();
        source = null;
        pauseTime = audioContext.currentTime - playbackStartTime;
      }
      isPlaying.value = false;
      stopVisualization();
    }

    function stopAudio(): void {
      if (source) {
        source.stop();
        source.disconnect();
        source = null;
      }
      isPlaying.value = false;
      pauseTime = 0;
      currentTime.value = 0;
      stopVisualization();
    }

    function playNextTrack(): void {
      if (playlist.value.length === 0) {
        showToast('Playlist is empty.');
        return;
      }
      currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length;
      loadTrack(currentTrackIndex.value);
      playAudio();
    }

    function playPreviousTrack(): void {
      if (playlist.value.length === 0) {
        showToast('Playlist is empty.');
        return;
      }
      currentTrackIndex.value =
        (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length;
      loadTrack(currentTrackIndex.value);
      playAudio();
    }

    function handleVolumeChange(newVolume: number): void {
      volume.value = newVolume;
      if (gainNode) {
        gainNode.gain.setValueAtTime(newVolume, audioContext?.currentTime || 0);
      }
    }

    function handleSeek(newTime: number): void {
      pauseTime = newTime;
      currentTime.value = newTime;

      if (isPlaying.value) {
        if (source) {
          source.stop();
          source.disconnect();
        }
        source = audioContext!.createBufferSource();
        source.buffer = currentTrack.value!.buffer;
        source.connect(gainNode!);
        source.start(0, pauseTime);
        playbackStartTime = audioContext!.currentTime - pauseTime;
        source.onended = handleTrackEnd;
      }
    }

    function loadTrack(index: number): void {
      if (index < 0 || index >= playlist.value.length) {
        showToast('Invalid track index.');
        return;
      }
      stopAudio();
      currentTrackIndex.value = index;
      currentTrack.value = playlist.value[index];
      pauseTime = 0;
      currentTime.value = 0;
      duration.value = currentTrack.value.buffer.duration;
    }

    function loadAndToggleTrack(index: number): void {
      if (index === currentTrackIndex.value) {
        togglePlay();
      } else {
        loadTrack(index);
        playAudio();
      }
    }

    function handleTrackEnd(): void {
      if (currentTrackIndex.value < playlist.value.length - 1) {
        playNextTrack();
      } else {
        stopAudio();
      }
    }

    function handleFileUpload(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        const files = Array.from(input.files);
        if (files.length === 0) {
          showToast('No files selected.');
          return;
        }

        let loadedFiles = 0;
        const totalFiles = files.length;

        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && e.target.result) {
              const arrayBuffer = e.target.result as ArrayBuffer;
              if (!audioContext) return;
              audioContext.decodeAudioData(
                arrayBuffer,
                (buffer) => {
                  playlist.value.push({
                    name: file.name,
                    buffer: buffer,
                  });
                  loadedFiles++;
                  if (loadedFiles === totalFiles) {
                    showToast(`Successfully loaded ${loadedFiles} file(s)`);
                    if (playlist.value.length === loadedFiles) {
                      loadTrack(0);
                    }
                  }
                },
                (error) => {
                  console.error('Error decoding audio data', error);
                  showToast(`Error decoding audio data: ${file.name}`);
                  loadedFiles++;
                }
              );
            } else {
              showToast(`Error reading file: ${file.name}`);
              loadedFiles++;
            }
          };
          reader.onerror = () => {
            showToast(`Error reading file: ${file.name}`);
            loadedFiles++;
          };
          reader.readAsArrayBuffer(file);
        });
      } else {
        showToast('No files selected.');
      }
    }

    function openFileUpload(): void {
      if (fileInputRef.value) {
        fileInputRef.value.click();
      }
    }

    function previewVisualization(): void {
      if (isPreviewing.value) {
        stopPreview();
      } else {
        startPreview();
      }
    }

    function startPreview(): void {
      if (isPlaying.value) {
        showToast('Cannot preview while audio is playing.');
        return;
      }
      isPreviewing.value = true;
      if (!audioContext || !gainNode) return;
      oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = bpm.value * 2;
      oscillator.connect(gainNode);
      oscillator.start();
      startVisualization();
    }

    function stopPreview(): void {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
      }
      isPreviewing.value = false;
      stopVisualization();
    }

    function cleanupResources(): void {
      stopVisualization();
      if (source) {
        source.stop();
        source.disconnect();
        source = null;
      }
      if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
      }
      if (analyser) {
        analyser.disconnect();
        analyser = null;
      }
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
    }

    function removeTrack(index: number): void {
      playlist.value.splice(index, 1);
      if (playlist.value.length === 0) {
        currentTrack.value = null;
        stopAudio();
      } else if (index === currentTrackIndex.value) {
        loadTrack(index % playlist.value.length);
      } else if (index < currentTrackIndex.value) {
        currentTrackIndex.value--;
      }
    }

    function showToast(message: string): void {
      toastMessage.value = message;
      toastIsOpen.value = true;
    }

    return {
      fileInputRef,
      visualizerCanvas,
      effectType,
      detailLevel,
      movementSpeed,
      colorIntensity,
      volume,
      isPlaying,
      isAnimating,
      isPreviewing,
      bpm,
      autoBpm,
      effects,
      currentTrack,
      currentTrackIndex,
      playlist,
      controlsOpen,
      currentTime,
      duration,
      dataArray,
      toastIsOpen,
      toastMessage,
      toggleControls,
      handleEffectTypeChange,
      handleVolumeChange,
      handleDetailChange,
      handleSpeedChange,
      handleIntensityChange,
      handleBPMChange,
      handleAutoBPMChange,
      updateVisualizerSettings,
      updateBPM,
      randomizeSettings,
      resetSettings,
      toggleVisualization,
      togglePlay,
      stopAudio,
      playNextTrack,
      playPreviousTrack,
      handleFileUpload,
      previewVisualization,
      handleSeek,
      closeOutline,
      optionsOutline,
      openFileUpload,
      loadTrack,
      loadAndToggleTrack,
      removeTrack,
    };
  },
});
</script>

<style scoped>
ion-content {
  --background: transparent;
}

ion-footer {
  position: fixed;
  bottom: 0;
  width: 100vw;
  left: 0;
}

@media (min-width: 768px) {
  ion-modal {
    --width: 600px;
    --height: 600px;
  }
}

.current-track {
  --background: var(--ion-color-light);
}
</style>
