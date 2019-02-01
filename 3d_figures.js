var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 10000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 100);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -10]);
}

// TO DO: Create the functions for each of the figures.
// Create the vertex, color and index data for a multi-colored Octahedron
function createOctahedron(gl, translation, rotationAxis) {
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var vertices = [
        0.0,  0.0,  1.0,
        0.0,  1.0,  0.0,
        1.0,  0.0,  0.0,

        0.0,  0.0,  1.0,
        1.0,  0.0,  0.0,
        0.0,  -1.0, 0.0,

        0.0,  0.0,  1.0,
        0.0,  -1.0, 0.0,
        -1.0, 0.0,  0.0,
        
        0.0,  0.0,  1.0,
        -1.0, 0.0,  0.0,
        0.0,  1.0,  0.0,
        
        0.0,  0.0,  -1.0,
        0.0,  1.0,  0.0,
        1.0,  0.0,  0.0,
        
        0.0,  0.0,  -1.0,
        1.0,  0.0,  0.0,
        0.0,  -1.0, 0.0,
        
        0.0,  0.0,  -1.0,
        0.0,  -1.0, 0.0,
        -1.0, 0.0,  0.0,
        
        0.0,  0.0,  -1.0,
        -1.0, 0.0,  0.0,
        0.0,  1.0,  0.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face
        [0.0, 1.0, 0.0, 1.0], // Right face
        [0.0, 0.0, 1.0, 1.0], // Back face
        [1.0, 1.0, 1.0, 1.0], // Left face
        [0.0, 0.0, 1.0, 1.0], // Bottom 
        [0.2, 0.6, 0.2, 1.0], // Bottom 
        [0.8, 0.8, 0.0, 1.0], // Bottom 
        [0.5, 0.5, 0.5, 1.0], // Bottom 
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 3 times, one for each vertex of the pyramid's face.
    var vertexColors = [];
    for (const color of faceColors) {
        for (var j=0; j < 3; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var octahedronIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, octahedronIndexBuffer);
    var octahedronIndices = [
        0,1,2,
        3,4,5,
        6,7,8,
        9,10,11,
        12,13,14,
        15,16,17,
        18,19,20,
        21,22,23
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octahedronIndices), gl.STATIC_DRAW);

    var octahedron = {
        buffer: vertexBuffer, 
        colorBuffer: colorBuffer, 
        indices: octahedronIndexBuffer,
        vertSize: 3,  // tamaño de cada vertice x,y,z
        nVerts: vertices.length/3,    //tamaño de buffer/3     3 por cada cara
        colorSize: 4,  //rgba
        nColors: vertices.length/3, // colores igual en numero de vertices 
        nIndices: octahedronIndices.length,
        primtype:gl.TRIANGLES, 
        modelViewMatrix: mat4.create(), 
        currentTime : Date.now()
    };
    
    var up = true;
    mat4.translate(octahedron.modelViewMatrix, octahedron.modelViewMatrix, translation);
    octahedron.update = function(){
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

        if (up) {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0.0, 5.0*fract, 0]);
            // If reached the top change to down
            if (this.modelViewMatrix[13]>3) {
              up = false;
            }
        } else{
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0.0, -5.0*fract, 0]);
            // If in bottom change direction
            if (this.modelViewMatrix[13]<-3) {
                up = true;
            }
        }
    }

    return octahedron;
}

