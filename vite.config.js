import basicSsl from "@vitejs/plugin-basic-ssl";

module.exports = {
  plugins: [basicSsl()],
  server: {
    https: true,
  },
  preview: {
    https: true,
  },
  assetsInclude: [
    "**/*.glb",
    "**/*.gltf",
    "**/*.fbx",
    "**/*.mp4",
    "**/*.webp",
    "**/*.png",
    "**/*.jpg",
  ],
  build: {
    rollupOptions: {
      external: ["/cubeTexture/?url"],
    },
    outDir: "docs",
  },
  base: "/Bubble-AR/",
};
