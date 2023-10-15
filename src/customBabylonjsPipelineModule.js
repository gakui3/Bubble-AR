import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

// import "@babylonjs/loaders/glTF";
import BubbleVert from "./shaders/bubble.vert?raw";
import BubbleFrag from "./shaders/bubble.frag?raw";
import eyeLighPathTextureUrl from "/textures/EyeLightPath.png";
import bubbleColorTextureUrl from "/textures/Bubble.png";
import envTextureUrl from "/textures/env.jpg";
import bubbleModelUrl from "/models/uvSphere.glb";
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
  noiseTexture.octaves = 1;
  noiseTexture.persistence = 0.26;
  noiseTexture.animationSpeedFactor = 0.2;

  const vertexNoiseTexture = new BABYLON.NoiseProceduralTexture(
    "perlin",
    256,
    scene
  );
  vertexNoiseTexture.octaves = 1.0;
  vertexNoiseTexture.persistence = 0.2;
  vertexNoiseTexture.animationSpeedFactor = 1.0;

  // camera.attachControl(canvas, true);
  // let sphere;

  // const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  const light = new BABYLON.DirectionalLight(
    "light1",
    new BABYLON.Vector3(0.2, 1, 0),
    scene
  );
  light.intensity = 1.0;
  light.position = new BABYLON.Vector3(3, 5, 0);

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

  const folderName = bubbleModelUrl
    .split("/")
    .slice(0, -1)
    .join("/")
    .concat("/");
  const fileName = bubbleModelUrl.split("/").slice(-1)[0];
  console.log(folderName, fileName);

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
  sps.mesh.hasVertexAlpha = true;

  scene.registerBeforeRender(function () {
    sps.setParticles();
  });

  sps.recycleParticle = function (particle) {
    particle.position.x = (Math.random() - 0.5) * 5;
    particle.position.y = -5;
    particle.position.z = Math.random() + 1.0;

    particle.velocity.x = (Math.random() - 0.5) * 0.03;
    particle.velocity.y = (Math.random() + 0.5) * 0.025;
    // particle.velocity.z = (Math.random() - 0.5) * 0.06;

    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;

    const s = BABYLON.Scalar.RandomRange(0.5, 1.0);
    particle.scaling = new BABYLON.Vector3(s, s, s);
  };

  let time = 0;
  sps.updateParticle = function (particle) {
    if (particle.position.y > 10) {
      sps.recycleParticle(particle);
    }
    particle.position.addInPlace(particle.velocity);

    //timeを更新
    time += 0.01;
    //particleのスケールを時経過間でpingpongさせる
    const v = Math.sin(time * 0.05 + particle.idx) * 0.5 + 0.5;
    const scale = mapValue(v, 0, 1, 0.3, 0.6);
    particle.scaling = new BABYLON.Vector3(scale, scale, scale);
  };

  sps.initParticles = function () {
    for (let p = 0; p < sps.nbParticles; p++) {
      sps.particles[p].velocity.y = Math.random() + 0.01;
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
