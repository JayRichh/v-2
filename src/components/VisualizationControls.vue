<template>
  <ion-list>
    <ion-item>
      <ion-label>Effect Type</ion-label>
      <ion-select :value="effectType" @ionChange="(e: CustomEvent) => $emit('effect-change', e.detail.value)">
        <ion-select-option v-for="effect in effects" :key="effect" :value="effect">{{ effect }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>Detail Level</ion-label>
      <ion-range 
        :value="detailLevel" 
        @ionChange="handleNumberChange('detail-change', $event)"
        :min="detailLevelRange.min"
        :max="detailLevelRange.max"
        :step="detailLevelRange.step"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>Speed</ion-label>
      <ion-range 
        :value="movementSpeed" 
        @ionChange="handleNumberChange('speed-change', $event)"
        :min="speedRange.min"
        :max="speedRange.max"
        :step="speedRange.step"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>Color Intensity</ion-label>
      <ion-range 
        :value="colorIntensity" 
        @ionChange="handleNumberChange('intensity-change', $event)"
        :min="intensityRange.min"
        :max="intensityRange.max"
        :step="intensityRange.step"
      ></ion-range>
    </ion-item>
    <ion-item>
      <ion-label>BPM</ion-label>
      <ion-input 
        type="number" 
        :value="bpm" 
        @ionChange="handleNumberChange('bpm-change', $event)" 
        :min="bpmRange.min" 
        :max="bpmRange.max"
      ></ion-input>
    </ion-item>
  </ion-list>
  <ion-button expand="block" @click="$emit('randomize')">Randomize</ion-button>
  <ion-button expand="block" @click="$emit('reset')">Reset</ion-button>
  <ion-button expand="block" @click="$emit('toggle-visualization')">
    {{ isAnimating ? 'Pause Visualization' : 'Start Visualization' }}
  </ion-button>
  <ion-button expand="block" @click="$emit('preview')">
    {{ isPreviewing ? 'Stop Preview' : 'Preview Visualization' }}
  </ion-button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonRange, IonInput, IonButton } from '@ionic/vue';
import { EffectType } from '@/types';

interface Range {
  min: number;
  max: number;
  step: number;
}

export default defineComponent({
  name: 'VisualizationControls',
  components: {
    IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonRange, IonInput, IonButton
  },
  props: {
    effectType: { type: String as PropType<EffectType>, required: true },
    detailLevel: { type: Number, required: true },
    movementSpeed: { type: Number, required: true },
    colorIntensity: { type: Number, required: true },
    bpm: { type: Number, required: true },
    effects: { type: Array as PropType<EffectType[]>, required: true },
    isAnimating: { type: Boolean, required: true },
    isPreviewing: { type: Boolean, required: true },
    detailLevelRange: { type: Object as PropType<Range>, required: true },
    speedRange: { type: Object as PropType<Range>, required: true },
    intensityRange: { type: Object as PropType<Range>, required: true },
    bpmRange: { type: Object as PropType<Range>, required: true },
  },
  emits: ['effect-change', 'detail-change', 'speed-change', 'intensity-change', 'bpm-change', 'randomize', 'reset', 'toggle-visualization', 'preview'],
  setup(props, { emit }) {
    type EmitEventName = 'effect-change' | 'detail-change' | 'speed-change' | 'intensity-change' | 'bpm-change';

    const handleNumberChange = (eventName: EmitEventName, event: CustomEvent) => {
      const value = Number(event.detail.value);
      if (!isNaN(value)) {
        emit(eventName, value);
      }
    };

    return {
      handleNumberChange
    };
  }
});
</script>

<style scoped>
ion-range {
  --bar-height: 3px;
  --knob-size: 20px;
}
</style>