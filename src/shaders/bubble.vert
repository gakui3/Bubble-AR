#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec3 tangent;

out vec2 vUV;
out vec3 vNormal;
out vec3 vWorldNormal;
out vec3 vLightDirection;
out vec3 vTangent;
out vec3 vCameraDirection;
out vec3 vObjSpaceViewDir;
out vec3 vObjSpaceLightDir;
out vec3 vPosition;
out vec3 vPositionW;

uniform vec3 lightPosition;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform mat4 view;
uniform vec3 cameraPosition;
uniform sampler2D noiseTexture;
uniform sampler2D vertexNoiseTexture;


void main(void) {
    vec4 worldPosition = world * vec4(position, 1.0);
    vUV = uv;
    vNormal = normal;//normalize(mat3(world) * normal);
    vWorldNormal = normalize(mat3(world) * normal);
    vTangent = tangent;//normalize(mat3(world) * tangent);
    vLightDirection = normalize(lightPosition - position);
    vCameraDirection = normalize(cameraPosition - worldPosition.xyz);
    vPosition = position;
    vPositionW = worldPosition.xyz;

    //
    vec4 viewPosition = view * worldPosition;
    vec3 viewSpaceViewDir = -viewPosition.xyz;
    vObjSpaceViewDir = normalize(mat3(world) * viewSpaceViewDir);

    vec3 lightPositionObj = vec3(inverse(world) * vec4(lightPosition, 1.0)).xyz;
    vObjSpaceLightDir = normalize(position - lightPositionObj);
    //

    //頂点を法線方向にうねうねさせる
    // float d =  abs(texture(vertexNoiseTexture, vUV).x);
    // vec3 v = vNormal * d * 0.45 + 0.25;
    // vec3 p = position + v;
    // gl_Position = worldViewProjection * vec4(p, 1.0);
    gl_Position = worldViewProjection * vec4(position, 1.0);
}