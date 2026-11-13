import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { TOD } from "@/config";
import { dusk } from "@/config/time/dusk";
import { createDuskLights } from "@/world/lighting";

describe("dusk lighting", () => {
  test("the dusk recipe is the single object on TOD", () => {
    expect(TOD.dusk).toBe(dusk);
  });

  test("startup lights copy the dusk recipe", () => {
    const scene = new THREE.Scene();
    const { hemi, amb, sun, fill } = createDuskLights(scene);
    expect(hemi.color.getHex()).toBe(dusk.hemiSky);
    expect(hemi.groundColor.getHex()).toBe(dusk.hemiGround);
    expect(hemi.intensity).toBe(dusk.hemi);
    expect(amb.color.getHex()).toBe(dusk.amb);
    expect(amb.intensity).toBe(dusk.ambInt);
    expect(sun.color.getHex()).toBe(dusk.sunColorDir);
    expect(sun.intensity).toBe(dusk.sunInt);
    expect(fill.color.getHex()).toBe(dusk.fillColor);
    expect(fill.intensity).toBe(dusk.fillInt);
    expect(fill.position.x).toBe(8);
    expect(fill.position.y).toBe(10);
    expect(fill.position.z).toBe(-14);
    const fog = scene.fog;
    expect(fog).toBeInstanceOf(THREE.FogExp2);
    if (!(fog instanceof THREE.FogExp2)) return;
    expect(fog.color.getHex()).toBe(dusk.fog);
    expect(fog.density).toBe(0.018);
    expect(sun.castShadow).toBe(true);
    expect(sun.shadow.mapSize.x).toBe(2048);
    expect(sun.shadow.bias).toBe(-0.00025);
    expect(sun.target.position.z).toBe(-1);
  });
});
