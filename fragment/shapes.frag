// Author: Kirell Benzi
// Title: Shapes

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define BCK 0.036

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;


vec2 rotate2d(vec2 st, float _angle) {
    // move space from the center to the vec2(0.0)
    st -= vec2(0.5);
    // rotate
    st *= mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
    // pop
    st += vec2(0.5);
    return st;
}

vec2 scale(vec2 st, vec2 scale) {
    st -= vec2(0.5);
    st *= mat2(scale.x, 0.0,
                0.0, scale.y);
    st += vec2(0.5);
    return st;
}

vec2 tile(vec2 st, float zoom) {
    st *= zoom;
    return fract(st);
}


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

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

float outline_rect(in vec2 st, in vec2 coord, in vec2 size, in vec2 border_width, in vec2 smooth) {
    vec2 nsmooth = clamp(vec2(0.0), border_width / 2.0, smooth);
    float all_rect = rect(st, coord, size, nsmooth);

    float inner_rect = rect(st, coord + border_width/2., size - border_width, nsmooth);
    return all_rect - inner_rect;
}

float circle(in vec2 st, in vec2 center, float radius, float smooth) {
    smooth = clamp(0.0, radius, smooth);
    float s = 1.0 - smoothstep(radius - smooth, radius, distance(st, center));
    return s;
}

float gearToCircle(in vec2 st, in vec2 center, in float radius, int teeth, float teethHeight, float teethBaseCurve, float teethTopCurve, float smooth, float t, bool switchSide, inout float dir) {

    vec2 pos = center - st;

    smooth = clamp(0.0, 1.0, smooth);
    teethBaseCurve = -1.*(clamp(0.001, 5.0, teethBaseCurve)) + 1.;
    teethTopCurve = clamp(teethBaseCurve+0.01, 5., teethTopCurve);

    float x = PI*(cos(t))/2.;

    // Replace if by
    // float cond = step(1.0, float(cond == TRUE));
    // float res = mix(FALSE BLOCK, TRUE BLOCK, cond);

//     if (switchSide && x < 0.)
//     	dir *= -1.0;

    // Switch side
    float cond = step(1., float(switchSide && x < 0.));
    dir = mix(dir, -dir, cond);

    // Angle
    float a = atan(pos.y, dir*pos.x);
    // To merge from one side to the other
    x += dir * PI/2.;

    float shape = smoothstep(teethBaseCurve,
                             teethTopCurve,
                             cos(a*cos(x)*float(teeth))) * teethHeight + radius;

    float r = length(pos);
    return 1.0 - smoothstep(shape-smooth, shape+smooth, r);
}


float polyshape(vec2 st, in vec2 center, int sides, float scale, float smooth) {
    // Remap the space to -1. to 1.
	st = st *2.-1.;

    scale = clamp(0.001, 1.0, scale);
    smooth = clamp(0.001, 1.0, smooth);
    vec2 pos = st - center;
    // Angle and radius from the current pixel
    float a = atan(pos.x,pos.y)+PI;
  	float r = TWO_PI/float(sides);

  	// Shaping function that modulate the distance
  	float d = cos(floor(.5+a/r)*r-a)*length(pos);
    return 1.0 - smoothstep(scale,scale+smooth, d);
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


    float dir = 1.0;


    // st = rotate2d(st, sin(u_time/2.)*2.*PI );
    st = tile(st, 3.);


    add_shape(color, spincolor,
             gearToCircle(st, vec2(0.5), 0.340, 5, 0.080, 1.378, 1.664, 0.005, u_time/4.0, true, dir),
             false);

    dir *= -1.;
    add_shape(color, vec3(BCK),
             gearToCircle(st, vec2(0.5), 0.228, 10, 0.080, 1.458, 0.984, 0.005, u_time/4.0, true, dir),
             false);


    add_shape(color, spincolor,
             polyshape(st, vec2(0.0), 9, 0.324, 0.005),
             false);


    gl_FragColor = vec4(color,1.0);
}
