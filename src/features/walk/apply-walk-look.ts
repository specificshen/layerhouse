import * as THREE from "three";
import type { Session } from "../../app/session";

export function applyWalkLook(s: Session) {
  const cy = Math.cos(s.walk.pitch);
  const dx = Math.sin(s.walk.yaw) * cy;
  const dy = Math.sin(s.walk.pitch);
  const dz = -Math.cos(s.walk.yaw) * cy;
  s.camera.lookAt(s.camera.position.x + dx, s.camera.position.y + dy, s.camera.position.z + dz);
  s.orbit.target.copy(s.camera.position).add(new THREE.Vector3(dx, dy, dz).multiplyScalar(4));
}
