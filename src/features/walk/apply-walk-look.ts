import * as THREE from "three";
import type { Session } from "@/world/session";
import { lookDirection } from "./look";

export function applyWalkLook(s: Session) {
  const dir = lookDirection(s.walk.yaw, s.walk.pitch);
  s.camera.lookAt(
    s.camera.position.x + dir.x,
    s.camera.position.y + dir.y,
    s.camera.position.z + dir.z,
  );
  s.orbit.target
    .copy(s.camera.position)
    .add(new THREE.Vector3(dir.x, dir.y, dir.z).multiplyScalar(4));
}
