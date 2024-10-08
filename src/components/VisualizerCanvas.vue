<template>
  <canvas ref="visualizerCanvas"></canvas>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  PropType,
} from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type EffectType =
  | 'Waveform'
  | 'Bars'
  | 'Circle'
  | 'Particles'
  | 'Spectrum'
  | 'Terrain'
  | 'Grid'
  | 'Flow'
  | 'Ripple'
  | 'Fractal';

interface VisualizerProps {
  effectType: EffectType;
  detailLevel: number;
  movementSpeed: number;
  colorIntensity: number;
  bpm: number;
  audioData: Uint8Array;
  isAnimating: boolean;
}

export default defineComponent({
  name: 'VisualizerCanvas',
  props: {
    effectType: { type: String as PropType<EffectType>, required: true },
    detailLevel: { type: Number, required: true },
    movementSpeed: { type: Number, required: true },
    colorIntensity: { type: Number, required: true },
    bpm: { type: Number, required: true },
    audioData: { type: Object as PropType<Uint8Array>, required: true },
    isAnimating: { type: Boolean, required: true },
  },
  setup(props: VisualizerProps) {
    const visualizerCanvas = ref<HTMLCanvasElement | null>(null);
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let visualizer: THREE.Object3D | null = null;
    let animationId: number | null = null;
    let lastTime = 0;
    let beatDetected = false;
    let beatCooldown = 0;

    const BEAT_THRESHOLD = 150;
    const BEAT_COOLDOWN_TIME = 300;

    type VisualizerObject = THREE.Group | THREE.Mesh | THREE.Points | THREE.Line;

    // Utility function to create ShaderMaterial with dynamic color
    const createShaderMaterial = (
      vertexShader: string,
      fragmentShader: string,
      baseColor: THREE.Color = new THREE.Color(0xffffff)
    ) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          colorIntensity: { value: props.colorIntensity },
          baseColor: { value: baseColor },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
      });
    };

    const createFunctions: Record<EffectType, () => VisualizerObject> = {
      Waveform: createWaveformVisualizer,
      Bars: createBarsVisualizer,
      Circle: createCircleVisualizer,
      Particles: createParticlesVisualizer,
      Spectrum: createSpectrumVisualizer,
      Terrain: createTerrainVisualizer,
      Grid: createGridVisualizer,
      Flow: createFlowVisualizer,
      Ripple: createRippleVisualizer,
      Fractal: createFractalVisualizer,
    };

    const updateFunctions: Record<EffectType, () => void> = {
      Waveform: updateWaveformVisualizer,
      Bars: updateBarsVisualizer,
      Circle: updateCircleVisualizer,
      Particles: updateParticlesVisualizer,
      Spectrum: updateSpectrumVisualizer,
      Terrain: updateTerrainVisualizer,
      Grid: updateGridVisualizer,
      Flow: updateFlowVisualizer,
      Ripple: updateRippleVisualizer,
      Fractal: updateFractalVisualizer,
    };

    onMounted(() => {
      initThreeJS();
      window.addEventListener('resize', onWindowResize);
      if (props.isAnimating) {
        startAnimation();
      }
    });

    onUnmounted(() => {
      cleanupResources();
      window.removeEventListener('resize', onWindowResize);
    });

    watch(
      () => props.effectType,
      () => createVisualizer()
    );

    watch(
      () => props.detailLevel,
      () => createVisualizer()
    );

    watch(
      () => props.isAnimating,
      (newVal) => {
        if (newVal) {
          startAnimation();
        } else {
          stopAnimation();
        }
      }
    );

    function initThreeJS(): void {
      if (!visualizerCanvas.value) return;
      scene = new THREE.Scene();

      const bgGeometry = new THREE.SphereGeometry(100, 32, 32);
      const bgMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        side: THREE.BackSide,
      });
      const background = new THREE.Mesh(bgGeometry, bgMaterial);
      scene.add(background);

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(30, 15, 30);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        canvas: visualizerCanvas.value,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false;
      controls.enablePan = false;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

      createVisualizer();

      addSmokeParticles();
    }

    function addSmokeParticles(): void {
      const smokeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.2,
        metalness: 0.1,
        roughness: 0.9,
      });

      const smokeGroup = new THREE.Group();

      for (let i = 0; i < 100; i++) {
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        smoke.position.set(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200
        );
        smoke.scale.setScalar(Math.random() * 2 + 1);
        smokeGroup.add(smoke);
      }

      scene.add(smokeGroup);
    }

    function createVisualizer(): void {
      if (visualizer) {
        scene.remove(visualizer);
        disposeObject(visualizer);
        visualizer = null;
      }

      const createFunction = createFunctions[props.effectType];
      if (createFunction) {
        try {
          visualizer = createFunction();
          scene.add(visualizer);
        } catch (error) {
          console.error(`Error creating visualizer: ${props.effectType}`, error);
        }
      }
    }

    function startAnimation(): void {
      if (!animationId) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
      }
    }

    function stopAnimation(): void {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    function animate(time: number): void {
      if (!props.isAnimating) {
        stopAnimation();
        return;
      }

      animationId = requestAnimationFrame(animate);
      const deltaTime = time - lastTime;
      lastTime = time;

      if (beatCooldown > 0) {
        beatCooldown -= deltaTime;
        if (beatCooldown < 0) beatCooldown = 0;
      }

      const average = getAverageFrequency(props.audioData);
      if (average > BEAT_THRESHOLD && beatCooldown === 0) {
        beatDetected = true;
        beatCooldown = BEAT_COOLDOWN_TIME;
      } else {
        beatDetected = false;
      }

      if (visualizer) {
        updateVisualizer();
        visualizer.rotation.y +=
          deltaTime * 0.001 * props.movementSpeed * (props.bpm / 120);
        applyBeatEffects(visualizer, beatDetected);
      }

      controls.update();
      renderer.render(scene, camera);
    }

    function onWindowResize(): void {
      if (!visualizerCanvas.value) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function cleanupResources(): void {
      stopAnimation();
      if (visualizer) {
        scene.remove(visualizer);
        disposeObject(visualizer);
        visualizer = null;
      }
      controls.dispose();
      renderer.dispose();
    }

    function disposeObject(obj: THREE.Object3D): void {
      obj.traverse((child) => {
        if (
          child instanceof THREE.Mesh ||
          child instanceof THREE.Line ||
          child instanceof THREE.Points
        ) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => {
                material.dispose();
              });
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }

    function updateVisualizer(): void {
      const updateFunction = updateFunctions[props.effectType];
      if (updateFunction) {
        try {
          updateFunction();
        } catch (error) {
          console.error(`Error updating visualizer: ${props.effectType}`, error);
        }
      }
    }

    function updateColor(material: THREE.ShaderMaterial): void {
      material.uniforms.baseColor.value.setHSL(
        ((props.colorIntensity * 100) % 360) / 360,
        1,
        0.5
      );
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function getAverageFrequency(data: Uint8Array): number {
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      return sum / data.length;
    }

    function applyBeatEffects(obj: THREE.Object3D, beat: boolean): void {
      obj.traverse((child) => {
        if (
          child instanceof THREE.Mesh ||
          child instanceof THREE.Line ||
          child instanceof THREE.Points
        ) {
          if ('scale' in child) {
            if (beat) {
              child.scale.set(1.2, 1.2, 1.2);
              if ('material' in child) {
                const material = child.material as THREE.ShaderMaterial;
                updateColor(material);
              }
            } else {
              child.scale.set(1, 1, 1);
            }
          }
        }
      });
    }

    // -------------------- Create Visualizer Functions with Shaders --------------------

    function createWaveformVisualizer(): THREE.Group {
      const group = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: props.detailLevel }, (_, i) =>
          new THREE.Vector3((i / props.detailLevel) * 40 - 20, 0, 0)
        )
      );
      const geometry = new THREE.TubeGeometry(
        curve,
        props.detailLevel,
        0.5,
        8,
        false
      );
      const material = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
        `,
        new THREE.Color(0xff0000) // Initial color (can be dynamic)
      );
      const tubeMesh = new THREE.Mesh(geometry, material);
      group.add(tubeMesh);
      return group;
    }

    function createBarsVisualizer(): THREE.Group {
      const group = new THREE.Group();
      const barCount = props.detailLevel * 20;
      const barGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);

      for (let i = 0; i < barCount; i++) {
        const hue = (i / barCount) * 360;
        const baseColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
        const material = createShaderMaterial(
          `
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec3 vColor;
          void main() {
            vColor = baseColor * colorIntensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
          `,
          `
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1.0);
          }
          `,
          baseColor
        );

        const bar = new THREE.Mesh(barGeometry, material);
        const angle = (i / barCount) * Math.PI * 2;
        const radius = 15;
        bar.position.set(
          Math.cos(angle) * radius,
          0.5,
          Math.sin(angle) * radius
        );
        bar.rotation.y = -angle;
        bar.scale.y = 1;
        group.add(bar);
      }

      return group;
    }

    function createCircleVisualizer(): THREE.Mesh {
      const geometry = new THREE.CircleGeometry(20, props.detailLevel * 40);
      const material = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
        `,
        new THREE.Color(0x00ff00) // Initial color
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      return mesh;
    }

    function createParticlesVisualizer(): THREE.Points {
      const particleCount = props.detailLevel * 1000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        colors[i * 3] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          colorIntensity: { value: props.colorIntensity },
          baseColor: { value: new THREE.Color(0xffffff) },
        },
        vertexShader: `
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec3 vColor;
          void main() {
            vColor = baseColor * colorIntensity;
            gl_PointSize = 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1.0);
          }
        `,
        vertexColors: true,
        transparent: true,
      });

      const particles = new THREE.Points(geometry, material);
      return particles;
    }

    function createSpectrumVisualizer(): THREE.Group {
      const group = new THREE.Group();
      const segmentCount = props.detailLevel * 40;
      const radius = 25;
      const segmentAngle = (2 * Math.PI) / segmentCount;

      for (let i = 0; i < segmentCount; i++) {
        const hue = (i / segmentCount) * 360;
        const baseColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
        const geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const material = createShaderMaterial(
          `
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec3 vColor;
          void main() {
            vColor = baseColor * colorIntensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
          `,
          `
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1.0);
          }
          `,
          baseColor
        );

        const bar = new THREE.Mesh(geometry, material);
        const angle = segmentAngle * i;
        bar.position.set(
          Math.cos(angle) * radius,
          0.5,
          Math.sin(angle) * radius
        );
        bar.rotation.y = -angle;
        bar.scale.y = 1;
        group.add(bar);
      }

      const glowGeometry = new THREE.RingGeometry(24, 25, 64);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          colorIntensity: { value: props.colorIntensity },
          baseColor: { value: new THREE.Color(0xffffff) },
        },
        vertexShader: `
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec2 vUv;
          void main() {
            float opacity = 1.0 - smoothstep(0.8, 1.0, distance(vUv, vec2(0.5)));
            gl_FragColor = vec4(baseColor, opacity * colorIntensity);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);

      return group;
    }

    function createTerrainVisualizer(): THREE.Mesh {
      const geometry = new THREE.PlaneGeometry(
        100,
        100,
        props.detailLevel * 20,
        props.detailLevel * 20
      );
      const material = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 0.8);
        }
        `,
        new THREE.Color(0x00ff00)
      );
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;

      const depthGeometry = new THREE.PlaneGeometry(
        100,
        100,
        props.detailLevel * 20,
        props.detailLevel * 20
      );
      const depthMaterial = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 0.5);
        }
        `,
        new THREE.Color(0x007700)
      );
      const depthLayer = new THREE.Mesh(depthGeometry, depthMaterial);
      depthLayer.rotation.x = -Math.PI / 2;
      terrain.add(depthLayer);

      return terrain;
    }

    function createGridVisualizer(): THREE.Group {
      const group = new THREE.Group();
      const size = 100;
      const divisions = props.detailLevel * 20;
      const gridHelper = new THREE.GridHelper(size, divisions, 0xffffff, 0xffffff);
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      group.add(gridHelper);

      const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);

      for (let i = 0; i <= divisions; i++) {
        for (let j = 0; j <= divisions; j++) {
          const hue = Math.random() * 360;
          const baseColor = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
          const material = createShaderMaterial(
            `
            uniform float colorIntensity;
            uniform vec3 baseColor;
            varying vec3 vColor;
            void main() {
              vColor = baseColor * colorIntensity;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            `
            varying vec3 vColor;
            void main() {
              gl_FragColor = vec4(vColor, 0.6);
            }
            `,
            baseColor
          );

          const sphere = new THREE.Mesh(sphereGeometry, material);
          sphere.position.set(
            (i / divisions) * size - size / 2,
            0.2,
            (j / divisions) * size - size / 2
          );
          group.add(sphere);
        }
      }

      return group;
    }

    function createFlowVisualizer(): THREE.Line {
      const curvePoints: THREE.Vector3[] = [];
      for (let i = 0; i < props.detailLevel * 5; i++) {
        const angle = (i / (props.detailLevel * 5)) * Math.PI * 2;
        curvePoints.push(new THREE.Vector3(Math.cos(angle) * 40, Math.sin(angle) * 40, 0));
      }
      const curve = new THREE.CatmullRomCurve3(curvePoints, true);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        curve.getPoints(props.detailLevel * 5)
      );
      const material = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
        `,
        new THREE.Color(0x00ffff)
      );
      const flowLine = new THREE.Line(geometry, material);
      return flowLine;
    }

    function createRippleVisualizer(): THREE.Mesh {
      const geometry = new THREE.PlaneGeometry(
        100,
        100,
        props.detailLevel * 20,
        props.detailLevel * 20
      );
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          colorIntensity: { value: props.colorIntensity },
          baseColor: { value: new THREE.Color(0x0000ff) },
        },
        vertexShader: `
          uniform float time;
          uniform float colorIntensity;
          uniform vec3 baseColor;
          varying vec3 vColor;
          void main() {
            vec3 pos = position;
            float dist = length(pos.xy);
            pos.z += sin(dist * 10.0 - time * 5.0) * colorIntensity;
            vColor = baseColor * colorIntensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 0.7);
          }
        `,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const rippleMesh = new THREE.Mesh(geometry, material);
      rippleMesh.rotation.x = -Math.PI / 2;
      return rippleMesh;
    }

    function createFractalVisualizer(): THREE.Group {
      const group = new THREE.Group();
      const baseColor = new THREE.Color(0xffffff);
      const material = createShaderMaterial(
        `
        uniform float colorIntensity;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main() {
          vColor = baseColor * colorIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
        `,
        baseColor
      );

      function addBranch(startPoint: THREE.Vector3, dir: THREE.Vector3, depth: number): void {
        if (depth === 0) return;
        const endPoint = startPoint.clone().add(dir);
        const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const line = new THREE.Line(geometry, material.clone());
        group.add(line);

        const leftDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4).multiplyScalar(0.7);
        const rightDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 4).multiplyScalar(0.7);

        addBranch(endPoint, leftDir, depth - 1);
        addBranch(endPoint, rightDir, depth - 1);
      }

      addBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0), 6);
      addBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(7, 7, 0), 6);
      addBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-7, 7, 0), 6);

      return group;
    }

    // -------------------- Update Visualizer Functions --------------------

    function updateWaveformVisualizer(): void {
      if (!(visualizer instanceof THREE.Group)) return;
      const tubeMesh = visualizer.children.find(
        (child) => child instanceof THREE.Mesh
      ) as THREE.Mesh | undefined;
      if (!tubeMesh) return;

      const geometry = tubeMesh.geometry as THREE.TubeGeometry;
      const curve = geometry.parameters.path as THREE.CatmullRomCurve3;
      const points = curve.getPoints(props.detailLevel);
      const newPoints: THREE.Vector3[] = [];

      for (let i = 0; i < props.detailLevel; i++) {
        const dataIndex = Math.min(
          Math.floor((i / props.detailLevel) * props.audioData.length),
          props.audioData.length - 1
        );
        const y = ((props.audioData[dataIndex] / 128) - 1) * 10 * props.colorIntensity;
        newPoints.push(new THREE.Vector3(points[i].x, y, points[i].z));
      }

      const newCurve = new THREE.CatmullRomCurve3(newPoints);
      const newGeometry = new THREE.TubeGeometry(newCurve, props.detailLevel, 0.5, 8, false);
      tubeMesh.geometry.dispose();
      tubeMesh.geometry = newGeometry;
      const material = tubeMesh.material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateBarsVisualizer(): void {
      if (!(visualizer instanceof THREE.Group)) return;
      visualizer.children.forEach((child, index) => {
        if (!(child instanceof THREE.Mesh)) return;
        const dataIndex = Math.min(
          Math.floor((index / visualizer!.children.length) * props.audioData.length),
          props.audioData.length - 1
        );
        const scale = (props.audioData[dataIndex] / 255) * 20 * props.colorIntensity;
        child.scale.y = Math.max(scale, 0.1);
        child.position.y = child.scale.y / 2;
        const material = child.material as THREE.ShaderMaterial;
        material.uniforms.colorIntensity.value = props.colorIntensity;
      });
    }

    function updateCircleVisualizer(): void {
      if (!(visualizer instanceof THREE.Mesh)) return;
      const geometry = visualizer.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        const dataIndex = Math.min(
          Math.floor((i / 3 / (props.detailLevel * 40)) * props.audioData.length),
          props.audioData.length - 1
        );
        const angle = (i / 3 / (props.detailLevel * 40)) * Math.PI * 2;
        const scale = 1 + (props.audioData[dataIndex] / 255) * props.colorIntensity;
        positions[i] = Math.cos(angle) * 20 * scale;
        positions[i + 1] = Math.sin(angle) * 20 * scale;
        // Z remains unchanged
      }

      geometry.attributes.position.needsUpdate = true;
      const material = visualizer.material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateParticlesVisualizer(): void {
      if (!(visualizer instanceof THREE.Points)) return;
      const positions = visualizer.geometry.attributes.position.array as Float32Array;
      const colors = visualizer.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        const dataIndex = Math.min(
          Math.floor((i / positions.length) * props.audioData.length),
          props.audioData.length - 1
        );
        const scale = 1 + (props.audioData[dataIndex] / 255) * props.colorIntensity;

        positions[i] *= scale;
        positions[i + 1] *= scale;
        positions[i + 2] *= scale;

        if (
          Math.abs(positions[i]) > 50 ||
          Math.abs(positions[i + 1]) > 50 ||
          Math.abs(positions[i + 2]) > 50
        ) {
          positions[i] = (Math.random() - 0.5) * 100;
          positions[i + 1] = (Math.random() - 0.5) * 100;
          positions[i + 2] = (Math.random() - 0.5) * 100;
        }

        colors[i] = Math.abs(positions[i] / 100);
        colors[i + 1] = Math.abs(positions[i + 1] / 100);
        colors[i + 2] = Math.abs(positions[i + 2] / 100);
      }

      visualizer.geometry.attributes.position.needsUpdate = true;
      visualizer.geometry.attributes.color.needsUpdate = true;
      const material = visualizer.material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateSpectrumVisualizer(): void {
      if (!(visualizer instanceof THREE.Group)) return;
      visualizer.children.forEach((child, index) => {
        if (!(child instanceof THREE.Mesh)) return;
        const dataIndex = Math.min(
          Math.floor((index / visualizer!.children.length) * props.audioData.length),
          props.audioData.length - 1
        );
        const scale = (props.audioData[dataIndex] / 255) * 30 * props.colorIntensity;
        child.scale.y = Math.max(scale, 0.1);
        child.position.y = child.scale.y / 2;
        const material = child.material as THREE.ShaderMaterial;
        material.uniforms.colorIntensity.value = props.colorIntensity;
      });
    }

    function updateTerrainVisualizer(): void {
      if (!(visualizer instanceof THREE.Mesh)) return;
      const geometry = visualizer.geometry as THREE.PlaneGeometry;
      const vertices = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < vertices.length; i += 3) {
        const dataIndex = Math.min(
          Math.floor((i / 3 / (props.detailLevel * 20)) * props.audioData.length),
          props.audioData.length - 1
        );
        vertices[i + 2] =
          (props.audioData[dataIndex] / 255) * 50 * props.colorIntensity;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      const material = visualizer.material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateGridVisualizer(): void {
      if (!(visualizer instanceof THREE.Group)) return;
      visualizer.children.forEach((child, index) => {
        if (!(child instanceof THREE.Mesh)) return;
        const dataIndex = Math.min(
          Math.floor((index / visualizer!.children.length) * props.audioData.length),
          props.audioData.length - 1
        );
        const scale = 1 + (props.audioData[dataIndex] / 255) * props.colorIntensity;
        child.scale.y = Math.max(scale, 0.1);
        child.position.y = child.scale.y / 2;
        const material = child.material as THREE.ShaderMaterial;
        material.uniforms.colorIntensity.value = props.colorIntensity;
      });
    }

    function updateFlowVisualizer(): void {
      if (!(visualizer instanceof THREE.Line)) return;
      const geometry = visualizer.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const newPoints: THREE.Vector3[] = [];

      for (let i = 0; i < props.detailLevel * 5; i++) {
        const dataIndex = Math.min(
          Math.floor((i / (props.detailLevel * 5)) * props.audioData.length),
          props.audioData.length - 1
        );
        const scale = 1 + (props.audioData[dataIndex] / 255) * props.colorIntensity;
        const angle = (i / (props.detailLevel * 5)) * Math.PI * 2;
        const x = Math.cos(angle) * 40 * scale;
        const y = Math.sin(angle) * 40 * scale;
        const z = 0;
        newPoints.push(new THREE.Vector3(x, y, z));
      }

      const newCurve = new THREE.CatmullRomCurve3(newPoints, true);
      const newGeometry = new THREE.BufferGeometry().setFromPoints(newCurve.getPoints(props.detailLevel * 5));
      geometry.dispose();
      visualizer.geometry = newGeometry;
      const material = visualizer.material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateRippleVisualizer(): void {
      if (!(visualizer instanceof THREE.Mesh)) return;
      const material = visualizer.material as THREE.ShaderMaterial;
      material.uniforms.time.value += 0.05 * props.movementSpeed;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    function updateFractalVisualizer(): void {
      if (!(visualizer instanceof THREE.Group)) return;

      visualizer.traverse((child) => {
        if (child instanceof THREE.Line) {
          const geometry = child.geometry as THREE.BufferGeometry;
          const positions = geometry.attributes.position.array as Float32Array;
          if (positions.length < 6) return; // Ensure there's a start and end point

          const start = new THREE.Vector3(positions[0], positions[1], positions[2]);
          const end = new THREE.Vector3(positions[3], positions[4], positions[5]);

          const rotationAxis = new THREE.Vector3(0, 0, 1);
          end.applyAxisAngle(rotationAxis, 0.02 * props.movementSpeed);

          positions[3] = end.x;
          positions[4] = end.y;
          positions[5] = end.z;

          geometry.attributes.position.needsUpdate = true;
        }
      });

      const material = (visualizer.children[0] as THREE.Line).material as THREE.ShaderMaterial;
      material.uniforms.colorIntensity.value = props.colorIntensity;
    }

    return {
      visualizerCanvas,
    };
  },
});
</script>

<style scoped>
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
