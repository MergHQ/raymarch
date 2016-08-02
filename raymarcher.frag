precision mediump float;

uniform int u_width;
uniform int u_height;
uniform int u_time;

const int ITER = 64;
const float EPSILON = 0.01;
vec3 sky = vec3(0.0);

mat3 getXRotMat(float a)
{
    return mat3(
         1.0,  0.0,     0.0,
         0.0,  cos(a), -sin(a),
         0.0,  sin(a),  cos(a)
    );
}

float plane(vec3 p)
{
    return p.y;
}


float box(vec3 p)
{
    p -= vec3(0.7);
    p.xz = mod(p.xz, 3.0) - vec2(1.5);
    vec3 d = abs(p) - vec3(0.4);
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sphere(vec3 p)
{
    p -= vec3(0.7);
    p = mod(p, 3.0) - vec3(1.5);
    return length(p) -0.4;
}

vec2 map(vec3 p)
{
    if(plane(p) < sphere(p))
        return vec2(plane(p), 1.);
    else
        return vec2(sphere(p), 0.);
}

float scene(vec3 p)
{
    return map(p).x;
}

vec3 normal(vec3 p)
{
    float e = 0.001;
    vec3 n = vec3(0.0);
    n.x = scene(p + vec3(e, 0, 0)) - scene(p - vec3(e, 0, 0));
    n.y = scene(p + vec3(0, e, 0)) - scene(p - vec3(0, e, 0));
    n.z = scene(p + vec3(0, 0, e)) - scene(p - vec3(0, 0, e));
    return normalize(n);
}

vec4 shade(vec3 p)
{
    vec3 n = normal(p);
	vec3 lp = vec3(100, 100, 0);
    float NdL =  dot((lp - p), n);
    if(NdL > 0.0)
    	return vec4(sin(u_time) + 1.0, sin(u_time) + 1.0, cos(u_time) + 1.0, 1.0) / 100.0 * NdL;
    else
        return vec4(0.3, 0.2, 0.3, 1.0) / 70.0;
}

vec4 march(vec3 p, vec3 dir)
{
    float t = 0.0;
    bool hit = false;
    float blendFactor = 0.0;
    vec3 p0 = p;
    for(int i = 0; i < ITER; ++i)
    {
        p0 = p + dir * t;
        float d = scene(p0);
        t += d;
        if(d < EPSILON)
        {
            blendFactor = float(i);
            hit = true;
            break;
        }

    }

    if(hit)
        return vec4(p0, blendFactor);

    return vec4(0.0);
}

vec4 getFloorTexture(vec3 p)
{
	vec2 m = mod(p.xz, 2.0) - vec2(1.0);
	return m.x * m.y > 0.0 ? vec4(0.1) : vec4(1.0);
}

vec4 render(vec3 p, vec3 dir)
{
    vec3 color = sky;

    vec4 marchRes = march(p, dir);

    if(length(marchRes) == 0.0)
        return vec4(color, 1.0);

    // Base color
    if(map(marchRes.xyz).y == 0.0)
    	color = shade(marchRes.xyz).xyz;
    else
        color = getFloorTexture(marchRes.xyz).xyz * 0.3;

    // Reflections
    vec3 p0 = marchRes.xyz;
    vec3 refDir = normalize(reflect(dir, normal(p0)));
    vec4 refRes = march(p0 + refDir * EPSILON, refDir);
    if(map(refRes.xyz).y == 0.0)
    	color += shade(refRes.xyz).xyz * 0.5;
    else
        color += getFloorTexture(refRes.xyz).xyz * 0.15;

    // Basically: d/dx(e^(x/k)-1)
    float k = 15.0;
    float blendFactor = (exp(marchRes.w / k)) / k;
    color = mix(color, sky, clamp(blendFactor, 0.0, 1.0));

    return vec4(color, 1.0);
}

void main()
{
    vec2 aspect = vec2(float(u_width)/float(u_height), 1.0); //
    vec2 screenCoords = (2.0*gl_FragCoord.xy/vec2(float(u_width), float(u_height)) - 1.0)*aspect;
    vec3 eye = vec3(1.0, 1.0, -10.0);
    eye.z += float(u_time)/ 200.0;

    vec3 forward = normalize(-eye);
    vec3 right = normalize(vec3(forward.z, 0., -forward.x ));
    vec3 up = normalize(cross(forward,right));
    vec2 screenPos = (2.0*gl_FragCoord.xy-vec2(float(u_width), float(u_height)))/float(u_height);
    vec3 rayDir = normalize(vec3(screenPos*0.5, 1.0));

    gl_FragColor = render(eye, rayDir);

}
