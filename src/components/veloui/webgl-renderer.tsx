import React, { useRef, useEffect, useCallback, useState } from 'react';

interface WebGLRendererProps {
    width: number;
    height: number;
    children: React.ReactNode;
    opacity?: number;
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    tint?: { r: number; g: number; b: number; a: number };
    transform?: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
    };
    onRenderComplete?: () => void;
}

interface ShaderProgram {
    program: WebGLProgram;
    attributes: {
        position: number;
        texCoord: number;
    };
    uniforms: {
        transform: WebGLUniformLocation | null;
        resolution: WebGLUniformLocation | null;
        texture: WebGLUniformLocation | null;
        opacity: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        tint: WebGLUniformLocation | null;
        blur: WebGLUniformLocation | null;
        brightness: WebGLUniformLocation | null;
        contrast: WebGLUniformLocation | null;
        saturation: WebGLUniformLocation | null;
    };
}

class WebGLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private shaderProgram: ShaderProgram | null = null;
    private positionBuffer: WebGLBuffer | null = null;
    private texCoordBuffer: WebGLBuffer | null = null;
    private texture: WebGLTexture | null = null;
    private frameBuffer: WebGLFramebuffer | null = null;
    private animationId: number | null = null;
    private startTime: number = Date.now();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        this.gl = gl as WebGLRenderingContext;
        this.initialize();
    }

    private async initialize() {
        const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat3 u_transform;
      uniform vec2 u_resolution;
      
      varying vec2 v_texCoord;
      
      void main() {
          vec3 position = u_transform * vec3(a_position, 1.0);
          vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          v_texCoord = a_texCoord;
      }
    `;

        const fragmentShaderSource = `
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
      
      vec4 blur(sampler2D texture, vec2 uv, float radius) {
          vec4 color = vec4(0.0);
          float total = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
              for (float y = -2.0; y <= 2.0; y += 1.0) {
                  vec2 offset = vec2(x, y) * radius / u_resolution;
                  float weight = exp(-(x*x + y*y) / 4.0);
                  color += texture2D(texture, uv + offset) * weight;
                  total += weight;
              }
          }
          
          return color / total;
      }
      
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
          
          vec3 color = texColor.rgb;
          color = adjustBrightness(color, u_brightness);
          color = adjustContrast(color, u_contrast);
          color = adjustSaturation(color, u_saturation);
          color = mix(color, u_tint.rgb, u_tint.a);
          
          gl_FragColor = vec4(color, texColor.a * u_opacity);
      }
    `;

        this.shaderProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.setupBuffers();
        this.setupTexture();
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) throw new Error('Failed to create shader');

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }

        return shader;
    }

    private createShaderProgram(vertexSource: string, fragmentSource: string): ShaderProgram {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        const program = this.gl.createProgram();
        if (!program) throw new Error('Failed to create shader program');

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            throw new Error(`Shader program linking error: ${error}`);
        }

        return {
            program,
            attributes: {
                position: this.gl.getAttribLocation(program, 'a_position'),
                texCoord: this.gl.getAttribLocation(program, 'a_texCoord'),
            },
            uniforms: {
                transform: this.gl.getUniformLocation(program, 'u_transform'),
                resolution: this.gl.getUniformLocation(program, 'u_resolution'),
                texture: this.gl.getUniformLocation(program, 'u_texture'),
                opacity: this.gl.getUniformLocation(program, 'u_opacity'),
                time: this.gl.getUniformLocation(program, 'u_time'),
                tint: this.gl.getUniformLocation(program, 'u_tint'),
                blur: this.gl.getUniformLocation(program, 'u_blur'),
                brightness: this.gl.getUniformLocation(program, 'u_brightness'),
                contrast: this.gl.getUniformLocation(program, 'u_contrast'),
                saturation: this.gl.getUniformLocation(program, 'u_saturation'),
            },
        };
    }

    private setupBuffers() {
        // Position buffer (rectangle)
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // Texture coordinate buffer
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }

    private setupTexture() {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    public updateTexture(element: HTMLElement) {
        if (!this.texture) return;

        // Create a canvas to render the DOM element
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = element.offsetWidth;
        tempCanvas.height = element.offsetHeight;

        // Use html2canvas or similar library in production
        // For now, we'll create a simple colored rectangle
        tempCtx.fillStyle = '#18181b'; // zinc-900
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            tempCanvas
        );
    }

    public render(props: Omit<WebGLRendererProps, 'children'>) {
        if (!this.shaderProgram) return;

        const { width, height, opacity = 1, blur = 0, brightness = 0, contrast = 1, saturation = 1, tint = { r: 0, g: 0, b: 0, a: 0 }, transform } = props;

        this.gl.viewport(0, 0, width, height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.shaderProgram.program);

        // Set up transform matrix
        const transformMatrix = this.createTransformMatrix(width, height, transform);
        this.gl.uniformMatrix3fv(this.shaderProgram.uniforms.transform, false, transformMatrix);

        // Set uniforms
        this.gl.uniform2f(this.shaderProgram.uniforms.resolution, width, height);
        this.gl.uniform1f(this.shaderProgram.uniforms.opacity, opacity);
        this.gl.uniform1f(this.shaderProgram.uniforms.time, (Date.now() - this.startTime) / 1000);
        this.gl.uniform4f(this.shaderProgram.uniforms.tint, tint.r, tint.g, tint.b, tint.a);
        this.gl.uniform1f(this.shaderProgram.uniforms.blur, blur);
        this.gl.uniform1f(this.shaderProgram.uniforms.brightness, brightness);
        this.gl.uniform1f(this.shaderProgram.uniforms.contrast, contrast);
        this.gl.uniform1f(this.shaderProgram.uniforms.saturation, saturation);

        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.shaderProgram.uniforms.texture, 0);

        // Set up attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.shaderProgram.attributes.position);
        this.gl.vertexAttribPointer(this.shaderProgram.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.enableVertexAttribArray(this.shaderProgram.attributes.texCoord);
        this.gl.vertexAttribPointer(this.shaderProgram.attributes.texCoord, 2, this.gl.FLOAT, false, 0, 0);

        // Enable blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private createTransformMatrix(width: number, height: number, transform?: WebGLRendererProps['transform']): Float32Array {
        const { x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0 } = transform || {};

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        return new Float32Array([
            scaleX * cos * width, -scaleX * sin * width, x,
            scaleY * sin * height, scaleY * cos * height, y,
            0, 0, 1
        ]);
    }

    public startAnimation(callback: () => void) {
        const animate = () => {
            callback();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    public stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    public dispose() {
        this.stopAnimation();
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram.program);
        }
        if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
        if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
        if (this.texture) this.gl.deleteTexture(this.texture);
        if (this.frameBuffer) this.gl.deleteFramebuffer(this.frameBuffer);
    }
}

const WebGLRendererComponent: React.FC<WebGLRendererProps> = ({
    width,
    height,
    children,
    opacity = 1,
    blur = 0,
    brightness = 0,
    contrast = 1,
    saturation = 1,
    tint = { r: 0, g: 0, b: 0, a: 0 },
    transform,
    onRenderComplete
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    const [isReady, setIsReady] = useState(false);

    const initializeRenderer = useCallback(async () => {
        if (!canvasRef.current) return;

        try {
            rendererRef.current = new WebGLRenderer(canvasRef.current);
            setIsReady(true);
        } catch (error) {
            console.error('Failed to initialize WebGL renderer:', error);
        }
    }, []);

    const updateRenderer = useCallback(() => {
        if (!rendererRef.current || !contentRef.current || !isReady) return;

        rendererRef.current.updateTexture(contentRef.current);
        rendererRef.current.render({
            width,
            height,
            opacity,
            blur,
            brightness,
            contrast,
            saturation,
            tint,
            transform
        });

        onRenderComplete?.();
    }, [width, height, opacity, blur, brightness, contrast, saturation, tint, transform, isReady, onRenderComplete]);

    useEffect(() => {
        initializeRenderer();

        return () => {
            rendererRef.current?.dispose();
        };
    }, [initializeRenderer]);

    useEffect(() => {
        if (isReady) {
            updateRenderer();
        }
    }, [updateRenderer, isReady]);

    useEffect(() => {
        if (!rendererRef.current || !isReady) return;

        rendererRef.current.startAnimation(updateRenderer);

        return () => {
            rendererRef.current?.stopAnimation();
        };
    }, [updateRenderer, isReady]);

    return (
        <div className="relative" style={{ width, height }}>
            {/* Hidden content for texture generation */}
            <div
                ref={contentRef}
                className="absolute inset-0 opacity-0 pointer-events-none"
                style={{ width, height }}
            >
                {children}
            </div>

            {/* WebGL Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute inset-0"
                style={{ width, height }}
            />


            {!isReady && (
                <div className="absolute inset-0" style={{ width, height }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default WebGLRendererComponent;
