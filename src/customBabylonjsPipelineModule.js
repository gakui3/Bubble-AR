import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {Noise} from "noisejs";
import GUI from "lil-gui";

// import "@babylonjs/loaders/glTF";
import BubbleVert from "./shaders/bubble.vert?raw";
import BubbleFrag from "./shaders/bubble.frag?raw";
import eyeLighPathTextureUrl from "/textures/EyeLightPath.png";
import bubbleColorTextureUrl from "/textures/02.png"; //"/textures/Bubble.png";
import envTextureUrl from "/textures/env.jpg";
import bubbleModelUrl from "/models/uvSphereRe.glb";
import cubeTextureUrl from "/cubeTexture/?url";

const mapValue = (value, oldMin, oldMax, newMin, newMax) => {
  return newMin + (newMax - newMin) * ((value - oldMin) / (oldMax - oldMin));
};

export const customBabylonjsPipelineModule = async () => {
  //setup
  const canvas = document.getElementById("camerafeed");
  const engine = new BABYLON.Engine(canvas, true /* antialias */);
  engine.enableOfflineSupport = false;

  //scene
  const scene = new BABYLON.Scene(engine);

  //camera
  const camera = new BABYLON.FreeCamera(
    "cam",
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.position = new BABYLON.Vector3(0, 1, 0);
  camera.minZ = 0.1;
  camera.maxZ = 1000;
  camera.fov = 1.0;

  var noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
  noiseTexture.octaves = 3;
  noiseTexture.persistence = 0.25;
  noiseTexture.animationSpeedFactor = 0.2;

  const vertexNoiseTexture = new BABYLON.NoiseProceduralTexture(
    "perlin",
    256,
    scene
  );
  vertexNoiseTexture.octaves = 1.0;
  vertexNoiseTexture.persistence = 0.2;
  vertexNoiseTexture.animationSpeedFactor = 1.0;

  const noise = new Noise(Math.random());

  const params = {
    myBoolean: true,
    refrectionStrength: 0.2,
    highlightStrength: 0.125,
    highlightScale: 1,
    colorScale: 6.5,
    colorStrength: 0.25,
    transparency: 0.4,
    fresnelScale: 3.0,
    fresnelStrength: 8.0,
    transformStrength: 0.5,
  };

  // camera.attachControl(canvas, true);
  // let sphere;

  // const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  const light = new BABYLON.DirectionalLight(
    "light1",
    new BABYLON.Vector3(0.2, 1, 0),
    scene
  );
  light.intensity = 1.0;
  light.position = new BABYLON.Vector3(3, 5, 2);

  //cubeTextureの読み込み
  const cubeTexture = new BABYLON.CubeTexture(cubeTextureUrl, scene);

  var shaderMaterial = new BABYLON.ShaderMaterial(
    "shaderMaterial",
    scene,
    {
      vertexSource: BubbleVert,
      fragmentSource: BubbleFrag,
    },
    {
      attributes: ["position", "uv", "normal", "tangent"],
      uniforms: [
        "worldViewProjection",
        "world",
        "view",
        "eyeLighPathTexture",
        "bubbleColorTexture",
        "lightPosition",
        "cameraPosition",
      ],
      needAlphaBlending: true,
    }
  );

  const eyeLighPathTexture = new BABYLON.Texture(eyeLighPathTextureUrl, scene);
  const bubbleColorTexture = new BABYLON.Texture(bubbleColorTextureUrl, scene);
  const envTexture = new BABYLON.Texture(envTextureUrl, scene);
  shaderMaterial.setTexture("eyeLighPathTexture", eyeLighPathTexture);
  shaderMaterial.setTexture("bubbleColorTexture", bubbleColorTexture);
  shaderMaterial.setTexture("envTexture", envTexture);
  shaderMaterial.setTexture("noiseTexture", noiseTexture);
  shaderMaterial.setTexture("vertexNoiseTexture", vertexNoiseTexture);
  shaderMaterial.setVector3("lightPosition", light.position);
  shaderMaterial.setVector3("cameraPosition", camera.position);
  shaderMaterial.setTexture("cubeMap", cubeTexture);
  shaderMaterial.backFaceCulling = false;
  shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;

  shaderMaterial.setFloat("refrectionStrength", params.refrectionStrength);
  shaderMaterial.setFloat("highlightStrength", params.highlightStrength);
  shaderMaterial.setFloat("highlightScale", params.highlightScale);
  shaderMaterial.setFloat("colorScale", params.colorScale);
  shaderMaterial.setFloat("colorStrength", params.colorStrength);
  shaderMaterial.setFloat("transparency", params.transparency);
  shaderMaterial.setFloat("fresnelScale", params.fresnelScale);
  shaderMaterial.setFloat("fresnelStrength", params.fresnelStrength);
  shaderMaterial.setFloat("transformStrength", params.transformStrength);

  //for gui
  const gui = new GUI();
  gui.add(params, "refrectionStrength", 0, 0.5).onChange((value) => {
    shaderMaterial.setFloat("refrectionStrength", value);
  });
  gui.add(params, "highlightStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("highlightStrength", value);
  });
  gui.add(params, "highlightScale", 1, 50).onChange((value) => {
    shaderMaterial.setFloat("highlightScale", value);
  });
  gui.add(params, "colorScale", 1, 10.0).onChange((value) => {
    shaderMaterial.setFloat("colorScale", value);
  });
  gui.add(params, "colorStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("colorStrength", value);
  });
  gui.add(params, "fresnelScale", 1, 10.0).onChange((value) => {
    shaderMaterial.setFloat("fresnelScale", value);
  });
  gui.add(params, "fresnelStrength", 1, 10.0).onChange((value) => {
    shaderMaterial.setFloat("fresnelStrength", value);
  });
  gui.add(params, "transparency", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transparency", value);
  });
  gui.add(params, "transformStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transformStrength", value);
  });
  //

  const folderName = bubbleModelUrl
    .split("/")
    .slice(0, -1)
    .join("/")
    .concat("/");
  const fileName = bubbleModelUrl.split("/").slice(-1)[0];

  const bubble = await BABYLON.SceneLoader.LoadAssetContainerAsync(
    folderName,
    fileName
  ).catch((error) => {
    console.error("Error loading model:", error);
  });

  bubble.meshes[1].material = shaderMaterial;

  const bubblesCount = 50;
  //particleの準備
  const sps = new BABYLON.SolidParticleSystem("SPS", scene, {
    useModelMaterial: true,
  });
  sps.addShape(bubble.meshes[1], bubblesCount);

  //SPSの設定
  sps.buildMesh();
  // sps.mesh.hasVertexAlpha = true;

  scene.registerBeforeRender(function () {
    sps.setParticles();
  });

  sps.recycleParticle = function (particle) {
    // sps.particles[p].position.x = (Math.random() - 0.5) * 2.5;
    //   sps.particles[p].position.y = (Math.random() - 0.5) * 2.5;
    //   sps.particles[p].position.z = Math.random() + 1.0;
    particle.position.x = (Math.random() - 0.5) * 2.5;
    particle.position.y = (Math.random() - 0.5) * 2.5;
    particle.position.z = Math.random() + 1.0;

    // particle.velocity.x = (Math.random() - 0.5) * 0.0005;
    particle.velocity.y = -Math.random() * 0.0015;
    // particle.velocity.z = (Math.random() - 0.5) * 0.0005;

    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;

    const s = BABYLON.Scalar.RandomRange(0.1, 0.2);
    particle.scaling = new BABYLON.Vector3(s, s, s);
  };

  let time = 0;
  sps.updateParticle = function (particle) {
    if (particle.position.y < -1.0) {
      sps.recycleParticle(particle);
    }
    particle.position.addInPlace(particle.velocity);

    //timeを更新
    time += 0.01;

    //particleのスケールを時経過間でpingpongさせる
    // const v = Math.sin(time * 0.02 + particle.idx) * 0.5 + 0.5;
    // const scale = mapValue(v, 0, 1, 0.2, 0.25);
    // particle.scaling = new BABYLON.Vector3(scale, scale, scale);

    //particleの回転を更新
    particle.rotation.x += particle.velocity.x * 10;

    //particleの速度を更新
    const value = noise.perlin2(particle.scaling.x * 50, time);
    particle.velocity.x += value * 0.03 * 0.005;
    particle.velocity.z += value * 0.03 * 0.005;
  };

  sps.initParticles = function () {
    for (let p = 0; p < sps.nbParticles; p++) {
      sps.particles[p].position.x = (Math.random() - 0.5) * 2.5;
      sps.particles[p].position.y = (Math.random() - 0.5) * 2.5;
      sps.particles[p].position.z = Math.random() + 1.0;

      const s = BABYLON.Scalar.RandomRange(0.1, 0.2);
      sps.particles[p].scaling = new BABYLON.Vector3(s, s, s);

      sps.particles[p].velocity.y = -Math.random() * 0.0015;
    }
  };
  sps.initParticles();

  //for 8thwall
  camera.addBehavior(XR8.Babylonjs.xrCameraBehavior(), true);

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());

  return {
    name: "customthreejs",
    onStart: () => {},
    onAttach: () => {},
  };
};
