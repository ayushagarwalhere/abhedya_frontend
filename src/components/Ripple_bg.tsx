"use client"

import { useEffect, useRef, useCallback } from "react"

interface TextConfig {
  lines: string[]
  color?: string
  fontSize?: number // px, defaults to 15% of width
  fontWeight?: string // e.g. "900", "bold"
  fontFamily?: string
  lineHeight?: number // multiplier, default 1.2
  x?: number // 0-1, default 0.5 (center)
  y?: number // 0-1, default 0.5 (center)
  align?: CanvasTextAlign
}

interface WaterRippleProps {
  imageUrl?: string
  resolution?: number
  dropRadius?: number
  perturbance?: number
  interactive?: boolean
  className?: string
  children?: React.ReactNode
  // Text rendered into the WebGL texture so ripples distort it
  text?: string
  textConfig?: TextConfig
  textColor?: string
  backgroundColor?: string
  // Rain intensity: 0 = off, 1 = default, higher = more distortion
  rainIntensity?: number
}

// WebGL config detection
function loadConfig(gl: WebGLRenderingContext) {
  const extensions: Record<string, unknown> = {}
  ;[
    "OES_texture_float",
    "OES_texture_half_float",
    "OES_texture_float_linear",
    "OES_texture_half_float_linear",
  ].forEach((name) => {
    const ext = gl.getExtension(name)
    if (ext) extensions[name] = ext
  })

  if (!extensions["OES_texture_float"]) return null

  function createConfig(
    type: string,
    glType: number,
    arrayType: typeof Float32Array | null
  ) {
    const nameLinear = `OES_texture_${type}_linear`
    const linearSupport = nameLinear in extensions
    return {
      type: glType,
      arrayType,
      linearSupport,
      extensions: linearSupport
        ? [`OES_texture_${type}`, nameLinear]
        : [`OES_texture_${type}`],
    }
  }

  const configs = [createConfig("float", gl.FLOAT, Float32Array)]
  const halfFloatExt = extensions["OES_texture_half_float"] as {
    HALF_FLOAT_OES: number
  } | null
  if (halfFloatExt) {
    configs.push(createConfig("half_float", halfFloatExt.HALF_FLOAT_OES, null))
  }

  const texture = gl.createTexture()!
  const framebuffer = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  for (const cfg of configs) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, cfg.type, null)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    )
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      return cfg
    }
  }
  return null
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader))
  }
  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string
) {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vertSrc))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Program link error: " + gl.getProgramInfoLog(prog))
  }
  // Extract uniform locations
  const locations: Record<string, WebGLUniformLocation | null> = {}
  const regex = /uniform \w+ (\w+)/g
  let match
  const combined = vertSrc + fragSrc
  while ((match = regex.exec(combined)) !== null) {
    const name = match[1]
    locations[name] = gl.getUniformLocation(prog, name)
  }
  return { id: prog, locations }
}

