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

out vec4 fragColor;

void main(void) {
    float d =  texture(noiseTexture, vUV).x * 0.5 + 0.2;
    // float d =  1.0;float d =  texture(noiseTexture, vUV).x;

    float theta_L = dot(vObjSpaceLightDir, vNormal) * 0.5 * d; //0~0.5
    float phi_L = (dot(vObjSpaceLightDir, vTangent) + 1.0) * 0.5 * d; //-1~1

    float theta_E = ((1.0 - dot(vObjSpaceViewDir, vNormal)) * 0.5 + 0.5) * d; //0.5~1.0
    float phi_E = (dot(vObjSpaceViewDir, vTangent) + 1.0) * 0.5 * d; //-1~1

    float u = texture(eyeLighPathTexture, vec2(theta_L, phi_L)).x;
    float v = texture(eyeLighPathTexture, vec2(theta_E, phi_E)).x;

    // vec4 col1 = vec4(0.5, 0.5, 0.5, 1.0);
    vec4 col = texture(bubbleColorTexture, vec2(u,v));
    vec4 c = vec4(col.xyz, 0.20);

    //フレネス
    float rim = 1.0 - abs(dot(vWorldNormal, vCameraDirection));
    vec3 rimCol = vec3(1.0, 1.0, 1.0) * pow(rim, 8.0);// * 0.8;
    c += vec4(rimCol, 0.0);

    //スペキュラ
    vec3 lightDir = normalize(lightPosition - vPositionW);
    vec3 viewDir = normalize(vCameraDirection);
    vec3 halfwayDir = normalize(lightDir + viewDir);  
    float spec = pow(max(dot(vWorldNormal, halfwayDir), 0.0), 50.0);
    vec3 specular = spec * vec3(1.0);

    //フレネス値とカラーを乗算
    c.a *= rim;
    c += vec4(specular, spec);

    //環境マップの反射
    vec3 reflectedDir = reflect(normalize(vPosition), vNormal);
    vec3 color = texture(cubeMap, reflectedDir).xyz;
    c += vec4(color, 0.0);

    fragColor = c;//vec4(col.xyz, 0.3);//vec4(vNormal, 1.0);
}
