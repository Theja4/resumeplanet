'use client'

/**
 * AuroraShader
 * ────────────────────────────────────────────────────────────────────
 * A self-contained, theme-aware WebGL fragment shader that paints a
 * slow-flowing simplex-noise aurora into its parent container.
 *
 * Designed to be a quiet premium texture (Linear / Vercel feel), not
 * a screensaver. Pairs with the .landing-aurora-fallback CSS gradient
 * so the box looks correct on:
 *   - SSR (initial paint shows the gradient, canvas overpaints later)
 *   - prefers-reduced-motion (canvas not rendered, gradient stays)
 *   - browsers without WebGL (canvas not rendered, gradient stays)
 *   - off-screen (RAF paused via IntersectionObserver)
 *
 * Theme support: by default reads CSS custom properties --aurora-bg /
 * --aurora-c1..c3 / --aurora-intensity from :root, and re-reads them
 * whenever the <html> class list changes (so flipping `dark` later
 * just works). Pass `palette="dark"` or a custom palette to override.
 *
 * Cost: ~3KB gz, one WebGL context, single fullscreen triangle. No
 * three.js / r3f.
 */

import { useEffect, useRef, useState } from 'react'

type Triplet = [number, number, number]

interface Palette {
  /** RGB 0..1 */
  bg: Triplet
  c1: Triplet
  c2: Triplet
  c3: Triplet
  /** 0..1 mix amount; higher = more saturated */
  intensity: number
}

interface Props {
  className?: string
  /** Animation speed multiplier. 0 = static. Default 0.06 (very slow). */
  speed?: number
  /** Brightness multiplier on top of palette intensity. Default 1. */
  intensity?: number
  /**
   * Force the static CSS gradient fallback (skips WebGL entirely).
   * Useful for testing.
   */
  staticOnly?: boolean
  /**
   * Color source.
   *  - 'auto' (default): read from CSS vars on :root, react to theme
   *  - 'light' / 'dark': use a built-in palette regardless of theme
   *  - Palette object: fully custom
   */
  palette?: 'auto' | 'light' | 'dark' | Palette
}

const VERTEX_SRC = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// 2D simplex noise (Ashima / Stefan Gustavson, public domain)
const FRAGMENT_SRC = /* glsl */ `
  precision mediump float;
  uniform vec2  u_resolution;
  uniform float u_time;
  uniform vec3  u_bg;
  uniform vec3  u_c1;
  uniform vec3  u_c2;
  uniform vec3  u_c3;
  uniform float u_intensity;
  uniform float u_speed;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p  = uv;
    p.x *= u_resolution.x / u_resolution.y; // keep noise round-ish
    float t = u_time * u_speed;

    // Three layered noise fields drifting at different scales/speeds
    float n1 = snoise(p * 1.20 + vec2( t * 0.60,  t * 0.40));
    float n2 = snoise(p * 1.85 + vec2(-t * 0.50,  t * 0.70) + 12.3);
    float n3 = snoise(p * 0.70 + vec2( t * 0.30, -t * 0.50) + 47.1);

    vec3 col = u_bg;
    col = mix(col, u_c1, smoothstep(-0.40, 0.70, n1) * u_intensity);
    col = mix(col, u_c2, smoothstep(-0.30, 0.60, n2) * u_intensity * 0.80);
    col = mix(col, u_c3, smoothstep(-0.50, 0.50, n3) * u_intensity * 0.55);

    // Soft vignette toward bg at the edges
    float vig = smoothstep(1.10, 0.30, length(uv - 0.5));
    col = mix(u_bg, col, mix(0.55, 1.0, vig));

    gl_FragColor = vec4(col, 1.0);
  }
`

const PRESETS: Record<'light' | 'dark', Palette> = {
  light: {
    bg: [0.988, 0.992, 0.988],
    c1: [0.525, 0.937, 0.675], // emerald  #86EFAC
    c2: [0.490, 0.827, 0.988], // sky      #7DD3FC
    c3: [0.769, 0.710, 0.992], // violet   #C4B5FD
    intensity: 0.78,
  },
  dark: {
    bg: [0.039, 0.039, 0.039],
    c1: [0.133, 0.773, 0.369], // green #22C55E
    c2: [0.220, 0.741, 0.973], // sky   #38BDF8
    c3: [0.659, 0.333, 0.969], // violet #A855F7
    intensity: 0.65,
  },
}

