// Vertex Shader
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat3 u_transform;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    // Apply transformation matrix
    vec3 position = u_transform * vec3(a_position, 1.0);
    
    // Convert from pixels to clip space
    vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}

// Fragment Shader
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform float u_opacity;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_tint;
uniform float u_blur;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;

varying vec2 v_texCoord;

// Gaussian blur function
vec4 blur(sampler2D texture, vec2 uv, float radius) {
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    for (float x = -4.0; x <= 4.0; x += 1.0) {
        for (float y = -4.0; y <= 4.0; y += 1.0) {
            vec2 offset = vec2(x, y) * radius / u_resolution;
            float weight = exp(-(x*x + y*y) / 8.0);
            color += texture2D(texture, uv + offset) * weight;
            total += weight;
        }
    }
    
    return color / total;
}

// Color adjustment functions
vec3 adjustBrightness(vec3 color, float brightness) {
    return color + brightness;
}

vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, saturation);
}

void main() {
    vec4 texColor;
    
    if (u_blur > 0.0) {
        texColor = blur(u_texture, v_texCoord, u_blur);
    } else {
        texColor = texture2D(u_texture, v_texCoord);
    }
    
    // Apply color adjustments
    vec3 color = texColor.rgb;
    color = adjustBrightness(color, u_brightness);
    color = adjustContrast(color, u_contrast);
    color = adjustSaturation(color, u_saturation);
    
    // Apply tint
    color = mix(color, u_tint.rgb, u_tint.a);
    
    gl_FragColor = vec4(color, texColor.a * u_opacity);
}