// Create the vertex, color and index data for a multi-colored Dodecahedron
function createDodecahedron(gl, translation, rotationAxis) {
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var vertices = [
        0.35682,    0,         0.93417,   //v0
        -0.35682,   0,         0.93417,   //v1
        0,          0.93417,   0.35682,   //v2
  
        0.57735,    0.57735,   0.57735,   //v3
        -0.57735,   0.57735,   0.57735,   //v4
  
        0,         -0.93417,   0.35682,   //v5
        0.57735,   -0.57735,   0.57735,   //v6
        -0.57735,  -0.57735,   0.57735,   //v7

        0.93417,    0.35682,   0,         //v8
        0.93417,    -0.35682,  0,         //v9
        -0.93417,   0.35682,   0,         //v10

        -0.93417,  -0.35682,   0,         //v11
        0,         -0.93417,   -0.35682,  //v12
        -0.57735,  -0.57735,   -0.57735,  //v13

        0.93417,   -0.35682,   0,         //v14 
        0.57735,   -0.57735,   -0.57735,  //v15

        0.35682,    0,         -0.93417,  //v16
        -0.35682,   0,         -0.93417,  //v17
        0,          0.93417,   -0.35682,  //v18      

        0.57735,    0.57735,   -0.57735,  //v19
        -0.57735,   0.57735,   -0.57735,  //v20
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [0.0, 1.0, 0.0, 1.0], // Front face
        [1.0, 1.0, 1.0, 1.0], // Front face
        [0.2, 0.0, 1.0, 1.0], // Back face
        [0.3, 0.0, 1.0, 1.0], // Back face
        [0.4, 1.0, 0.0, 1.0], // Front face
        [0.5, 0.5, 1.0, 1.0], // Front face
        [1.0, 0.9, 1.0, 1.0], // Front face
        [0.6, 0.0, 1.0, 1.0], // Back face
        [0.7, 0.0, 1.0, 1.0], // Back face
        [0.8, 1.0, 0.0, 1.0], // Front face
        [0.7, 0.3, 1.0, 1.0], // Back face
        [0.8, 1.0, 0.5, 1.0] // Front face
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 3 times, one for each vertex of the pentagon's face.
    var vertexColors = [];
    for (const color of faceColors) {
        for (var j=0; j < 5; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var dodecahedronIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dodecahedronIndexBuffer);
    var dodecahedronIndices = [
        // Top Front face
        0, 1, 2,
        0, 2, 3,
        1, 2, 4,

        // Top Front face
        0, 1, 5,
        0, 5, 6,
        1, 5, 7,

        // Top Right face
        0, 3, 8,
        0, 6, 8,
        6, 8, 9,

        // Top Left face
        1, 4, 10,
        1, 7, 10,
        7, 10, 11,

        //Bottom Top face
        12, 15, 16,
        12, 13, 16,
        13, 16, 17,
        
        //Bottom Bottom face
        16, 17, 18,
        16, 18, 19,
        17, 18, 20,

        //Bottom Left face
        13, 17, 10,
        10, 11, 13,
        10, 17, 20,

        //Bottom Right face
        8, 15, 16,
        8, 16, 19,
        8, 9, 15,

        //Back Top face
        2, 8,18,
        2, 3, 8,
        8, 18, 19,

        // Front Left face
        5, 7, 11,
        5, 11, 12,
        11, 12, 13,

        //Front Right face
        5, 6, 14,
        5, 12, 14,
        12, 14, 15,

        2, 4, 10,
        2, 10, 20,
        2, 18, 20,
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dodecahedronIndices), gl.STATIC_DRAW);

    var dodecahedron = {
        buffer: vertexBuffer, 
        colorBuffer: colorBuffer, 
        indices: dodecahedronIndexBuffer,
        vertSize: 3,  // tamaño de cada vertice x,y,z
        nVerts: vertices.length/3,    //tamaño de buffer/3     3 por cada cara
        colorSize: 4,  //rgba
        nColors: vertices.length/3, // colores igual en numero de vertices 
        nIndices: dodecahedronIndices.length,
        primtype:gl.TRIANGLES, 
        modelViewMatrix: mat4.create(), 
        currentTime : Date.now()
    };
    
    mat4.translate(dodecahedron.modelViewMatrix, dodecahedron.modelViewMatrix, translation);

    dodecahedron.update = function(){
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

    }
    return dodecahedron;
}

// Create the vertex, color and index data for a multi-colored pentagonal pyramid
function createPyramid(gl, translation, rotationAxis) {
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var vertices = [
         //Base
         -0.5, -1.0,  0.0,
         0.5, -1.0,  0.0,
         1.0, -1.0,  -1.0,

        -0.5, -1.0,  0.0,
         1.0, -1.0,  -1.0,
         0.0, -1.0, -2.0,

        -0.5, -1.0,  0.0,
         0.0, -1.0, -2.0,
        -1.0, -1.0, -1.0,

        //Faces
        -0.5, -1.0,  0.0,
         0.5, -1.0,  0.0,
         0.0,  1.0, -1.0,

         0.5, -1.0,  0.0,
         1.0, -1.0, -1.0,
         0.0, 1.0,  -1.0,

         1.0, -1.0, -1.0,
         0.0, -1.0, -2.0,
         0.0,  1.0, -1.0,

         0.0, -1.0, -2.0,
        -1.0, -1.0, -1.0,
         0.0,  1.0, -1.0,

        -1.0, -1.0, -1.0,
        -0.5, -1.0, 0.0,
         0.0, 1.0, -1.0
        
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], 
        [0.0, 1.0, 0.0, 1.0], 
        [0.0, 0.0, 1.0, 1.0], 
        [1.0, 1.0, 1.0, 1.0], 
        [0.0, 0.0, 1.0, 1.0],  
        [0.2, 0.6, 0.2, 1.0],  
        [0.8, 0.8, 0.0, 1.0],  
        [0.5, 0.5, 0.5, 1.0], 
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 3 times, one for each vertex of the pyramid's face.
    var vertexColors = [];
    for (const color of faceColors) {
        for (var j=0; j < 3; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var pyramidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);
    var pyramidIndices = [
        0,  1,  2,      
        3,  4,  5,      
        6,  7,  8,      
        9,  10, 11,
        12, 13, 14,   
        15, 16, 17,   
        18, 19, 20,   
        21, 22, 23    
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);

    var pyramid = {
        buffer: vertexBuffer, 
        colorBuffer: colorBuffer, 
        indices: pyramidIndexBuffer,
        vertSize: 3,
        nVerts: vertices.length,
        colorSize: 4, //rgba
        nColors: vertices.length,
        nIndices: pyramidIndices.length,
        primtype:gl.TRIANGLES, 
        modelViewMatrix: mat4.create(), 
        currentTime : Date.now()
    };
    
    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);
    pyramid.update = function(){
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    }

    return pyramid;
}


function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
