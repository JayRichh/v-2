<template>
  <ion-card class="now-playing-card">
    <ion-card-header>
      <ion-card-title class="track-name">{{ currentTrack ? currentTrack.name.split('.')[0] : 'No track selected' }}</ion-card-title>
      <ion-card-subtitle>Now Playing</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
      <ion-range
        :dualKnobs="false"
        v-model.number="scrubberPosition"
        :min="0"
        :max="duration"
        :step="0.1"
        @ionChange="handleSeek"
      ></ion-range>

      <ion-button expand="block" @click="togglePlaylist" class="toggle-playlist-button">
        <ion-icon :icon="playlistExpanded ? chevronUpOutline : chevronDownOutline" slot="start"></ion-icon>
        {{ playlistExpanded ? 'Hide Playlist' : 'Show Playlist' }}
      </ion-button>

      <div v-show="playlistExpanded" class="playlist-container">
        <ion-list class="playlist">
          <ion-item-sliding v-for="(track, index) in playlist" :key="index">
            <ion-item
              :class="{ 'active-track': index === currentTrackIndex }"
              @click="loadTrack(index)"
            >
              <ion-label class="track-label">{{ track.name }}</ion-label>
              <ion-button slot="end" fill="clear" @click.stop="removeTrack(index)" class="delete-button">
                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-item-sliding>
        </ion-list>
        <ion-button expand="block" @click="openFileUpload" class="add-more-button">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Add More Tracks
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonRange,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonItemSliding,
  IonLabel,
} from '@ionic/vue';
import { chevronUpOutline, chevronDownOutline, trashOutline, addOutline } from 'ionicons/icons';
import { AudioTrack } from '@/types';

export default defineComponent({
  name: 'PlaylistManager',
  components: {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonRange,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonItemSliding,
    IonLabel,
  },
  props: {
    currentTrack: {
      type: Object as () => AudioTrack | null,
      default: null,
    },
    currentTrackIndex: {
      type: Number,
      default: 0,
    },
    playlist: {
      type: Array as () => AudioTrack[],
      default: () => [],
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  emits: ['seek', 'load-track', 'remove-track', 'open-file-upload'],
  setup(props, { emit }) {
    const playlistExpanded = ref(false);
    const scrubberPosition = ref(0);

    watch(() => props.currentTime, (newTime) => {
      scrubberPosition.value = newTime;
    });

    const togglePlaylist = () => {
      playlistExpanded.value = !playlistExpanded.value;
    };

    const handleSeek = (event: CustomEvent) => {
      emit('seek', event.detail.value);
    };

    const loadTrack = (index: number) => {
      emit('load-track', index);
    };

    const removeTrack = (index: number) => {
      emit('remove-track', index);
    };

    const openFileUpload = () => {
      emit('open-file-upload');
    };

    const formatTime = (time: number): string => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return {
      playlistExpanded,
      scrubberPosition,
      togglePlaylist,
      handleSeek,
      loadTrack,
      removeTrack,
      openFileUpload,
      formatTime,
      chevronUpOutline,
      chevronDownOutline,
      trashOutline,
      addOutline,
    };
  },
});
</script>

<style scoped>
.now-playing-card {
  position: absolute;
  top: 15px;
  left: 20px;
  right: 20px;
  margin-top: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  max-height: 80vh;
  overflow-y: auto;
}

.track-name {
  color: #ffffff;
}

.time-display {
  text-align: center;
  margin-bottom: 10px;
}

.playlist-container {
  margin-top: 20px;
  max-height: 40vh;
  overflow-y: auto;
}

.playlist {
  margin-bottom: 10px;
}

.active-track {
  --background: rgba(var(--ion-color-primary-rgb), 0.2);
}

.track-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
}

.toggle-playlist-button {
  --background: rgba(var(--ion-color-primary-rgb), 0.2);
  --color: #ffffff;
}

.add-more-button {
  margin-top: 10px;
  --background: rgba(var(--ion-color-primary-rgb), 0.1);
  --color: #ffffff;
}

.delete-button {
  --color: var(--ion-color-danger);
}

ion-item {
  --background: transparent;
  --color: #ffffff;
}

ion-list {
  background-color: transparent;
}
</style>