import { Point } from './point.js';
import { Hexagon } from './hexagon.js';
import { Layout } from './layout.js';
import { Orientation } from './orientation.js';
import { Vector } from './vector.js';
import { Matrix } from './matrix.js';

export class Renderer {
    static #HEXAGON_SIZE = new Point(20, 20);
    static #BACKGROUND_COLOR = [0.25, 0.25, 0.25, 1];
    static #MAXIMUM_ZOOM_ARGUMENT = 4;
    static #MINIMUM_ZOOM_ARGUMENT = -8;
    static #ZOOM_FUNCTION = x => Math.pow((x / 10) + 1, 2);

    #gl;
    #program;

    #resolutionUniformLocation;
    #matrixLocation;

    #transform;
    #offset;
    #scale;
    #layout;
    #currentZoomArgument;

    #vertexCount;

    /**
     * 
     * @param {WebGL2RenderingContext} gl
     * @param {Hexagon} centerHexagon
     */
    constructor(gl, centerHexagon) {
        this.#gl = gl;
        this.#load();

        this.#scale = new Point(1, 1);
        this.#transform = new Point(0, 0);
        this.#offset = new Point(0, 0);
        this.#layout = new Layout(Orientation.FLAT, Renderer.#HEXAGON_SIZE, new Point(0, 0));
        // Make center of map the origin
        this.#layout.origin = Vector.multiply(this.#layout.hexagonToPixelUntransformed(centerHexagon), -1);
        this.#currentZoomArgument = 0;
    }

    /**
     * 
     * @param {Point} hexagonCorner 
     * @param {Point} hexagonCenter 
     * @param {Number} widthMultiplier 
     * @returns {Point}
     */
    static borderCorner(hexagonCorner, hexagonCenter, widthMultiplier) {
        return Vector.makeVector(hexagonCorner, hexagonCenter).multiply(widthMultiplier).add(hexagonCenter);
        // return hexagonCenter.add(new Point(hexagonCorner.x - hexagonCenter.x, hexagonCorner.y - hexagonCenter.y).multiply(widthMultiplier));
    }

