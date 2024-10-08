import * as THREE from 'three';
import { VisualizerProps, Visualizer, VisualizerGroup, VisualizerMesh } from '@/types/visualizer';

export const WaveformVisualizer: Visualizer = {
  create: (props: VisualizerProps): VisualizerGroup => {
    const group = new THREE.Group() as VisualizerGroup;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: props.detailLevel }, (_, i) =>
        new THREE.Vector3((i / (props.detailLevel - 1)) * 200 - 100, 0, 0)
      )
    );
    const geometry = new THREE.TubeGeometry(
      curve,
      props.detailLevel,
      2,
      8,
      false
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });
    const tubeMesh = new THREE.Mesh(geometry, material) as VisualizerMesh;
    group.add(tubeMesh);
    return group;
  },

  update: (visualizer: THREE.Object3D, props: VisualizerProps): void => {
    const group = visualizer as VisualizerGroup;
    const tubeMesh = group.children[0];
    if (!tubeMesh) return;

    const geometry = tubeMesh.geometry;
    const curve = geometry.parameters.path as THREE.CatmullRomCurve3;
    const points = curve.getPoints(props.detailLevel);
    const newPoints: THREE.Vector3[] = [];

    for (let i = 0; i < props.detailLevel; i++) {
      const dataIndex = Math.floor((i / props.detailLevel) * props.audioData.length);
      const y = ((props.audioData[dataIndex] / 128) - 1) * 50 * props.colorIntensity;
      newPoints.push(new THREE.Vector3(points[i].x, y, points[i].z));
    }

    const newCurve = new THREE.CatmullRomCurve3(newPoints);
    const newGeometry = new THREE.TubeGeometry(newCurve, props.detailLevel, 2, 8, false);
    tubeMesh.geometry.dispose();
    tubeMesh.geometry = newGeometry;

    const material = tubeMesh.material;
    material.color.setHSL((props.colorIntensity * 100) % 360 / 360, 1, 0.5);
  }
};