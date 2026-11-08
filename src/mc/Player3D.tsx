import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FC} from 'react';
import {cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {SkinViewer} from 'skinview3d';
import * as THREE from 'three';
import {item, tex} from './assets';
import {resolveItem} from './manifest';
import {FPS} from './theme';

/**
 * A real 3D Minecraft player (skinview3d + three.js), posed per frame so renders are
 * deterministic. Use it live in a scene, or render a pose to a still and slide it around.
 *
 * Poses are plain functions of time; add new ones to POSES.
 */

export type PoseName = 'idle' | 'run' | 'walk' | 'wave' | 'swing' | 'cheer' | 'hold';

type Joints = {
  head: [number, number];
  body: number; // forward lean (rad)
  rArm: [number, number]; // x (swing), z (spread)
  lArm: [number, number];
  rLeg: number;
  lLeg: number;
  bob: number; // vertical offset in model px
};

const EASE_IO = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

const ZERO: Joints = {head: [0, 0], body: 0, rArm: [0, 0], lArm: [0, 0], rLeg: 0, lLeg: 0, bob: 0};

export const POSES: Record<PoseName, (t: number) => Joints> = {
  idle: (t) => ({...ZERO, rArm: [Math.sin(t * 2) * 0.05, 0.04], lArm: [-Math.sin(t * 2) * 0.05, -0.04], bob: Math.sin(t * 2) * 0.15}),
  hold: (t) => ({...ZERO, rArm: [0.55, 0.05], lArm: [Math.sin(t * 2) * 0.05, -0.05], bob: Math.sin(t * 2) * 0.12}),
  walk: (t) => {
    const s = Math.sin(t * 7);
    return {...ZERO, rArm: [s * 0.6, 0.03], lArm: [-s * 0.6, -0.03], rLeg: -s * 0.6, lLeg: s * 0.6, bob: Math.abs(Math.cos(t * 7)) * 0.4};
  },
  run: (t) => {
    const s = Math.sin(t * 12);
    return {
      ...ZERO,
      head: [0.1, 0],
      body: 0.22,
      rArm: [s * 1.2, 0.08],
      lArm: [-s * 1.2, -0.08],
      rLeg: -s * 1.1,
      lLeg: s * 1.1,
      bob: Math.abs(Math.cos(t * 12)) * 1.2,
    };
  },
  // Arm x angle: 0 = hanging, +PI/2 = pointing at camera, PI = straight up, >PI = up and behind.
  wave: (t) => ({...ZERO, rArm: [Math.PI + 0.15, 0.25 + Math.sin(t * 9) * 0.3], lArm: [0, -0.05]}),
  swing: (t) => {
    // Wind up overhead, slash down to the front, recover.
    const p = (t * 1.4) % 1;
    const a = p < 0.35 ? 0.6 + 2.6 * EASE_IO(p / 0.35) : p < 0.5 ? 3.2 - 2.9 * ((p - 0.35) / 0.15) : 0.3 + 0.3 * ((p - 0.5) / 0.5);
    return {...ZERO, head: [0.05, 0], body: 0.08, rArm: [a, 0.1], lArm: [0.3, -0.1]};
  },
  cheer: (t) => {
    const j = Math.abs(Math.sin(t * 5));
    return {...ZERO, head: [-0.2, 0], rArm: [Math.PI + 0.35, 0.35], lArm: [Math.PI + 0.35, -0.35], bob: j * 3};
  },
};

/** Builds a flat item mesh from a 16x16 sprite, attached to the right hand. */
const makeHeldItem = (img: HTMLImageElement) => {
  const texture = new THREE.Texture(img);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), mat);
  // Plane in the arm's YZ plane: sprite right -> forward (+z), sprite up -> up.
  // Item sprites run handle (bottom-left) to tip (top-right), so the blade points forward-up
  // at 45 degrees like the vanilla third-person hold. Offset so the handle sits in the fist.
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(0, 3.6, 3.6);
  const grip = new THREE.Group();
  grip.position.set(-1, -9.5, 0.5);
  grip.rotation.x = 0.6; // tilt the blade forward, away from the face
  grip.add(mesh);
  return grip;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });

export const Player3D: FC<{
  width: number;
  height: number;
  skin?: string; // texture path under mc/textures, default Steve
  slim?: boolean;
  pose?: PoseName;
  /** Seconds offset for the pose clock, so two players don't move in sync. */
  timeOffset?: number;
  /** Speed multiplier for the pose clock. */
  speed?: number;
  /** Yaw in degrees (0 = facing camera, 90 = facing right of screen). */
  yaw?: number;
  pitch?: number;
  zoom?: number;
  heldItem?: string; // item id, e.g. 'netherite_sword'
  style?: CSSProperties;
}> = ({width, height, skin = 'entity/player/wide/steve.png', slim = false, pose = 'idle', timeOffset = 0, speed = 1, yaw = 30, pitch = 8, zoom = 0.85, heldItem, style}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading player skin'));

  // Applies the pose for the current props and draws synchronously.
  const draw = () => {
    const v = viewerRef.current;
    if (!v) return;
    const t = (frame / FPS) * speed + timeOffset;
    const j = POSES[pose](t);
    const s = v.playerObject.skin;
    s.head.rotation.set(j.head[0], j.head[1], 0);
    v.playerObject.rotation.x = j.body;
    s.rightArm.rotation.set(-j.rArm[0], 0, j.rArm[1]);
    s.leftArm.rotation.set(-j.lArm[0], 0, j.lArm[1]);
    s.rightLeg.rotation.x = -j.rLeg;
    s.leftLeg.rotation.x = -j.lLeg;
    v.playerObject.position.y = j.bob;
    v.playerWrapper.rotation.y = (yaw * Math.PI) / 180;
    v.playerWrapper.rotation.x = (pitch * Math.PI) / 180;
    v.zoom = zoom;
    v.render();
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const viewer = new SkinViewer({
      canvas,
      width,
      height,
      preserveDrawingBuffer: true,
      renderPaused: true,
      enableControls: false,
      fov: 40,
      zoom,
    });
    viewer.globalLight.intensity = 2.2;
    viewer.cameraLight.intensity = 2.6;
    viewerRef.current = viewer;
    (async () => {
      await viewer.loadSkin(tex(skin), {model: slim ? 'slim' : 'default'});
      if (heldItem) {
        if (resolveItem(heldItem).kind !== 'sprite') throw new Error(`Player3D heldItem "${heldItem}" is a block; only flat items can be held for now.`);
        viewer.playerObject.skin.rightArm.add(makeHeldItem(await loadImage(item(heldItem))));
      }
      drawRef.current();
      setReady(true);
      continueRender(handle);
    })().catch((err) => cancelRender(err));
    return () => viewer.dispose();
    // The viewer is created once; props that change per frame are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (ready) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, ready, pose, speed, timeOffset, yaw, pitch, zoom]);

  return <canvas ref={canvasRef} width={width} height={height} style={{width, height, display: 'block', ...style}} />;
};
