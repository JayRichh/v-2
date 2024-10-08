import { EffectType } from '@/types';
import * as THREE from 'three';

export interface VisualizerProps {
  effectType: EffectType;
  detailLevel: number;
  movementSpeed: number;
  colorIntensity: number;
  bpm: number;
  audioData: Uint8Array;
  isAnimating: boolean;
}

export interface Visualizer {
  create: (props: VisualizerProps) => THREE.Object3D;
  update: (visualizer: THREE.Object3D, props: VisualizerProps) => void;
}

export interface VisualizerMesh extends THREE.Mesh {
  geometry: THREE.TubeGeometry;
  material: THREE.MeshBasicMaterial;
}

export interface VisualizerGroup extends THREE.Group {
  children: [VisualizerMesh];
}