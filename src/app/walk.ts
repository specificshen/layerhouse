import * as THREE from "three";
import { CAM, EYE, WATER_EDGE } from "../config";
import { heightAt } from "../scene/house";
import type { Session } from "./session";

const walkStart = CAM.walkStart;

export function enterWalk(s: Session) {
  s.walk.on = true;
  s.walk.yaw = walkStart.yaw;
  s.walk.pitch = walkStart.pitch;
  s.orbit.enabled = false;
  s.camera.position.set(
    walkStart.pos[0],
    heightAt(s.rec, walkStart.pos[0], walkStart.pos[2]) + EYE,
    walkStart.pos[2],
  );
  applyWalkLook(s);
  s.canvas.style.cursor = "grab";
}

export function exitWalk(s: Session) {
  s.walk.on = false;
  s.walk.pointer = false;
  s.orbit.enabled = true;
  s.canvas.style.cursor = "";
  if (document.pointerLockElement) document.exitPointerLock();
}

export function applyWalkLook(s: Session) {
  const cy = Math.cos(s.walk.pitch);
  const dx = Math.sin(s.walk.yaw) * cy;
  const dy = Math.sin(s.walk.pitch);
  const dz = -Math.cos(s.walk.yaw) * cy;
  s.camera.lookAt(s.camera.position.x + dx, s.camera.position.y + dy, s.camera.position.z + dz);
  s.orbit.target.copy(s.camera.position).add(new THREE.Vector3(dx, dy, dz).multiplyScalar(4));
}

function resolveCollision(s: Session, p: THREE.Vector3, r = 0.28) {
  for (const c of s.rec.collisions) {
    if (p.y + 0.4 < c.y0 || p.y - 1.2 > c.y1) continue;
    const x0 = c.x0 - r,
      x1 = c.x1 + r,
      z0 = c.z0 - r,
      z1 = c.z1 + r;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
      const l = p.x - x0,
        ri = x1 - p.x,
        bo = p.z - z0,
        t = z1 - p.z;
      const m = Math.min(l, ri, bo, t);
      if (m === l) p.x = x0;
      else if (m === ri) p.x = x1;
      else if (m === bo) p.z = z0;
      else p.z = z1;
    }
  }
  if (p.z < WATER_EDGE + 0.35) {
    const onDock = s.rec.floors.some(
      (f) => f.y > 0.2 && p.x >= f.x0 && p.x <= f.x1 && p.z >= f.z0 && p.z <= f.z1,
    );
    if (!onDock) p.z = WATER_EDGE + 0.35;
  }
}

export function toggleNearestDoor(s: Session) {
  let best: (typeof s.rec.doors)[number] | null = null;
  let bd = 2.2;
  for (const d of s.rec.doors) {
    const dist = Math.hypot(d.x - s.camera.position.x, d.z - s.camera.position.z);
    if (dist < bd && s.camera.position.y > d.y0 - 0.5 && s.camera.position.y < d.y1 + 0.8) {
      best = d;
      bd = dist;
    }
  }
  if (best) best.target = best.target > 0.5 ? 0 : 1;
}

export function updateWalk(s: Session, dt: number) {
  if (!s.walk.on) return;
  const speed = s.walk.keys.Shift ? 4.6 : 2.6;
  const fwd = new THREE.Vector3(Math.sin(s.walk.yaw), 0, -Math.cos(s.walk.yaw));
  const right = new THREE.Vector3(Math.cos(s.walk.yaw), 0, Math.sin(s.walk.yaw));
  const move = new THREE.Vector3();
  if (s.walk.keys.KeyW || s.walk.keys.ArrowUp) move.add(fwd);
  if (s.walk.keys.KeyS || s.walk.keys.ArrowDown) move.sub(fwd);
  if (s.walk.keys.KeyD || s.walk.keys.ArrowRight) move.add(right);
  if (s.walk.keys.KeyA || s.walk.keys.ArrowLeft) move.sub(right);
  if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);
  const p = s.camera.position.clone().add(move);
  resolveCollision(s, p);
  const ground = heightAt(s.rec, p.x, p.z, s.camera.position.y - EYE);
  if (s.walk.keys.Space && s.walk.grounded) {
    s.walk.vy = 4.2;
    s.walk.grounded = false;
  }
  s.walk.vy -= 14 * dt;
  let y = s.camera.position.y + s.walk.vy * dt;
  const eye = ground + EYE;
  if (y <= eye) {
    y = eye;
    s.walk.vy = 0;
    s.walk.grounded = true;
  }
  s.camera.position.set(p.x, y, p.z);
  applyWalkLook(s);
}

export function updateDoors(s: Session, dt: number) {
  for (const d of s.rec.doors) {
    d.open += (d.target - d.open) * Math.min(1, dt * 6);
    d.leaf.rotation.y = -d.open * Math.PI * 0.72 * (d.hingeSign || 1);
  }
}

export function bindWalkPointer(s: Session) {
  let draggingLook = false;
  let lx = 0;
  let ly = 0;
  s.canvas.addEventListener("mousedown", (e) => {
    if (!s.walk.on || e.button !== 0) return;
    draggingLook = true;
    lx = e.clientX;
    ly = e.clientY;
    try {
      s.canvas.requestPointerLock();
    } catch {
      /* pointer lock is optional */
    }
  });
  document.addEventListener("pointerlockchange", () => {
    s.walk.pointer = document.pointerLockElement === s.canvas;
  });
  window.addEventListener("mousemove", (e) => {
    if (!s.walk.on) return;
    let dx = 0;
    let dy = 0;
    if (s.walk.pointer) {
      dx = e.movementX;
      dy = e.movementY;
    } else if (draggingLook) {
      dx = e.clientX - lx;
      dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    } else return;
    s.walk.yaw -= dx * 0.0022;
    s.walk.pitch = Math.max(-1.2, Math.min(1.2, s.walk.pitch - dy * 0.0022));
    applyWalkLook(s);
  });
  window.addEventListener("mouseup", () => {
    draggingLook = false;
  });
}
