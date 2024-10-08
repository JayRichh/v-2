<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Visualizer Controls</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-segment v-model="controlMode">
        <ion-segment-button value="listen">Listen</ion-segment-button>
        <ion-segment-button value="visualize">Visualize</ion-segment-button>
      </ion-segment>
      
      <playlist-manager
        v-if="controlMode === 'listen'"
        :current-track="currentTrack"
        :current-track-index="currentTrackIndex"
        :playlist="playlist"
        :current-time="currentTime"
        :duration="duration"
        @seek="$emit('seek', $event)"
        @load-track="$emit('load-track', $event)"
        @remove-track="$emit('remove-track', $event)"
        @open-file-upload="$emit('open-file-upload')"
      />
      
      <visualization-view
        v-if="controlMode === 'visualize'"
        :effect-type="effectType"
        :detail-level="detailLevel"
        :movement-speed="movementSpeed"
        :color-intensity="colorIntensity"
        :bpm="bpm"
        :auto-bpm="autoBpm"
        :effects="effects"
        @effect-change="$emit('effect-change', $event)"
        @detail-change="$emit('detail-change', $event)"
        @speed-change="$emit('speed-change', $event)"
        @intensity-change="$emit('intensity-change', $event)"
        @bpm-change="$emit('bpm-change', $event)"
        @auto-bpm-change="$emit('auto-bpm-change', $event)"
        @randomize="$emit('randomize')"
        @reset="$emit('reset')"
      />
      
      <ion-button expand="block" @click="$emit('toggle-visualization')">
        {{ isAnimating ? 'Pause Visualization' : 'Start Visualization' }}
      </ion-button>
      <ion-button expand="block" @click="$emit('preview-visualization')">
        {{ isPreviewing ? 'Stop Preview' : 'Preview Visualization' }}
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSegment, IonSegmentButton } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { EffectType, AudioTrack } from '@/types';
import PlaylistManager from './PlaylistManager.vue';
import VisualizationView from './VisualizationView.vue';

export default defineComponent({
  name: 'ControlsModal',
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSegment,
    IonSegmentButton,
    PlaylistManager,
    VisualizationView,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    effectType: {
      type: String as PropType<EffectType>,
      required: true,
    },
    detailLevel: {
      type: Number,
      required: true,
    },
    movementSpeed: {
      type: Number,
      required: true,
    },
    colorIntensity: {
      type: Number,
      required: true,
    },
    bpm: {
      type: Number,
      required: true,
    },
    autoBpm: {
      type: Boolean,
      required: true,
    },
    effects: {
      type: Array as PropType<EffectType[]>,
      required: true,
    },
    playlist: {
      type: Array as PropType<AudioTrack[]>,
      required: true,
    },
    currentTrack: {
      type: Object as PropType<AudioTrack | null>,
      required: true,
    },
    currentTrackIndex: {
      type: Number,
      required: true,
    },
    currentTime: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    isAnimating: {
      type: Boolean,
      required: true,
    },
    isPreviewing: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const controlMode = ref<'listen' | 'visualize'>('listen');

    return {
      controlMode,
      closeOutline,
    };
  },
  emits: [
    'close',
    'effect-change',
    'detail-change',
    'speed-change',
    'intensity-change',
    'bpm-change',
    'auto-bpm-change',
    'randomize',
    'reset',
    'toggle-visualization',
    'preview-visualization',
    'seek',
    'load-track',
    'remove-track',
    'open-file-upload',
  ],
});
</script>