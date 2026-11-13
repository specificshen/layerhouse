import * as THREE from "three";
import { EYE } from "../../config";
import { heightAt } from "../../scene/house";
import type { Session } from "../../app/session";
import { applyWalkLook } from "./apply-walk-look";
import { resolveCollision } from "./resolve-collision";

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
