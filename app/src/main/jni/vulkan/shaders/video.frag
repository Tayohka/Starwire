#version 450
#extension GL_GOOGLE_include_directive : require

// The sampler carries an immutable VkSamplerYcbcrConversion, so sampling returns
// non-linear R'G'B' in the stream's own color encoding.
layout(set = 0, binding = 0) uniform sampler2D uVideo;

#include "video_common.glsl"

layout(location = 0) in vec2 vUv;
layout(location = 0) out vec4 outColor;

void main() {
    vec2 uv = clamp(vUv, pc.uvClamp.xy, pc.uvClamp.zw);
    vec3 color = texture(uVideo, uv).rgb;
    if (pc.params3.x > 0.0) {
        // One source texel in each direction, staying inside the crop so the
        // samples never pull in decoder padding.
        vec2 t = pc.params3.yz;
        vec3 b = texture(uVideo, clamp(uv + vec2(0.0, -t.y), pc.uvClamp.xy, pc.uvClamp.zw)).rgb;
        vec3 d = texture(uVideo, clamp(uv + vec2(-t.x, 0.0), pc.uvClamp.xy, pc.uvClamp.zw)).rgb;
        vec3 f = texture(uVideo, clamp(uv + vec2(t.x, 0.0), pc.uvClamp.xy, pc.uvClamp.zw)).rgb;
        vec3 h = texture(uVideo, clamp(uv + vec2(0.0, t.y), pc.uvClamp.xy, pc.uvClamp.zw)).rgb;
        color = rcasSharpen(b, d, color, f, h, pc.params3.x);
    }
    outColor = outputColor(color);
}
