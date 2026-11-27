#version 450
#extension GL_GOOGLE_include_directive : require

// Full range YCbCr 4:2:0 in separate Y, Cb and Cr planes, as PyroWave decodes it
layout(set = 0, binding = 0) uniform sampler2D uPlanes[3];

#include "video_common.glsl"

layout(location = 0) in vec2 vUv;
layout(location = 0) out vec4 outColor;

vec3 planarRgb(vec2 uv) {
    float y = texture(uPlanes[0], uv).r;

    // The host sites chroma with the left luma sample of each pair, not between them
    vec2 chromaUv = uv + vec2(pc.ycbcr.w, 0.0);
    float cb = texture(uPlanes[1], chromaUv).r - pc.ycbcr.z;
    float cr = texture(uPlanes[2], chromaUv).r - pc.ycbcr.z;

    float kr = pc.ycbcr.x;
    float kb = pc.ycbcr.y;
    float r = y + 2.0 * (1.0 - kr) * cr;
    float b = y + 2.0 * (1.0 - kb) * cb;
    float g = (y - kr * r - kb * b) / (1.0 - kr - kb);
    return vec3(r, g, b);
}

void main() {
    vec2 uv = clamp(vUv, pc.uvClamp.xy, pc.uvClamp.zw);
    vec3 color = planarRgb(uv);
    if (pc.params3.x > 0.0) {
        // One source texel in each direction, staying inside the crop so the
        // samples never pull in decoder padding.
        vec2 t = pc.params3.yz;
        vec3 b = planarRgb(clamp(uv + vec2(0.0, -t.y), pc.uvClamp.xy, pc.uvClamp.zw));
        vec3 d = planarRgb(clamp(uv + vec2(-t.x, 0.0), pc.uvClamp.xy, pc.uvClamp.zw));
        vec3 f = planarRgb(clamp(uv + vec2(t.x, 0.0), pc.uvClamp.xy, pc.uvClamp.zw));
        vec3 h = planarRgb(clamp(uv + vec2(0.0, t.y), pc.uvClamp.xy, pc.uvClamp.zw));
        color = rcasSharpen(b, d, color, f, h, pc.params3.x);
    }
    outColor = outputColor(color);
}
