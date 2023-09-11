var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        uniform float u_size;
        uniform mat4 u_modelMatrix;
        uniform mat4 scaleMatrix;
        
        void main(){
            gl_Position = u_modelMatrix * a_Position * scaleMatrix;
            gl_PointSize = 10.0 + u_size;
            v_Color = a_Color;
        }    
    `;

var FSHADER_SOURCE = `
        precision mediump float;
        uniform int u_shape;
        varying vec4 v_Color;
        void main(){
            if(u_shape == 0){
                vec2 pt = gl_PointCoord - vec2(0.5);
                if(pt.x*pt.x + pt.y*pt.y > 0.25)
                    discard;
            }
            gl_FragColor = v_Color;
        }
    `;

function createProgram(gl, vertexShader, fragmentShader){
    //create the program and attach the shaders
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    //if success, return the program. if not, log the program info, and delete it.
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

function initArrayBuffer( gl, data, num, type, attribute){
    var buffer = gl.createBuffer();
    if(!buffer){
        console.log("failed to create the buffere object");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), attribute);

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

var transformMat = new Matrix4();
var matStack = [];
var u_modelMatrix;
function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}
//variables for tx, red,green and yellow arms angle 
var tx = 0;
var ty = 0;
var joint1 = 0;
var joint2 = 0;
var joint3 = 0;
var joint4 = 0;
var robotSize = 0;
var pointSize = 0;

function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }
    
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    redraw(gl); //call redarw here to show the initial image

    //setup the call back function of tx Sliders
    var txSlider = document.getElementById("Translate-X");
    txSlider.oninput = function() {
        tx = this.value / 100.0; //convert sliders value to -1 to +1
        redraw(gl);
    }

    var tySlider = document.getElementById("Translate-Y");
    tySlider.oninput = function() {
        ty = this.value / 100.0; //convert sliders value to -1 to +1
        redraw(gl);
    }

    //setup the call back function of red arm rotation Sliders
    var jointRedSlider = document.getElementById("joint1");
    jointRedSlider.oninput = function() {
        joint1 = this.value;
        redraw(gl);
    }

    //setup the call back function of green arm rotation Sliders
    var jointGreenSlider = document.getElementById("joint2");
    jointGreenSlider.oninput = function() {
        joint2 = this.value; //convert sliders value to 0 to 45 degrees
        redraw(gl);
    }

    //setup the call back function of yellow arm rotation Sliders
    var jointYellowSlider = document.getElementById("joint3");
    jointYellowSlider.oninput = function() {
        joint3 = this.value *  -1; //convert sliders value to 0 to -45 degrees
        redraw(gl);
    }

    var jointGreenSlider = document.getElementById("joint4");
    jointGreenSlider.oninput = function() {
        joint4 = this.value; //convert sliders value to 0 to 45 degrees
        redraw(gl);
    }

    var robotSizeSlider = document.getElementById("robotSize");
    robotSizeSlider.oninput = function() {
        robotSize = this.value; //convert sliders value to 0 to 45 degrees
        if(robotSize > 0) pointSize = robotSize / 3.3;
        else pointSize = robotSize / 5;
        robotSize = robotSize / 45;
        redraw(gl);
    }
}

//Call this funtion when we have to update the screen (eg. user input happens)
function redraw(gl)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    u_modelMatrix = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_modelMatrix');
    var scaleMatrix = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'scaleMatrix' );
    var u_shape = gl.getUniformLocation(program, 'u_shape');
    var u_size = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_size');

    var circliePointLoc = [0.0, 0.0];
    var circlePointColor = [0.1, 0.5, 0.0 ];
    var trianglePointLoc = [0.0, 0.0, -0.1, 0.1, 0.1, 0.1];
    var trianglePointColor = [1.0, 0.2, 0.3, 1.0, 0.2, 0.3, 1.0, 0.2, 0.3];
    rectVertices = [-0.2, 0.2, 0.2, 0.2, -0.2, -0.2, 0.2, -0.2];
    var redColor = [1.0, 0.6, 0.5, 1.0, 0.6, 0.5, 1.0, 0.6, 0.5, 1.0, 0.6, 0.5 ];
    var greenColor = [0.6, 0.9, 0.1, 0.6, 0.9, 0.1, 0.6, 0.9, 0.1, 0.6, 0.9, 0.1 ];
    var blueColor = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0 ];
    var yellowColor = [1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0 ];
    
    var formMatrix = new Float32Array( [
        1 + robotSize, 0.0, 0.0, 0.0,
        0.0, 1 + robotSize, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ])
    var size = new Float32Array([pointSize]);
    gl.uniformMatrix4fv(scaleMatrix, false, formMatrix);
    gl.uniform1fv(u_size, size);
    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(redColor), 3, gl.FLOAT, 'a_Color');
    transformMat.setIdentity();
    transformMat.translate(tx, -0.5, 0.0);
    transformMat.translate(0, ty, 0.0);
    pushMatrix();
    transformMat.scale(1.0, 0.4, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the blue one

    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(circliePointLoc), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(circlePointColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.1, 0.0);
    transformMat.rotate(joint1, 0.0, 0.0, 1.0);
    pushMatrix();
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 0);
    gl.drawArrays(gl.POINTS, 0, circliePointLoc.length/2);//draw the red one
    popMatrix();


    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(greenColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.095, 0.0);
    pushMatrix();
    transformMat.scale(0.05, 0.35, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the green one
    popMatrix();


    buffer0 = initArrayBuffer(gl, new Float32Array(circliePointLoc), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(circlePointColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.09, 0.0);
    transformMat.rotate(joint2, 0.0, 0.0, 1.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 0);
    gl.drawArrays(gl.POINTS, 0, circliePointLoc.length/2);//draw the green one
    

    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(greenColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.095, 0.0);
    pushMatrix(); //for one more yellow
    transformMat.scale(0.05, 0.35, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the green one
    popMatrix();


    buffer0 = initArrayBuffer(gl, new Float32Array(circliePointLoc), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(circlePointColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.09, 0.0);
    transformMat.rotate(joint3, 0.0, 0.0, 1.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 0);
    gl.drawArrays(gl.POINTS, 0, circliePointLoc.length/2);//draw the green one


    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(greenColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.095, 0.0);
    pushMatrix(); //for one more yellow
    transformMat.scale(0.05, 0.35, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the green one
    popMatrix();

    buffer0 = initArrayBuffer(gl, new Float32Array(circliePointLoc), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(circlePointColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.09, 0.0);
    transformMat.rotate(joint4, 0.0, 0.0, 1.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 0);
    gl.drawArrays(gl.POINTS, 0, circliePointLoc.length/2);//draw the green one


    buffer0 = initArrayBuffer(gl, new Float32Array(trianglePointLoc), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(trianglePointColor), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.025, 0.0);
    pushMatrix(); //for one more yellow
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.uniform1i(u_shape, 1);
    gl.drawArrays(gl.TRIANGLES, 0, trianglePointLoc.length/2);//draw the green one
    popMatrix();



}