function readCssPalette(): Palette | null {
  if (typeof window === 'undefined') return null
  const styles = getComputedStyle(document.documentElement)
  const parseTriplet = (name: string, fallback: Triplet): Triplet => {
    const raw = styles.getPropertyValue(name).trim()
    if (!raw) return fallback
    const parts = raw.split(',').map((s) => parseFloat(s.trim()) / 255)
    if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) return fallback
    return parts as Triplet
  }
  const intensityRaw = parseFloat(styles.getPropertyValue('--aurora-intensity').trim())
  return {
    bg: parseTriplet('--aurora-bg', PRESETS.light.bg),
    c1: parseTriplet('--aurora-c1', PRESETS.light.c1),
    c2: parseTriplet('--aurora-c2', PRESETS.light.c2),
    c3: parseTriplet('--aurora-c3', PRESETS.light.c3),
    intensity: Number.isFinite(intensityRaw) ? intensityRaw : PRESETS.light.intensity,
  }
}

function resolvePalette(source: Props['palette']): Palette {
  if (!source || source === 'auto') {
    return readCssPalette() ?? PRESETS.light
  }
  if (source === 'light' || source === 'dark') return PRESETS[source]
  return source
}

export default function AuroraShader({
  className = '',
  speed = 0.06,
  intensity = 1,
  staticOnly = false,
  palette = 'auto',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [skipCanvas, setSkipCanvas] = useState(false)

  useEffect(() => {
    if (staticOnly) {
      setSkipCanvas(true)
      return
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setSkipCanvas(true)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) {
      setSkipCanvas(true)
      return
    }

    // ── Compile + link
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh)
        return null
      }
      return sh
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC)
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC)
    if (!vs || !fs) {
      setSkipCanvas(true)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      setSkipCanvas(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setSkipCanvas(true)
      return
    }
    gl.useProgram(program)

    // Single fullscreen triangle (more efficient than two)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uBg = gl.getUniformLocation(program, 'u_bg')
    const uC1 = gl.getUniformLocation(program, 'u_c1')
    const uC2 = gl.getUniformLocation(program, 'u_c2')
    const uC3 = gl.getUniformLocation(program, 'u_c3')
    const uIntensity = gl.getUniformLocation(program, 'u_intensity')
    const uSpeed = gl.getUniformLocation(program, 'u_speed')

    const applyPalette = () => {
      const p = resolvePalette(palette)
      gl.uniform3f(uBg, ...p.bg)
      gl.uniform3f(uC1, ...p.c1)
      gl.uniform3f(uC2, ...p.c2)
      gl.uniform3f(uC3, ...p.c3)
      gl.uniform1f(uIntensity, p.intensity * intensity)
      gl.uniform1f(uSpeed, speed)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // cap DPR for perf
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uRes, w, h)
    }

    applyPalette()
    resize()

    // Pause when off-screen
    let visible = true
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry?.isIntersecting ?? true
            },
            { rootMargin: '120px' },
          )
        : null
    io?.observe(canvas)

    // React to theme flip on <html>
    const mo =
      palette === 'auto'
        ? new MutationObserver(() => applyPalette())
        : null
    mo?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    let running = true
    const start = performance.now()
    let raf = 0
    const tick = () => {
      if (!running) return
      if (visible) {
        gl.uniform1f(uTime, (performance.now() - start) / 1000)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      io?.disconnect()
      mo?.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      const lose = gl.getExtension('WEBGL_lose_context')
      lose?.loseContext()
    }
  }, [speed, intensity, staticOnly, palette])

  return (
    <div
      className={`landing-aurora-shell ${className}`}
      aria-hidden="true"
    >
      {!skipCanvas && (
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      )}
    </div>
  )
}