export default function WaterRipple({
  imageUrl,
  resolution = 512,
  dropRadius = 37,
  perturbance = 0.12,
  interactive = true,
  className = "",
  children,
  text,
  textConfig,
  textColor = "#f5f0e8",
  backgroundColor = "#1a1a2e",
  rainIntensity = 1,
}: WaterRippleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    gl: WebGLRenderingContext | null
    config: ReturnType<typeof loadConfig>
    textures: WebGLTexture[]
    framebuffers: WebGLFramebuffer[]
    backgroundTexture: WebGLTexture | null
    quad: WebGLBuffer | null
    dropProgram: ReturnType<typeof createProgram> | null
    updateProgram: ReturnType<typeof createProgram> | null
    renderProgram: ReturnType<typeof createProgram> | null
    bufferWriteIndex: number
    bufferReadIndex: number
    textureDelta: Float32Array
    backgroundWidth: number
    backgroundHeight: number
    startTime: number
    mousePosition: Float32Array
    rainInterval: ReturnType<typeof setInterval> | null
    lastMouseMove: number
    isRaining: boolean
    destroyed: boolean
    rafId: number
    // spring physics
    currentTilt: { x: number; y: number }
    targetTilt: { x: number; y: number }
    velocity: { x: number; y: number }
    lastTime: number
    springRafId: number
  }>({
    gl: null,
    config: null,
    textures: [],
    framebuffers: [],
    backgroundTexture: null,
    quad: null,
    dropProgram: null,
    updateProgram: null,
    renderProgram: null,
    bufferWriteIndex: 0,
    bufferReadIndex: 1,
    textureDelta: new Float32Array([1 / resolution, 1 / resolution]),
    backgroundWidth: 0,
    backgroundHeight: 0,
    startTime: Date.now() / 1000,
    mousePosition: new Float32Array([0.5, 0.5]),
    rainInterval: null,
    lastMouseMove: Date.now(),
    isRaining: false,
    destroyed: false,
    rafId: 0,
    currentTilt: { x: 0, y: 0 },
    targetTilt: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastTime: Date.now(),
    springRafId: 0,
  })

  const buildTextureRef = useRef<(() => void) | null>(null)

  const dropAt = useCallback(
    (x: number, y: number, radius: number, strength: number) => {
      const s = stateRef.current
      const gl = s.gl
      const canvas = canvasRef.current
      if (!gl || !canvas || !s.dropProgram) return

      const elWidth = canvas.width
      const elHeight = canvas.height
      const longestSide = Math.max(elWidth, elHeight)

      const dropPosition = new Float32Array([
        (2 * x - elWidth) / longestSide,
        (elHeight - 2 * y) / longestSide,
      ])

      gl.viewport(0, 0, resolution, resolution)
      gl.bindFramebuffer(gl.FRAMEBUFFER, s.framebuffers[s.bufferWriteIndex])
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, s.textures[s.bufferReadIndex])
      gl.useProgram(s.dropProgram.id)
      gl.uniform2fv(s.dropProgram.locations["center"], dropPosition)
      gl.uniform1f(s.dropProgram.locations["radius"], radius / longestSide)
      gl.uniform1f(s.dropProgram.locations["strength"], strength)

      gl.bindBuffer(gl.ARRAY_BUFFER, s.quad)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)

      s.bufferWriteIndex = 1 - s.bufferWriteIndex
      s.bufferReadIndex = 1 - s.bufferReadIndex
    },
    [resolution]
  )

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)
    if (!gl) {
      console.warn("WebGL not supported")
      return
    }

    const config = loadConfig(gl)
    if (!config) {
      console.warn("WebGL float textures not supported")
      return
    }

    const s = stateRef.current
    s.gl = gl
    s.config = config
    s.destroyed = false
    s.startTime = Date.now() / 1000

    // Load extensions
    config.extensions.forEach((name) => gl.getExtension(name))

    // Init render targets
    const arrayType = config.arrayType
    const textureData = arrayType
      ? new arrayType(resolution * resolution * 4)
      : null

    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture()!
      const framebuffer = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        config.linearSupport ? gl.LINEAR : gl.NEAREST
      )
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        config.linearSupport ? gl.LINEAR : gl.NEAREST
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        resolution,
        resolution,
        0,
        gl.RGBA,
        config.type,
        textureData
      )
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      )
      s.textures.push(texture)
      s.framebuffers.push(framebuffer)
    }

    // Quad buffer
    s.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, s.quad)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, +1, -1, +1, +1, -1, +1]),
      gl.STATIC_DRAW
    )
    gl.enableVertexAttribArray(0)

    // Shaders
    const vertexShader = `
      attribute vec2 vertex;
      varying vec2 coord;
      void main() {
        coord = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
      }`

    s.dropProgram = createProgram(
      gl,
      vertexShader,
      `precision highp float;
      const float PI = 3.141592653589793;
      uniform sampler2D texture;
      uniform vec2 center;
      uniform float radius;
      uniform float strength;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
        drop = pow(drop, 1.5);
        drop = 0.5 - cos(drop * PI) * 0.5;
        info.r += drop * strength;
        gl_FragColor = info;
      }`
    )

    s.updateProgram = createProgram(
      gl,
      vertexShader,
      `precision highp float;
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec2 dx = vec2(delta.x, 0.0);
        vec2 dy = vec2(0.0, delta.y);
        float average = (
          texture2D(texture, coord - dx).r +
          texture2D(texture, coord - dy).r +
          texture2D(texture, coord + dx).r +
          texture2D(texture, coord + dy).r
        ) * 0.25;
        info.g += (average - info.r) * 1.8;
        info.g *= 0.993;
        info.r += info.g;
        info.r *= 0.97;
        gl_FragColor = info;
      }`
    )
    gl.useProgram(s.updateProgram.id)
    gl.uniform2fv(s.updateProgram.locations["delta"], s.textureDelta)

    s.renderProgram = createProgram(
      gl,
      `precision highp float;
      attribute vec2 vertex;
      uniform vec2 topLeft;
      uniform vec2 bottomRight;
      uniform vec2 containerRatio;
      varying vec2 ripplesCoord;
      varying vec2 backgroundCoord;
      void main() {
        backgroundCoord = mix(topLeft, bottomRight, vertex * 0.5 + 0.5);
        backgroundCoord.y = 1.0 - backgroundCoord.y;
        ripplesCoord = vec2(vertex.x, -vertex.y) * containerRatio * 0.5 + 0.5;
        gl_Position = vec4(vertex.x, -vertex.y, 0.0, 1.0);
      }`,
      `precision highp float;
      uniform sampler2D samplerBackground;
      uniform sampler2D samplerRipples;
      uniform vec2 delta;
      uniform float perturbance;
      uniform float time;
      uniform vec2 u_mouse;
      uniform vec2 textureSize;
      varying vec2 ripplesCoord;
      varying vec2 backgroundCoord;
      const float PI = 3.141592653589793;

      float rand(vec2 co) {
        return fract(sin(dot(co.xy * 0.7, vec2(12.9898, 78.233))) * 43758.5453);
      }
      vec4 addFilmGrain(vec4 color, vec2 uv) {
        float noise = rand(uv + time * 0.1) * 0.20 - 0.075;
        return vec4(color.rgb + noise * 0.60, color.a);
      }
      void main() {
        float height = texture2D(samplerRipples, ripplesCoord).r;
        float heightX1 = texture2D(samplerRipples, vec2(ripplesCoord.x + delta.x, ripplesCoord.y)).r;
        float heightX2 = texture2D(samplerRipples, vec2(ripplesCoord.x - delta.x, ripplesCoord.y)).r;
        float heightY1 = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y + delta.y)).r;
        float heightY2 = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y - delta.y)).r;
        float gradX = ((heightX1 - height) + (height - heightX2)) * 0.5;
        float gradY = ((heightY1 - height) + (height - heightY2)) * 0.5;
        vec3 dx = vec3(delta.x * 2.0, gradX * 0.8, 0.0);
        vec3 dy = vec3(0.0, gradY * 0.8, delta.y * 2.0);
        vec3 normal = normalize(cross(dx, dy));
        vec4 baseColor = texture2D(samplerBackground, backgroundCoord);
        float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        vec2 mouseOffset = (ripplesCoord - u_mouse) * 0.015;
        float mouseDistance = length(ripplesCoord - u_mouse);
        mouseOffset *= pow(max(0.0, 1.0 - mouseDistance * 3.0), 2.0);
        vec2 offset = -normal.xz * 0.7 * (1.0 - luminance * 0.3) + mouseOffset * 0.7;
        vec2 blurCoord = backgroundCoord + offset * perturbance * 0.8;
        vec4 distorted = texture2D(samplerBackground, blurCoord);
        float fresnel = pow(1.0 - max(0.0, dot(offset, normalize(vec2(-0.6, 1.0)))), 50.0);
        float brightness = max(max(distorted.r, distorted.g), distorted.b);
        float fresnelIntensity = clamp(fresnel * 0.35 * (brightness * 0.5), 0.02, 0.55);
        float timeShift = time * 0.2;
        vec3 interferenceColor = vec3(
          sin(2.0 * fresnel * PI + 1.0 + timeShift),
          sin(2.0 * fresnel * PI + 2.0 + timeShift),
          sin(2.0 * fresnel * PI + 4.0 + timeShift)
        ) * 0.05;
        vec4 finalColor = mix(distorted, distorted + vec4(interferenceColor, 0.0), fresnelIntensity);
        finalColor.a = 1.0;
        finalColor = addFilmGrain(finalColor, gl_FragCoord.xy / textureSize);
        gl_FragColor = finalColor;
      }`
    )
    gl.useProgram(s.renderProgram.id)
    gl.uniform2fv(s.renderProgram.locations["delta"], s.textureDelta)

    // Background texture
    s.backgroundTexture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, s.backgroundTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    // Transparent fallback
    const transparentPixels = new ImageData(32, 32)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      transparentPixels
    )

    // Build background texture: draw image and/or text onto an offscreen canvas
    const buildTexture = (baseImg?: HTMLImageElement) => {
      if (s.destroyed) return
      const w = container.clientWidth || 1280
      const h = container.clientHeight || 720
      const offscreen = document.createElement("canvas")
      offscreen.width = w
      offscreen.height = h
      const ctx = offscreen.getContext("2d")!

      // Background fill or image
      if (baseImg) {
        const scale = Math.max(w / baseImg.width, h / baseImg.height)
        const bw = baseImg.width * scale
        const bh = baseImg.height * scale
        ctx.drawImage(baseImg, (w - bw) / 2, (h - bh) / 2, bw, bh)
      } else {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, w, h)
      }

      // Draw text if provided
      if (textConfig) {
        const {
          lines,
          color = textColor,
          fontSize = Math.floor(w * 0.15),
          fontWeight = "900",
          fontFamily = "sans-serif",
          lineHeight = 1.2,
          x = 0.5,
          y = 0.5,
          align = "center",
        } = textConfig
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.fillStyle = color
        ctx.textAlign = align
        ctx.textBaseline = "middle"
        const totalHeight = fontSize * lineHeight * lines.length
        const startY = h * y - totalHeight / 2 + fontSize / 2
        lines.forEach((line, i) => {
          ctx.fillText(line, w * x, startY + i * fontSize * lineHeight)
        })
      } else if (text) {
        const fontSize = Math.floor(w * 0.15)
        ctx.font = `900 ${fontSize}px sans-serif`
        ctx.fillStyle = textColor
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(text, w / 2, h / 2)
      }

      // Draw countdown if deadline provided

      const isPow2 = (x: number) => (x & (x - 1)) === 0
      const wrapping = isPow2(w) && isPow2(h) ? gl.REPEAT : gl.CLAMP_TO_EDGE
      gl.bindTexture(gl.TEXTURE_2D, s.backgroundTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapping)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapping)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        offscreen
      )
      s.backgroundWidth = w
      s.backgroundHeight = h
    }

    if (imageUrl) {
      const img = new Image()
      img.crossOrigin = ""
      img.onload = () => buildTexture(img)
      img.onerror = () => buildTexture()
      img.src = imageUrl
    } else {
      buildTexture()
    }

    // Expose buildTexture for re-baking
    buildTextureRef.current = () => buildTexture()

    gl.clearColor(0, 0, 0, 0)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Animation loop
    function step() {
      if (s.destroyed) return
      const gl = s.gl!
      const canvas = canvasRef.current!

      // Update simulation
      gl.viewport(0, 0, resolution, resolution)
      gl.bindFramebuffer(gl.FRAMEBUFFER, s.framebuffers[s.bufferWriteIndex])
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, s.textures[s.bufferReadIndex])
      gl.useProgram(s.updateProgram!.id)
      gl.bindBuffer(gl.ARRAY_BUFFER, s.quad)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
      s.bufferWriteIndex = 1 - s.bufferWriteIndex
      s.bufferReadIndex = 1 - s.bufferReadIndex

      // Auto-rain when idle
      if (!s.isRaining && Date.now() - s.lastMouseMove > 1000) {
        s.isRaining = true
        s.rainInterval = setInterval(() => {
          if (s.destroyed) return
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          dropAt(x, y, dropRadius * 1.2 * rainIntensity, 0.06 * rainIntensity)
        }, Math.max(16, 40 / rainIntensity))
      }

      // Render
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.enable(gl.BLEND)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.useProgram(s.renderProgram!.id)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, s.backgroundTexture)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, s.textures[0])

      const elapsedTime = Date.now() / 1000 - s.startTime
      const w = canvas.width
      const h = canvas.height
      const maxSide = Math.max(w, h)

      gl.uniform1f(s.renderProgram!.locations["perturbance"], perturbance)
      gl.uniform2fv(
        s.renderProgram!.locations["topLeft"],
        new Float32Array([0, 0])
      )
      gl.uniform2fv(
        s.renderProgram!.locations["bottomRight"],
        new Float32Array([1, 1])
      )
      gl.uniform2fv(
        s.renderProgram!.locations["containerRatio"],
        new Float32Array([w / maxSide, h / maxSide])
      )
      gl.uniform1i(s.renderProgram!.locations["samplerBackground"], 0)
      gl.uniform1i(s.renderProgram!.locations["samplerRipples"], 1)
      gl.uniform1f(s.renderProgram!.locations["time"], elapsedTime)
      gl.uniform2fv(s.renderProgram!.locations["u_mouse"], s.mousePosition)
      gl.uniform2fv(
        s.renderProgram!.locations["textureSize"],
        new Float32Array([w, h])
      )

      gl.bindBuffer(gl.ARRAY_BUFFER, s.quad)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
      gl.disable(gl.BLEND)

      s.rafId = requestAnimationFrame(step)
    }

    s.rafId = requestAnimationFrame(step)

    // Resize handler
    const handleResize = () => {
      if (!canvas || !container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      s.destroyed = true
      cancelAnimationFrame(s.rafId)
      cancelAnimationFrame(s.springRafId)
      if (s.rainInterval) clearInterval(s.rainInterval)
      window.removeEventListener("resize", handleResize)
    }
  }, [
    imageUrl,
    resolution,
    dropRadius,
    perturbance,
    interactive,
    dropAt,
    text,
    textConfig,
    textColor,
    backgroundColor,
  ])


  // Convert pointer position (relative to container) to canvas pixel coords.
  // The canvas is CSS-scaled by 1.15 but its pixel dimensions match the container,
  // so we just use the raw offset — no scale correction needed in pixel space.
  const pointerToCanvas = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      // Normalised 0-1 within the container
      const nx = (clientX - rect.left) / rect.width
      const ny = (clientY - rect.top) / rect.height
      const canvas = canvasRef.current!
      return { x: nx * canvas.width, y: ny * canvas.height, nx, ny }
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const s = stateRef.current
      const rect = e.currentTarget.getBoundingClientRect()
      const { x, y, nx, ny } = pointerToCanvas(e.clientX, e.clientY, rect)

      s.mousePosition[0] = nx
      s.mousePosition[1] = 1.0 - ny
      s.lastMouseMove = Date.now()

      if (s.isRaining) {
        s.isRaining = false
        if (s.rainInterval) {
          clearInterval(s.rainInterval)
          s.rainInterval = null
        }
      }

      dropAt(x, y, dropRadius * 0.5, 0.01)
    },
    [dropAt, dropRadius, pointerToCanvas]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const { x, y } = pointerToCanvas(e.clientX, e.clientY, rect)
      dropAt(x, y, dropRadius * 1.5, 0.14)
    },
    [dropAt, dropRadius, pointerToCanvas]
  )

  const handleMouseLeave = useCallback(() => {}, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      Array.from(e.changedTouches).forEach((touch) => {
        const { x, y } = pointerToCanvas(touch.clientX, touch.clientY, rect)
        dropAt(x, y, dropRadius, 0.01)
      })
    },
    [dropAt, dropRadius, pointerToCanvas]
  )

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      onTouchMove={interactive ? handleTouchMove : undefined}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={
            typeof window !== "undefined"
              ? (containerRef.current?.clientWidth ?? 800)
              : 800
          }
          height={
            typeof window !== "undefined"
              ? (containerRef.current?.clientHeight ?? 600)
              : 600
          }
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: "scale(1.15)",
            transformOrigin: "center center",
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}