// Author: Kirell Benzi
// Title: Shapes

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define BCK 0.3

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;


float lineSegment(vec2 p, vec2 a, vec2 b, float line_weight) {
    vec2 pa = p - a;
    vec2 ba = b - a;

    line_weight = clamp(1e-5, length(ba/2.0), line_weight);
    // project PA along segment BA, normalized on BA between 0,1
    float proj = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    // minimum distance point p and its projection over segment BA bounded by BA
    // ba*proj is the foot of the perpendicular line to AB passing through p
    vec2 min_dist = pa - ba*proj;
    return 1.0 - smoothstep(0.0, line_weight, length(min_dist));
}

float rect(in vec2 st, in vec2 coord, in vec2 size, in vec2 smooth) {
    vec2 nsmooth = clamp(vec2(0.0), size / 2.0, smooth);
    vec2 bl = smoothstep(coord, coord + nsmooth, st);
    vec2 tr = smoothstep(1.0 - (coord + size), 1.0 - (coord + size) + nsmooth, 1.0 - st);

    float res = bl.x * bl.y * tr.x * tr.y;
    return res;
}

float outline_rect(in vec2 st, in vec2 coord, in vec2 size, in vec2 border_width, in vec2 smooth) {
    vec2 nsmooth = clamp(vec2(0.0), border_width / 2.0, smooth);
    float all_rect = rect(st, coord, size, nsmooth);

    float inner_rect = rect(st, coord + border_width/2., size - border_width, nsmooth);
    return all_rect - inner_rect;
}

void add_shape(inout vec3 frag, in vec3 color, float shape, bool additive) {
    if (!additive) {
	    frag = mix(frag, color, shape);
    } else {
        frag += mix(vec3(0.0), color, shape);
    }
}

void main() {
    vec3 color = vec3(BCK);
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 spincolor = vec3(st.x,st.y,abs(sin(u_time)));

    add_shape(color,
              spincolor,
              rect(st, vec2(0.270,0.220), vec2(0.5), vec2(-0.140,-0.190)),
              false);

    add_shape(color,
              spincolor,
              rect(st, vec2(0.490,0.280), vec2(0.5), vec2(-0.140,-0.190)),
              true);

    add_shape(color,
              vec3(0.0, 1.0, 0.0),
              outline_rect(st, vec2(0.190,0.420), vec2(0.5), vec2(0.1), vec2(0.0)),
              false);

    add_shape(color,
              vec3(1.0, 0., 0.),
              lineSegment(st, vec2(0.4), vec2(0.5), 0.02),
              false);

    gl_FragColor = vec4(color,1.0);
}
