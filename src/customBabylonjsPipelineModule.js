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

import avatar01Url from "/models/avatar_1_low_anim.glb";
import avatar02Url from "/models/avatar_2_low_anim.glb";
import avatar03Url from "/models/avatar_3_low_anim.glb";
import avatar04Url from "/models/avatar_4_low_anim.glb";

const mapValue = (value, oldMin, oldMax, newMin, newMax) => {
  return newMin + (newMax - newMin) * ((value - oldMin) / (oldMax - oldMin));
};

export const customBabylonjsPipelineModule = async () => {
  let time = 0;
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
    refrectionStrength: 0.29,
    highlightStrength: 0.3,
    highlightScale: 16.5,
    colorScale: 5.0,
    colorStrength: 0.23,
    transparency: 0.4,
    fresnelScale: 5.3,
    fresnelStrength: 0.25,
    transformStrength: 0.45,
    transformSpeed: 0.3,
    transformFrequency: 0.5,
    scaleRangeMin: 0.1,
    scaleRangeMax: 0.3,
    bubblesCount: 50,
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

  //ambient light
  const ambientLight = new BABYLON.HemisphericLight(
    "ambientLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

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
  shaderMaterial.setFloat("transformSpeed", params.transformSpeed);
  shaderMaterial.setFloat("transformStrength", params.transformStrength);
  shaderMaterial.setFloat("transformFrequency", params.transformFrequency);

  //for gui
  const gui = new GUI();
  gui.close();

  const shadeFolder = gui.addFolder("Shade");
  shadeFolder.add(params, "refrectionStrength", 0, 0.5).onChange((value) => {
    shaderMaterial.setFloat("refrectionStrength", value);
  });
  shadeFolder.add(params, "highlightStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("highlightStrength", value);
  });
  shadeFolder.add(params, "highlightScale", 1, 50).onChange((value) => {
    shaderMaterial.setFloat("highlightScale", value);
  });
  shadeFolder.add(params, "colorScale", 1, 10.0).onChange((value) => {
    shaderMaterial.setFloat("colorScale", value);
  });
  shadeFolder.add(params, "colorStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("colorStrength", value);
  });
  shadeFolder.add(params, "fresnelScale", 1, 10.0).onChange((value) => {
    shaderMaterial.setFloat("fresnelScale", value);
  });

  shadeFolder.add(params, "fresnelStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("fresnelStrength", value);
  });
  shadeFolder.add(params, "transparency", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transparency", value);
  });

  const shapeFolder = gui.addFolder("Shape");
  shapeFolder.add(params, "transformStrength", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transformStrength", value);
  });
  shapeFolder.add(params, "transformSpeed", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transformSpeed", value);
  });
  shapeFolder.add(params, "transformFrequency", 0, 1.0).onChange((value) => {
    shaderMaterial.setFloat("transformFrequency", value);
  });
  shapeFolder.add(params, "scaleRangeMin", 0.01, 1.0).onChange((value) => {
    params.scaleRangeMin = value;
    sps.initParticles();
  });
  shapeFolder.add(params, "scaleRangeMax", 0.01, 1.0).onChange((value) => {
    params.scaleRangeMax = value;
    sps.initParticles();
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

  //particleの準備
  let sps = new BABYLON.SolidParticleSystem("SPS", scene, {
    useModelMaterial: true,
  });
  sps.addShape(bubble.meshes[1], 50);

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
    particle.position.x = (Math.random() - 0.5) * 1.5;
    particle.position.y = Math.random() * 1.5;
    particle.position.z = Math.random() + 1.0;

    particle.velocity.x = 0; //(Math.random() - 0.5) * 0.00015;
    particle.velocity.y = BABYLON.Scalar.Clamp(
      -Math.random() * 0.0015,
      -0.0015,
      -0.0005
    );
    particle.velocity.z = 0;

    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;

    const s = BABYLON.Scalar.RandomRange(
      params.scaleRangeMin * 0.5,
      params.scaleRangeMax * 0.5
    );
    particle.scaling = new BABYLON.Vector3(s, s, s);
  };

  sps.updateParticle = function (particle) {
    if (particle.position.y < -1.0) {
      sps.recycleParticle(particle);
    }
    particle.position.addInPlace(particle.velocity);

    //timeを更新
    time += 0.01;
    shaderMaterial.setFloat("time", time);

    //particleのスケールを時経過間でpingpongさせる
    // const v = Math.sin(time * 0.02 + particle.idx) * 0.5 + 0.5;
    // const scale = mapValue(v, 0, 1, 0.2, 0.25);
    // particle.scaling = new BABYLON.Vector3(scale, scale, scale);

    //particleの回転を更新
    particle.rotation.x += particle.velocity.x * 10;

    //particleの速度を更新
    const value = noise.perlin2(particle.scaling.x * 50, time);
    particle.velocity.x += value * 0.03 * 0.0025;
    particle.velocity.z += value * 0.03 * 0.0005;
  };

  sps.initParticles = function () {
    for (let p = 0; p < sps.nbParticles; p++) {
      sps.particles[p].position.x = (Math.random() - 0.5) * 2.0;
      sps.particles[p].position.y = (Math.random() - 0.5) * 2.5;
      sps.particles[p].position.z = Math.random() + 1.0;

      const s = BABYLON.Scalar.RandomRange(
        params.scaleRangeMin * 0.5,
        params.scaleRangeMax * 0.5
      );
      sps.particles[p].scaling = new BABYLON.Vector3(s, s, s);

      sps.particles[p].velocity.y = BABYLON.Scalar.Clamp(
        -Math.random() * 0.0015,
        -0.0015,
        -0.0005
      );
    }
  };
  sps.initParticles();

  //avatarの追加
  const avatarFolderName = avatar01Url
    .split("/")
    .slice(0, -1)
    .join("/")
    .concat("/");
  const avatar01FileName = avatar01Url.split("/").slice(-1)[0];
  const avatar02FileName = avatar02Url.split("/").slice(-1)[0];
  const avatar03FileName = avatar03Url.split("/").slice(-1)[0];
  const avatar04FileName = avatar04Url.split("/").slice(-1)[0];

  BABYLON.SceneLoader.ImportMesh(
    "",
    avatarFolderName,
    avatar01FileName,
    scene,
    function (meshes) {
      meshes[0].scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      meshes[0].position = new BABYLON.Vector3(-0.35, 0, 1);
    }
  );

  BABYLON.SceneLoader.ImportMesh(
    "",
    avatarFolderName,
    avatar02FileName,
    scene,
    function (meshes) {
      meshes[0].scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      meshes[0].position = new BABYLON.Vector3(-0.15, 0, 1.25);
    }
  );

  BABYLON.SceneLoader.ImportMesh(
    "",
    avatarFolderName,
    avatar03FileName,
    scene,
    function (meshes) {
      meshes[0].scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      meshes[0].position = new BABYLON.Vector3(0.15, 0, 1.25);
    }
  );

  BABYLON.SceneLoader.ImportMesh(
    "",
    avatarFolderName,
    avatar04FileName,
    scene,
    function (meshes) {
      meshes[0].scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      meshes[0].position = new BABYLON.Vector3(0.35, 0, 1);
    }
  );

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
