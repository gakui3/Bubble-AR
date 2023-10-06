import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

// import "@babylonjs/loaders/glTF";
import BubbleVert from "./shaders/bubble.vert?raw";
import BubbleFrag from "./shaders/bubble.frag?raw";
import eyeLighPathTextureUrl from "/textures/EyeLightPath.png";
import bubbleColorTextureUrl from "/textures/Bubble.png";
import envTextureUrl from "/textures/env.jpg";
import bubbleModelUrl from "/models/uvSphere.glb";
// import cubeTextureUrl from "/cubeTexture/?url";
import nx from "/cubeTexture/_nx.jpg";
import ny from "/cubeTexture/_ny.jpg";
import nz from "/cubeTexture/_nz.jpg";
import px from "/cubeTexture/_px.jpg";
import py from "/cubeTexture/_py.jpg";
import pz from "/cubeTexture/_pz.jpg";

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
  noiseTexture.persistence = 0.46;
  noiseTexture.animationSpeedFactor = 0.2;

  const vertexNoiseTexture = new BABYLON.NoiseProceduralTexture(
    "perlin",
    256,
    scene
  );
  vertexNoiseTexture.octaves = 3;
  vertexNoiseTexture.persistence = 1.0;
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
  // const cubeTexture = new BABYLON.CubeTexture(cubeTextureUrl, scene); /cubeTexture/
  const cubeTexture = new BABYLON.CubeTexture("/Bubble-AR/cubeTexture/", scene);

  const material = new BABYLON.StandardMaterial("test", scene);
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

  //particleの準備
  const sps = new BABYLON.SolidParticleSystem("SPS", scene, {
    useModelMaterial: true,
  });
  sps.addShape(bubble.meshes[1], 50);
  // sps.position = new BABYLON.Vector3(0, 1, 3);
  // sps.scaling = new BABYLON.Vector3(5, 5, 5);

  //SPSの設定
  sps.buildMesh();
  sps.mesh.hasVertexAlpha = true;

  scene.registerBeforeRender(function () {
    sps.setParticles();
  });

  sps.recycleParticle = function (particle) {
    particle.position.x = (Math.random() - 0.5) * 10;
    particle.position.y = -5;
    particle.position.z = Math.random() * 3 + 3;

    particle.velocity.x = (Math.random() - 0.5) * 0.06;
    particle.velocity.y = (Math.random() + 0.5) * 0.05;
    particle.velocity.z = (Math.random() - 0.5) * 0.06;

    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;

    const s = BABYLON.Scalar.RandomRange(0.5, 1.0);
    particle.scaling = new BABYLON.Vector3(s, s, s);
  };

  sps.updateParticle = function (particle) {
    if (particle.position.y > 20) {
      sps.recycleParticle(particle);
    }

    particle.position.addInPlace(particle.velocity);
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
