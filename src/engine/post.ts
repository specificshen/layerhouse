import type { PerspectiveCamera, Scene, WebGPURenderer } from "three/webgpu";
import { PostProcessing } from "three/webgpu";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import type BloomNode from "three/addons/tsl/display/BloomNode.js";
import type { Node } from "three/webgpu";
import {
  float,
  metalness,
  mix,
  mrt,
  normalView,
  output,
  pass,
  roughness,
  screenUV,
  vec4,
} from "three/tsl";
import { QUALITY } from "@/config";
import type { BloomState } from "@/world/session";

interface PipelineHandle {
  pipeline: PostProcessing;
  bloomNode: BloomNode;
}

export function createPipeline(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  bloomState: BloomState,
): PipelineHandle {
  const pipeline = new PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  scenePass.setMRT(
    mrt({
      output,
      normal: normalView,
      ...(QUALITY.ssr ? { metalness, roughness } : {}),
    }),
  );
  const sceneColor = scenePass.getTextureNode("output");
  const sceneDepth = scenePass.getTextureNode("depth");
  const sceneNormal = scenePass.getTextureNode("normal");

  let beauty: Node<"vec4"> = sceneColor;
  if (QUALITY.ao) {
    const aoPass = ao(sceneDepth, sceneNormal, camera);
    aoPass.resolutionScale = QUALITY.aoResolution;
    aoPass.samples.value = 10;
    aoPass.radius.value = 0.42;
    aoPass.thickness.value = 0.9;
    aoPass.scale.value = 1;
    const aoSample = aoPass.getTextureNode().sample(screenUV);
    const shade = mix(float(1), aoSample.r, float(0.62));
    beauty = vec4(sceneColor.rgb.mul(shade), sceneColor.a);
  }

  const bloomNode = bloom(sceneColor, bloomState.strength, bloomState.radius, bloomState.threshold);
  if (QUALITY.ssr) {
    const ssrPass = ssr(sceneColor, sceneDepth, sceneNormal as unknown as Node<"vec3">, {
      metalnessNode: scenePass.getTextureNode("metalness") as unknown as Node<"float">,
      roughnessNode: scenePass.getTextureNode("roughness") as unknown as Node<"float">,
      reflectNonMetals: false,
      camera,
    });
    ssrPass.resolutionScale = QUALITY.ssrResolution;
    ssrPass.quality.value = 0.32;
    ssrPass.maxDistance.value = 8;
    ssrPass.thickness.value = 0.4;
    ssrPass.intensity.value = 0.65;
    beauty = beauty.add(ssrPass);
  }
  if (QUALITY.bloom) beauty = beauty.add(bloomNode);
  pipeline.outputNode = beauty;
  return { pipeline, bloomNode };
}
