<template>
  <div class="welcome-message">
    <h2>Welcome</h2>
    <p>Upload an audio file to get started!</p>
    <ion-button expand="block" @click="$emit('open-file-upload')">Upload Audio</ion-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonButton } from '@ionic/vue';

export default defineComponent({
  name: 'WelcomeMessage',
  components: {
    IonButton,
  },
  emits: ['open-file-upload'],
});
</script>

<style scoped>
.welcome-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 10px;
  width: 80%;
}
</style>