import { Point } from './point.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';

export class Renderer {
    static #HEXAGON_SIZE = new Point(20, 20);
    static #BACKGROUND_COLOR = [0.25, 0.25, 0.25, 1];

    #gl;
    #program;

    #resolutionUniformLocation;
    #translationLocation;
    #scaleLocation;

    #transform;
    #scale;
    #layout;

    #vertexCount;

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl) {
        this.#gl = gl;
        this.#load();

        this.#scale = new Point(1, 1);
        this.#transform = new Point(0, 0);
        this.#layout = new Layout(Orientation.FLAT, Renderer.#HEXAGON_SIZE, new Point(0, 0 /*window.innerWidth / 2, window.innerHeight / 2*/));
    }

    async #load() {
        // Get shaders source
        const vertexShaderSource =
            `#version 300 es

            layout (location=0) in vec2 a_position;
            layout (location=1) in vec3 color;

            uniform vec2 u_resolution;
            uniform vec2 u_translation;
            uniform vec2 u_scale;
            out vec3 vColor;
    
            void main() {
                vec2 scaledPosition = a_position * u_scale;
                vec2 position = scaledPosition + u_translation;
                vec2 zeroToOne = position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
            
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                vColor = color;
            }`;
    
        const fragmentShaderSource = 
            `#version 300 es
            precision lowp float; // mediump, highp
    
            in vec3 vColor;
            out vec4 fragColor;
    
            void main() {
                fragColor = vec4(vColor, 1.0);
            }`;


        // Cleaner code, same variables
        const gl = this.#gl;

        gl.clearColor(...Renderer.#BACKGROUND_COLOR);


        // Compile shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(`Failed to compile Vertex Shader!`, gl.getShaderInfoLog(vertexShader));
        }
 
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(`Failed to compile Fragment Shader!`, gl.getShaderInfoLog(fragmentShader));
        }


        // Link shaders to WebGL program
        this.#program = gl.createProgram();
        const program = this.#program;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Failed to link program!`, gl.getProgramInfoLog(program));
        }

        // Finally, activate WebGL program
        gl.useProgram(program);

        // Remember to update on canvas size change
        this.#resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
        this.#adjustResolution();

        // Save locations
        this.#translationLocation = gl.getUniformLocation(program, 'u_translation');
        this.#scaleLocation = gl.getUniformLocation(program, 'u_scale');
    }

    /**
     * Adjust positioning mathematic in gl that depends on canvas's size
     */
    #adjustResolution() {
        const gl = this.#gl;
        gl.uniform2f(this.#resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    }

    *getTrianglesFromHexagon(hexagon) {
        const hexagonCorners = this.#layout.hexagonCorners(hexagon);
        const hexagonCenter = this.#layout.hexToPixel(hexagon);

        for (let i = 0; i < 6; i++) {
            yield [(hexagonCenter), (hexagonCorners[i]), (hexagonCorners[(i + 1) % 6])];
        }
    };


    onWindowResize() {
        this.#adjustResolution();
    }

    /**
     * @param {Float32Array} value
     */
    set vertices(value) {

        const gl = this.#gl;
        const verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        this.#vertexCount = value.length / 2;
    }

    /**
     * @param {Float32Array} value
     */
    set colors(value) {

        const gl = this.#gl;
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
    }

    draw() {
        console.time('DRAW');

        const gl = this.#gl;

        // Here only apply changes in scale and transform
        gl.uniform2fv(this.#translationLocation, this.#transform.add(this.offset));
        gl.uniform2fv(this.#scaleLocation, this.#scale);

        // Draw latest triangles TODO: make this multi call instead of one big array
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.#vertexCount);
        
        console.timeEnd('DRAW');
    }

    get transform() {
        return this.#transform;
    }

    set transform(value) {
        this.#transform = value;
    }

    offset = new Point(0, 0);

    get scale() {
        return this.#scale;
    }

    set scale(value) {
        this.#scale = value;
    }

    get layout() {
        return this.#layout;
    }
}