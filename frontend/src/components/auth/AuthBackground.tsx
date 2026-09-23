import { useEffect, useRef } from 'react';

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Fallback to CSS background handled by parent
    }

    let animationFrameId: number;
    let gl: WebGLRenderingContext | null = null;
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleResize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    try {
      gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
      if (!gl) return;

      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);
      handleResize();

      const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
      const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// Smooth fluid pulse & medical aura in pure electric blue tones
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 mouse = (u_mouse - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);

    float t = u_time * 0.4;

    // Organic gentle motion
    vec2 p = uv * 2.2;
    float dist = length(uv);

    // Interactive mouse influence
    float mDist = length(uv - mouse * 0.5);
    float mouseGlow = 0.12 / (mDist + 0.35);

    // Flowing smooth wave field
    float wave1 = sin(p.x * 2.0 + t + sin(p.y * 2.5 + t * 0.8)) * 0.5 + 0.5;
    float wave2 = cos(p.y * 2.2 - t * 0.9 + cos(p.x * 1.8 - t * 0.5)) * 0.5 + 0.5;
    float flow = (wave1 + wave2) * 0.5;

    // Concentric medical telemetry pulses
    float ring1 = smoothstep(0.04, 0.0, abs(fract(dist * 2.5 - t * 0.35) - 0.5) - 0.46);
    float ring2 = smoothstep(0.06, 0.0, abs(fract(dist * 1.8 - t * 0.2) - 0.5) - 0.44);

    // Electric blue palette based on #1A5CFF
    vec3 deepNavy = vec3(0.035, 0.075, 0.22);       // #091338 deep base
    vec3 royalBlue = vec3(0.07, 0.25, 0.75);        // mid blue
    vec3 electricBlue = vec3(0.102, 0.361, 1.0);    // #1A5CFF signature electric blue
    vec3 luminousCyan = vec3(0.28, 0.68, 1.0);      // subtle highlight glow

    // Radial gradient foundation
    vec3 col = mix(electricBlue * 0.75, deepNavy, smoothstep(0.0, 1.2, dist));
    
    // Blend flowing light
    col += electricBlue * flow * 0.35;
    col += luminousCyan * (ring1 * 0.15 + ring2 * 0.1);
    col += luminousCyan * mouseGlow * 0.25;

    // Subtle clinical vignette
    col *= smoothstep(1.6, 0.4, dist);

    gl_FragColor = vec4(col, 1.0);
}`;

      const createShader = (type: number, source: string) => {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        return shader;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vs);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs);
      if (!vertexShader || !fragmentShader) return;

      const program = gl.createProgram();
      if (!program) return;
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

      const posLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLocation);
      gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

      const uTimeLocation = gl.getUniformLocation(program, 'u_time');
      const uResLocation = gl.getUniformLocation(program, 'u_resolution');
      const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');

      const render = (time: number) => {
        if (!gl) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTimeLocation) gl.uniform1f(uTimeLocation, time * 0.001);
        if (uResLocation) gl.uniform2f(uResLocation, canvas.width, canvas.height);
        if (uMouseLocation) gl.uniform2f(uMouseLocation, mouse.x, mouse.y);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ display: 'block', backgroundColor: '#000', zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
