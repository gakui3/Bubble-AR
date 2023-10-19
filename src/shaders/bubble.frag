#version 300 es

precision highp float;

in vec2 vUV;
in vec3 vNormal;
in vec3 vWorldNormal;
in vec3 vLightDirection;
in vec3 vTangent;
in vec3 vCameraDirection;
in vec3 vPosition;
in vec3 vPositionW;

in vec3 vObjSpaceViewDir;
in vec3 vObjSpaceLightDir;

uniform sampler2D eyeLighPathTexture;
uniform sampler2D bubbleColorTexture;
uniform sampler2D noiseTexture;
uniform sampler2D envTexture;
uniform samplerCube cubeMap;
uniform vec3 lightPosition;

//params
uniform float refrectionStrength;
uniform float hilightStrength;
uniform float hilightScale;
uniform float colorSaturation;
uniform float colorAlpha;
uniform float fresnelStrength;
uniform float fresnelScale;

out vec4 fragColor;

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

    // float d =  texture(noiseTexture, vUV).x * 0.5 + 0.1;
    // float d =  1.0;float d =  texture(noiseTexture, vUV).x;
    float d = noise(vPosition.xyz);

    float theta_L = dot(vObjSpaceLightDir, vWorldNormal) * 0.5 * d; //0~0.5
    float phi_L = (dot(vObjSpaceLightDir, vTangent) + 1.0) * 0.5 * d; //-1~1

    float theta_E = ((1.0 - dot(vObjSpaceViewDir, vWorldNormal)) * 0.5 + 0.5) * d; //0.5~1.0
    float phi_E = (dot(vObjSpaceViewDir, vTangent) + 1.0) * 0.5 * d; //-1~1

    float u = texture(eyeLighPathTexture, vec2(theta_L, phi_L)).x;
    float v = texture(eyeLighPathTexture, vec2(theta_E, phi_E)).x;

    vec4 col = texture(bubbleColorTexture, vec2(u,v));
    // vec4 c = vec4(col.xyz*colorSaturation, colorAlpha);
    vec4 c = vec4(col.xyz * colorSaturation,  1.0);

    //カラーフレネル
    float rim = pow(1.0 - abs(dot(vWorldNormal, vCameraDirection)), 3.0);
    vec3 rimCol = vec3(1.0, 1.0, 1.0) * pow(rim, 8.0);
    c = vec4(rimCol, colorAlpha);
    // c.a *= rim;

    //フレネル
    float rim1 = pow(1.0 - abs(dot(vWorldNormal, vCameraDirection)), fresnelScale);
    vec3 rimCol1 = vec3(1.0, 1.0, 1.0) * pow(rim1, fresnelStrength);
    c += vec4(rimCol1, rim1);
    // c.a *= rim;

    //スペキュラ
    vec3 lightDir = normalize(lightPosition - vPositionW);
    vec3 viewDir = normalize(vCameraDirection);
    // vec3 halfwayDir = normalize(lightDir + viewDir);  
    vec3 halfwayDir = reflect(lightDir, vWorldNormal);
    float spec = pow(max(abs(dot(vWorldNormal, halfwayDir)), 0.0), hilightScale);
    float result = step(0.2, spec) * spec;
    vec3 specular = result * vec3(1.0);
    c += vec4(specular, result * hilightStrength);

    //環境マップの反射
    vec3 reflectedDir = reflect(normalize(vPosition), vNormal);
    vec3 color = texture(cubeMap, reflectedDir).xyz;
    c += vec4(color, refrectionStrength);

    fragColor = c;//vec4(col.xyz, 0.3);//vec4(vNormal, 1.0);
}
