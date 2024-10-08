<template>
  <div class="visualization-settings">
    <ion-item>
      <ion-label>Effect Type</ion-label>
      <ion-select v-model="localEffectType" @ionChange="$emit('effect-change', localEffectType)">
        <ion-select-option v-for="effect in effects" :key="effect" :value="effect">{{ effect }}</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label>Detail Level</ion-label>
      <ion-range v-model="localDetailLevel" min="1" max="10" step="1" @ionChange="$emit('detail-change', localDetailLevel)">
        <ion-label slot="start">1</ion-label>
        <ion-label slot="end">10</ion-label>
      </ion-range>
    </ion-item>

    <ion-item>
      <ion-label>Movement Speed</ion-label>
      <ion-range v-model="localMovementSpeed" min="0.1" max="5" step="0.1" @ionChange="$emit('speed-change', localMovementSpeed)">
        <ion-label slot="start">0.1</ion-label>
        <ion-label slot="end">5</ion-label>
      </ion-range>
    </ion-item>

    <ion-item>
      <ion-label>Color Intensity</ion-label>
      <ion-range v-model="localColorIntensity" min="0" max="1" step="0.1" @ionChange="$emit('intensity-change', localColorIntensity)">
        <ion-label slot="start">0</ion-label>
        <ion-label slot="end">1</ion-label>
      </ion-range>
    </ion-item>

    <ion-item>
      <ion-label>BPM</ion-label>
      <ion-input type="number" v-model="localBpm" @ionChange="$emit('bpm-change', parseInt(localBpm))"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label>Auto BPM</ion-label>
      <ion-toggle v-model="localAutoBpm" @ionChange="$emit('auto-bpm-change', localAutoBpm)"></ion-toggle>
    </ion-item>

    <ion-button expand="block" @click="$emit('randomize')">Randomize Settings</ion-button>
    <ion-button expand="block" @click="$emit('reset')">Reset Settings</ion-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonRange, IonInput, IonToggle, IonButton } from '@ionic/vue';
import { EffectType } from '@/types';

export default defineComponent({
  name: 'VisualizationView',
  components: {
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonRange,
    IonInput,
    IonToggle,
    IonButton,
  },
  props: {
    effectType: {
      type: String as () => EffectType,
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
      type: Array as () => EffectType[],
      required: true,
    },
  },
  setup(props) {
    const localEffectType = ref<EffectType>(props.effectType);
    const localDetailLevel = ref<number>(props.detailLevel);
    const localMovementSpeed = ref<number>(props.movementSpeed);
    const localColorIntensity = ref<number>(props.colorIntensity);
    const localBpm = ref<number>(props.bpm);
    const localAutoBpm = ref<boolean>(props.autoBpm);

    watch(() => props.effectType, (newValue) => { localEffectType.value = newValue });
    watch(() => props.detailLevel, (newValue) => { localDetailLevel.value = newValue });
    watch(() => props.movementSpeed, (newValue) => { localMovementSpeed.value = newValue });
    watch(() => props.colorIntensity, (newValue) => { localColorIntensity.value = newValue });
    watch(() => props.bpm, (newValue) => { localBpm.value = newValue });
    watch(() => props.autoBpm, (newValue) => { localAutoBpm.value = newValue });

    return {
      localEffectType,
      localDetailLevel,
      localMovementSpeed,
      localColorIntensity,
      localBpm,
      localAutoBpm,
    };
  },
  emits: ['effect-change', 'detail-change', 'speed-change', 'intensity-change', 'bpm-change', 'auto-bpm-change', 'randomize', 'reset'],
});
</script>

<style scoped>
.visualization-settings {
  padding: 16px;
}
</style>