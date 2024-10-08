<template>
  <ion-list>
    <ion-item-sliding v-for="(track, index) in playlist" :key="index">
      <ion-item :class="{ 'current-track': index === currentTrackIndex }">
        <ion-label>{{ track.name }}</ion-label>
        <ion-button slot="end" @click="$emit('load-and-toggle-track', index)">
          {{ index === currentTrackIndex && isPlaying ? 'Pause' : 'Play' }}
        </ion-button>
      </ion-item>
      <ion-item-options side="end">
        <ion-item-option color="danger" @click="$emit('remove-track', index)">Remove</ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  </ion-list>
  <ion-button expand="block" @click="$emit('open-file-upload')">Add Tracks</ion-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonList, IonItemSliding, IonItem, IonLabel, IonButton, IonItemOptions, IonItemOption } from '@ionic/vue';
import { AudioTrack } from '@/types';

export default defineComponent({
  name: 'PlaylistView',
  components: {
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonButton,
    IonItemOptions,
    IonItemOption,
  },
  props: {
    playlist: {
      type: Array as () => AudioTrack[],
      required: true,
    },
    currentTrackIndex: {
      type: Number,
      required: true,
    },
    isPlaying: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['load-and-toggle-track', 'remove-track', 'open-file-upload'],
});
</script>

<style scoped>
.current-track {
  --background: var(--ion-color-light);
}
</style>