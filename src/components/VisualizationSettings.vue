<template>
  <ion-list>
    <ion-item>
      <ion-label>Effect Type</ion-label>
      <ion-select :value="effectType" @ionChange="(e) => $emit('effect-change', e.detail.value)">
        <ion-select-option v-for="effect in effects" :key="effect" :value="effect">{{ effect }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>Detail Level</ion-label>
      <ion-range 
        :value="detailLevel" 
        @ionChange="(e) => $emit('detail-change', e.detail.value)"
        :min="1"
        :max="10"
        :step="1"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>Speed</ion-label>
      <ion-range 
        :value="movementSpeed" 
        @ionChange="(e) => $emit('speed-change', e.detail.value)"
        :min="0.1"
        :max="5"
        :step="0.1"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>Color Intensity</ion-label>
      <ion-range 
        :value="colorIntensity" 
        @ionChange="(e) => $emit('intensity-change', e.detail.value)"
        :min="0"
        :max="1"
        :step="0.1"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>BPM</ion-label>
      <ion-input 
        type="number" 
        :value="bpm" 
        @ionChange="handleBpmChange" 
        :min="30" 
        :max="300"
      ></ion-input>
    </ion-item>
    <ion-item>
      <ion-label>Auto BPM</ion-label>
      <ion-toggle :checked="autoBpm" @ionChange="(e) => $emit('auto-bpm-change', e.detail.checked)"></ion-toggle>
    </ion-item>
  </ion-list>
  <ion-button expand="block" @click="$emit('randomize')">Randomize</ion-button>
  <ion-button expand="block" @click="$emit('reset')">Reset</ion-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonRange, IonInput, IonButton, IonToggle } from '@ionic/vue';

export default defineComponent({
  name: 'VisualizationSettings',
  components: {
    IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonRange, IonInput, IonButton, IonToggle
  },
  props: {
    effectType: { type: String, required: true },
    detailLevel: { type: Number, required: true },
    movementSpeed: { type: Number, required: true },
    colorIntensity: { type: Number, required: true },
    bpm: { type: Number, required: true },
    autoBpm: { type: Boolean, required: true },
    effects: { type: Array as () => string[], required: true },
  },
  emits: ['effect-change', 'detail-change', 'speed-change', 'intensity-change', 'bpm-change', 'auto-bpm-change', 'randomize', 'reset'],
  setup(props, { emit }) {
    const handleBpmChange = (event: CustomEvent) => {
      const value = event.detail.value;
      if (value !== undefined && value !== null) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          emit('bpm-change', numValue);
        }
      }
    };

    return {
      handleBpmChange
    };
  }
});
</script>