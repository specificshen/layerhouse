import * as THREE from "three";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

export function buildNeighbors(
  _scene: THREE.Scene,
  mats: Materials,
  rec: HouseRecord,
): THREE.Group {
  const g = new THREE.Group();
  g.name = "neighbors";
  // North across the canal
  neighbor(g, mats, -18, -28, 0.2, 12, 9, 5.2, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 4, -32, -0.1, 11, 10, 4.8, mats.neighborB, mats.neighborRoofB, "hip");
  neighbor(g, mats, 24, -26, 0.4, 13, 9, 5.0, mats.neighborC, mats.neighborRoof, "gable");
  // East
  neighbor(g, mats, 24, 2, -0.6, 11, 9, 4.6, mats.neighborB, mats.neighborRoof, "shed");
  neighbor(g, mats, 27, 16, 0.3, 10, 8, 4.4, mats.neighborA, mats.neighborRoofB, "gable");
  // West
  neighbor(g, mats, -24, 3, 0.5, 12, 9, 4.7, mats.neighborC, mats.neighborRoof, "gable");
  neighbor(g, mats, -26, 18, -0.2, 10, 8, 4.3, mats.neighborB, mats.neighborRoofB, "hip");
  // South across the street
  neighbor(g, mats, -8, 26, Math.PI, 12, 9, 4.5, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 10, 28, Math.PI + 0.1, 11, 9, 4.4, mats.neighborC, mats.neighborRoofB, "shed");

  // far land masses / simple green banks
  const far = new THREE.Mesh(new THREE.BoxGeometry(80, 1.2, 24), mats.grass);
  far.position.set(-10, 0.2, -48);
  far.receiveShadow = true;
  far.castShadow = false;
  g.add(far);

  rec.neighbors = g;
  return g;
}

function neighbor(
  parent: THREE.Object3D,
  _mats: Materials,
  x: number,
  z: number,
  rotY: number,
  w: number,
  d: number,
  h: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  kind: string,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  addBox(g, w + 0.12, 0.28, d + 0.12, 0, 0.14, 0, _mats.plinth, null, {});
  addBox(g, w, h, d, 0, h / 2 + 0.1, 0, wallMat, null, {});
  const frame = _mats.frame;
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x6a7380,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0xffc080,
    emissiveIntensity: 0,
  });
  const wins = [];
  const nw = 3;
  for (let i = 0; i < nw; i++) {
    const px = -w / 2 + 1.6 + i * ((w - 3.2) / Math.max(1, nw - 1));
    const pane = addBox(g, 0.78, 1.05, 0.04, px, 1.7, d / 2 + 0.04, winMat, null, {
      noShadow: true,
    });
    addBox(g, 0.9, 1.18, 0.05, px, 1.7, d / 2 + 0.02, frame, null, { noCast: true });
    wins.push(pane);
    if (h > 4.2) {
      const pane2 = addBox(g, 0.78, 0.86, 0.04, px, 3.55, d / 2 + 0.04, winMat, null, {
        noShadow: true,
      });
      addBox(g, 0.9, 0.98, 0.05, px, 3.55, d / 2 + 0.02, frame, null, { noCast: true });
      wins.push(pane2);
    }
  }
  addBox(g, 0.9, 2.05, 0.06, 0, 1.15, d / 2 + 0.03, _mats.woodDark, null, {});
  addBox(g, 1.4, 0.08, 0.7, 0, 0.06, d / 2 + 0.35, _mats.concrete, null, { noCast: true });
  addBox(g, 2.4, 0.05, 1.15, 0, 2.42, d / 2 + 0.5, roofMat, null, {});
  addCyl(g, 0.05, 2.4, -0.95, 1.2, d / 2 + 0.85, _mats.steel);
  addCyl(g, 0.05, 2.4, 0.95, 1.2, d / 2 + 0.85, _mats.steel);
  addBox(g, w + 0.08, 0.07, d + 0.08, 0, h * 0.46, 0, _mats.plinth, null, { noCast: true });
  addBox(g, 0.46, 1.15, 0.46, w * 0.28, h + 0.55, -d * 0.12, _mats.plinth, null, {});
  for (let i = 0; i < nw; i++) {
    const px = -w / 2 + 1.6 + i * ((w - 3.2) / Math.max(1, nw - 1));
    addBox(g, 0.03, 1.05, 0.02, px, 1.7, d / 2 + 0.07, frame, null, { noCast: true });
    addBox(g, 0.78, 0.03, 0.02, px, 1.7, d / 2 + 0.07, frame, null, { noCast: true });
  }
  g.userData.windows = wins;
  g.userData.winMat = winMat;

  if (kind === "gable") {
    const pitch = 0.45;
    const half = d / 2 + 0.3;
    const slope = half / Math.cos(pitch);
    const ridgeY = h + Math.tan(pitch) * half;
    for (const sign of [-1, 1]) {
      const p = addBox(
        g,
        w + 0.5,
        0.12,
        slope,
        0,
        (h + ridgeY) / 2,
        (sign * half) / 2,
        roofMat,
        null,
        {},
      );
      p.rotation.x = -sign * pitch;
    }
  } else if (kind === "hip") {
    addBox(g, w + 0.4, 0.5, d + 0.4, 0, h + 0.15, 0, roofMat, null, {});
    addBox(g, w * 0.55, 0.7, d * 0.55, 0, h + 0.7, 0, roofMat, null, {});
  } else {
    const p = addBox(g, w + 0.4, 0.12, d + 0.5, 0, h + 0.35, -0.1, roofMat, null, {});
    p.rotation.x = 0.18;
  }
  parent.add(g);
}

export function setNeighborGlow(neighbors: THREE.Object3D, amount: number) {
  if (!neighbors) return;
  neighbors.traverse((o) => {
    if (o.userData && o.userData.winMat) {
      o.userData.winMat.emissiveIntensity = amount * 0.7;
    }
  });
}
