<template>
  <div class="audio-controls">
    <div class="playback-controls">
      <ion-button @click="$emit('previous')" class="control-button">
        <ion-icon :icon="playSkipBackOutline"></ion-icon>
      </ion-button>
      <ion-button @click="$emit('toggle-play')" class="control-button play-pause">
        <ion-icon :icon="isPlaying ? pauseOutline : playOutline"></ion-icon>
      </ion-button>
      <ion-button @click="$emit('next')" class="control-button">
        <ion-icon :icon="playSkipForwardOutline"></ion-icon>
      </ion-button>
    </div>
    <ion-button @click="toggleMute" class="mute-button">
      <ion-icon :icon="isMuted ? volumeMuteOutline : volumeHighOutline"></ion-icon>
    </ion-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import { IonButton, IonIcon, IonRange } from '@ionic/vue';
import {
  playSkipBackOutline,
  playOutline,
  pauseOutline,
  playSkipForwardOutline,
  volumeMuteOutline,
  volumeHighOutline,
} from 'ionicons/icons';

export default defineComponent({
  name: 'AudioControls',
  components: {
    IonButton,
    IonIcon,
    IonRange,
  },
  props: {
    isPlaying: Boolean,
    volume: Number,
    currentTime: Number,
    duration: Number,
    trackTitle: String,
    trackFilename: String,
  },
  emits: ['previous', 'toggle-play', 'next', 'volume-change', 'seek'],
  setup(props, { emit }) {
    const isMuted = ref(props.volume === 0);
    const scrubberPosition = ref(props.currentTime);

    watch(() => props.currentTime, (newTime) => {
      scrubberPosition.value = newTime;
    });

    const toggleMute = () => {
      const newVolume = isMuted.value ? 1 : 0;
      isMuted.value = !isMuted.value;
      emit('volume-change', newVolume);
    };

    const handleScrubberChange = (event: CustomEvent) => {
      const newTime = Number(event.detail.value);
      emit('seek', newTime);
    };

    const formatTime = (time: number): string => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return {
      isMuted,
      scrubberPosition,
      toggleMute,
      handleScrubberChange,
      formatTime,
      playSkipBackOutline,
      playOutline,
      pauseOutline,
      playSkipForwardOutline,
      volumeMuteOutline,
      volumeHighOutline,
    };
  },
});
</script>

<style scoped>
.audio-controls {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #00000000;
  border-radius: 8px;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  color: #ffffff;
}

.playback-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}

.control-button {
  --background: #3880ff;
  --background-activated: #3171e0;
  --border-radius: 50%;
  width: 40px;
  height: 40px;
  --padding-start: 0;
  --padding-end: 0;
  margin: 0 10px;
}

.play-pause {
  --background: #3880ff;
  --background-activated: #3171e0;
  width: 50px;
  height: 50px;
}

.mute-button {
  --background: transparent;
  --background-activated: rgba(255, 255, 255, 0.1);
  --border-radius: 50%;
  width: 40px;
  height: 40px;
  --padding-start: 0;
  --padding-end: 0;
  margin-left: -60px;
}

ion-icon {
  font-size: 24px;
  color: #ffffff;
}
</style>