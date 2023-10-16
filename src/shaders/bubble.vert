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

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

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
    float d = noise(vec3(position.x*5.0, position.y*5.0, position.z*5.0));
    vec3 v = vNormal * d * 0.05 + 0.25;
    vec3 p = position + v;
    gl_Position = worldViewProjection * vec4(p, 1.0);
}