    /**
     * Converts hexagon to hexagon's center on screen
     * @param {Hexagon} hexagon
     * @returns {Point}
     */
    hexagonToPixel(hexagon) {
        const o = this.#layout.orientation;
        const x = (o.f[0] * hexagon.q + o.f[1] * hexagon.r) * this.#layout.size.x * this.scale.x;
        const y = (o.f[2] * hexagon.q + o.f[3] * hexagon.r) * this.#layout.size.y * this.scale.y;
        return new Point(x + this.#transform.x + this.#offset.x, y + this.#transform.y + this.#offset.y);
    }

    /**
     * Converts screen pixel to hexagon
     * @param {Point} pixel
     * @returns {Hexagon}
     */
    pixelToHexagon(pixel) {
        const o = this.#layout.orientation;
        const pt = new Point((pixel.x - this.#transform.x - this.#offset.x) / (this.#layout.size.x * this.#scale.x), (pixel.y - this.#transform.y - this.#offset.y) / (this.#layout.size.y * this.#scale.y));
        const q = o.b[0] * pt.x + o.b[1] * pt.y;
        const r = o.b[2] * pt.x + o.b[3] * pt.y;
        const s = -q - r;

        let qi = Math.round(q);
        let ri = Math.round(r);
        let si = Math.round(s);

        const qDiff = Math.abs(qi - q);
        const rDiff = Math.abs(ri - r);
        const sDiff = Math.abs(si - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            qi = -ri - si;
        } else if (rDiff > sDiff) {
            ri = -qi - si;
        } else {
            si = -qi - ri;
        }

        return new Hexagon(qi, ri, si);
    }

    async #load() {
        // Get shaders source
        const vertexShaderSource =
            `#version 300 es

            layout (location=0) in vec2 a_position;
            layout (location=1) in vec3 color;

            uniform vec2 u_resolution;
            uniform mat3 u_matrix;
            out vec3 vColor;
    
            void main() {
                // Multiply the position by the matrix.
                vec2 position = (u_matrix * vec3(a_position, 1)).xy;

                // convert the position from pixels to 0.0 to 1.0
                vec2 zeroToOne = position / u_resolution;

                // convert from 0->1 to 0->2
                vec2 zeroToTwo = zeroToOne * 2.0;

                // convert from 0->2 to -1->+1 (clipspace)
                vec2 clipSpace = zeroToTwo - 1.0;

                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                vColor = color;
            }`;
    
        const fragmentShaderSource = 
            `#version 300 es
            precision highp float; // lowp, mediump, highp
    
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
        this.#matrixLocation = gl.getUniformLocation(program, "u_matrix");
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
        const hexagonCenter = this.#layout.hexagonToPixelUntransformed(hexagon);

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

    m3 = {
        translation: function translation(tx, ty) {
          return [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1,
          ];
        },
      
        rotation: function rotation(angleInRadians) {
          var c = Math.cos(angleInRadians);
          var s = Math.sin(angleInRadians);
          return [
            c, -s, 0,
            s, c, 0,
            0, 0, 1,
          ];
        },
      
        scaling: function scaling(sx, sy) {
          return [
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1,
          ];
        },
      
        multiply: function multiply(a, b) {
          var a00 = a[0 * 3 + 0];
          var a01 = a[0 * 3 + 1];
          var a02 = a[0 * 3 + 2];
          var a10 = a[1 * 3 + 0];
          var a11 = a[1 * 3 + 1];
          var a12 = a[1 * 3 + 2];
          var a20 = a[2 * 3 + 0];
          var a21 = a[2 * 3 + 1];
          var a22 = a[2 * 3 + 2];
          var b00 = b[0 * 3 + 0];
          var b01 = b[0 * 3 + 1];
          var b02 = b[0 * 3 + 2];
          var b10 = b[1 * 3 + 0];
          var b11 = b[1 * 3 + 1];
          var b12 = b[1 * 3 + 2];
          var b20 = b[2 * 3 + 0];
          var b21 = b[2 * 3 + 1];
          var b22 = b[2 * 3 + 2];
          return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
          ];
        },
    };

    draw() {
        // console.time('DRAW');

        const gl = this.#gl;

        // Here only apply changes in scale and transform
        // gl.uniform2fv(this.#translationLocation, Vector.add(this.#transform, this.offset));
        // gl.uniform2fv(this.#scaleLocation, this.#scale);

        // Compute the matrices
        const translationMatrix = Matrix.translation(...Vector.add(this.#transform, this.offset));
        const rotationMatrix = Matrix.rotation(0);
        const scaleMatrix = Matrix.scaling(...this.#scale);
        const moveOriginMatrix = Matrix.translation(-500, -750);

        // Multiply the matrices.
        let matrix = Matrix.multiply(translationMatrix, rotationMatrix);
        matrix = Matrix.multiply(matrix, scaleMatrix);
        matrix = Matrix.multiply(matrix, moveOriginMatrix);


        // Set the matrix.
        gl.uniformMatrix3fv(this.#matrixLocation, false, matrix);

        // Draw latest triangles TODO: make this multi call instead of one big array
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.#vertexCount);
        
        // console.timeEnd('DRAW');
    }

    get origin() {
        return this.#layout.origin;
    }

    set origin(value) {
        this.#layout.origin = value;
    }

    get transform() {
        return this.#transform;
    }

    set transform(value) {
        this.#transform = value;
    }

    set offset(value) {
        this.#offset = value;
    }

    get offset() {
        return this.#offset;
    }

    get scale() {
        return this.#scale;
    }

    set scale(value) {
        this.#scale = value;
    }

    get layout() {
        return this.#layout;
    }

    get currentZoom() {
        return Renderer.#ZOOM_FUNCTION(this.#currentZoomArgument);
    }

    get zoom() {
        return this.#currentZoomArgument;
    }

    set zoom(value) {
        this.#currentZoomArgument = Math.clamp(value,  Renderer.#MINIMUM_ZOOM_ARGUMENT, Renderer.#MAXIMUM_ZOOM_ARGUMENT);
        this.scale.x = this.scale.y = this.currentZoom;
    }
}