float sphere(vec3 p){
	return length(p) - 1.0;
}

float plane(vec3 p, vec3 n) {
	return dot(p,n);
}

vec3 normal(vec3 p) {
    float e = 0.001;
    vec3 n = vec3(0.0);
    n.x = sphere(p + vec3(e, 0, 0)) - sphere(p - vec3(e, 0, 0));
    n.y = sphere(p + vec3(0, e, 0)) - sphere(p - vec3(0, e, 0));
    n.z = sphere(p + vec3(0, 0, e)) - sphere(p - vec3(0, 0, e));
    return normalize(n);
}

vec4 shade(vec3 p, vec3 n) {
	vec3 lp = vec3(100, 100, 0);
    float NdL =  dot(lp, n);
    if(NdL > 0.0)
    	return vec4(0.7, 0.6, 0.3, 1.0) / 70.0 * dot(lp, normal(p));
    else
        return vec4(0.3, 0.2, 0.3, 1.0) / 70.0;
}

vec4 getFloorTexture(vec3 p)
{
	vec2 m = mod(p.xz, 2.0) - vec2(1.0);
	return m.x * m.y > 0.0 ? vec4(0.1) : vec4(1.0);
}

vec4 scene()
{
    vec3 eye = vec3(0, 1, iGlobalTime * 5.0);
    vec3 up = vec3(0, 1, 0);
    vec3 right = vec3(1, 0, 0);

    float u = gl_FragCoord.x * 2.0 / iResolution.x - 1.0;
    float v = gl_FragCoord.y * 2.0 / iResolution.y - 1.0;
    vec3 forward = normalize(cross(right, up));
	float aspectRatio = iResolution.x / iResolution.y;
    vec3 persp = normalize(forward * 2.0 + right * u * aspectRatio + up * v);

    vec4 sky = vec4(0.9,0.9,1.0,1.0);
    vec4 color = sky;

    float t = 0.0;
    const int maxSteps = 128;

    for(int i = 0; i < maxSteps; ++i)
    {
        vec3 p = eye + persp * t;
        float d = plane(p, up);
        if(d < 0.001)
        {
        	color = getFloorTexture(p);
            color = mix(color, sky, float(i) / float(maxSteps));
            break;
        }

        t += d;
    }

    t = 0.0;
    for(int i = 0; i < maxSteps; ++i)
    {
        vec3 p = eye + persp * t;
        p.xz = mod(p.xz, 3.0) - vec2(1.5);
        float d = sphere(p);
        if(d < 0.001)
        {
            color = shade(p, normal(p));
            color = mix(color, sky, float(i) / float(maxSteps));
            break;
        }

        t += d;
    }

    return color;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	fragColor = scene();
}
