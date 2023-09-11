//shader
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform int u_shape_v;
    varying vec4 v_Color;
    void main(){
        gl_Position = a_Position;
        if(u_shape_v == 0) {
            gl_PointSize = 3.5;
        }
        else {
            gl_PointSize = 10.0;
        }
        v_Color = a_Color;
    }
    `;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform int u_shape;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
        if(u_shape == 5){
            vec2 pt = gl_PointCoord - vec2(0.5);
            if(pt.x*pt.x + pt.y*pt.y > 0.25)
                discard;
        }
    }
    `;


var shapeFlag = 'p'; //p: point, h: hori line: v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; //r g b 
var shape;
var R = 1.0;
var G = 0.0;
var B = 0.0;
let g_points = new Float32Array();
let g_horiLines = new Float32Array();
let g_vertiLines = new Float32Array();
let g_triangles = new Float32Array();
let g_squares = new Float32Array();
let g_circles = new Float32Array();
let vertices = new Float32Array();


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


function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    //var gl = canvas.getContext('webgl') || canvas.getContext('exprimental-webgl') ;
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    // compile shader and use program
    let renderProgram = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
 
    gl.useProgram(renderProgram);

    // renderProgram.u_Position = gl.getUniformLocation(renderProgram, 'u_Position');
    // renderProgram.u_FragColor = gl.getUniformLocation(renderProgram, 'u_FragColor');
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // mouse and key event...
    canvas.onmousedown = function(ev){click(ev, canvas, gl, renderProgram)};
    document.onkeydown = function(ev){keydown(ev)};
    
    // draw(gl, renderProgram);
}


function keydown(ev){ 
    if(ev.key == 'r'){
        colorFlag = 'r';
        R = 1.0;
        G = 0.0;
        B = 0.0;
    }
    else if(ev.key == 'g'){
        colorFlag = 'g';
        R = 0.0;
        G = 1.0;
        B = 0.0;
    }
    else if(ev.key == 'b'){
        colorFlag = 'b';
        R = 0.0;
        G = 0.0;
        B = 1.0;
    }
    else if(ev.key == 'p') shapeFlag = 'p';
    else if(ev.key == 'h') shapeFlag = 'h';
    else if(ev.key == 'v') shapeFlag = 'v';
    else if(ev.key == 't') shapeFlag = 't';
    else if(ev.key == 'q') shapeFlag = 'q';
    else if(ev.key == 'c') shapeFlag = 'c';
}

function click(ev, canvas, gl, renderProgram){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    console.log(shapeFlag)
    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2)
    y = (canvas.width/2 - (y - rect.top))/(canvas.height/2)

    if(shapeFlag == 'p') {
        if(g_points.length/5 >= 5) {
            var array =  Array.prototype.slice.call(g_points);
            var newA = array.slice(5, g_points.length);
            g_points = new Float32Array([...newA, x, y, R, G, B]);
        }
        else g_points = new Float32Array([...g_points, x, y, R, G, B]);
        shape = 0;
    }
    if(shapeFlag == 'h') {
        if(g_horiLines.length/5 >= 10) {
            var array =  Array.prototype.slice.call(g_horiLines);
            var newA = array.slice(10, g_horiLines.length);
            g_horiLines = new Float32Array([...newA, -1.0, y, R, G, B, 1.0, y, R, G, B]);
        }
        else g_horiLines = new Float32Array([...g_horiLines, -1.0, y, R, G, B, 1.0, y, R, G, B]);
        shape = 1;
    }
    if(shapeFlag == 'v') {
        if(g_vertiLines.length/5 >= 10) {
            var array =  Array.prototype.slice.call(g_vertiLines);
            var newA = array.slice(10, g_vertiLines.length);
            g_vertiLines = new Float32Array([...newA, x, -1.0, R, G, B, x, 1.0, R, G, B]);
        }
        else g_vertiLines = new Float32Array([...g_vertiLines, x, -1.0, R, G, B, x, 1.0, R, G, B]);
        shape = 2;
    }
    if(shapeFlag == 't') {
        if(g_triangles.length/5 >= 15) {
            var array =  Array.prototype.slice.call(g_triangles);
            var newA = array.slice(15, g_triangles.length);
            g_triangles = new Float32Array([...newA, x-0.03, y-0.02, R, G, B, x, y+0.03, R, G, B, x+0.03, y-0.02, R, G, B]);
        }
        else g_triangles = new Float32Array([...g_triangles, x-0.03, y-0.02, R, G, B, x, y+0.03, R, G, B, x+0.03, y-0.02, R, G, B]);
        shape = 3;
    }
    if(shapeFlag == 'q') {
        if(g_squares.length/5 >= 5) {
            var array =  Array.prototype.slice.call(g_squares);
            var newA = array.slice(5, g_squares.length);
            g_squares = new Float32Array([...newA, x, y, R, G, B]);
        }
        else g_squares = new Float32Array([...g_squares, x, y, R, G, B]);
        shape = 4;
    }
    if(shapeFlag == 'c') {
        if(g_circles.length/5 >= 5) {
            var array =  Array.prototype.slice.call(g_circles);
            var newA = array.slice(5, g_circles.length);
            g_circles = new Float32Array([...newA, x, y, R, G, B]);
        }
        else g_circles = new Float32Array([...g_circles, x, y, R, G, B]);
        shape = 5;
    }

    draw(x, y, gl, renderProgram);
}




function initVertexBuffers(x, y, gl, program, PointArray){
    vertices = new Float32Array([...PointArray]);

    var n = vertices.length / 5;


    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var FSIZE = vertices.BYTES_PER_ELEMENT;
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

function shapeAndInit(x, y, gl, renderProgram, points, shape){
    var u_shape = gl.getUniformLocation(renderProgram, 'u_shape');
    var u_shape_v = gl.getUniformLocation(renderProgram, 'u_shape_v');
    gl.uniform1i(u_shape, shape);
    gl.uniform1i(u_shape_v, shape);
    var n = initVertexBuffers(x, y, gl, renderProgram, points);
    return n;
}

function draw(x, y, gl, renderProgram){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var n_p = shapeAndInit(x, y, gl, renderProgram, g_points, 0);
    gl.drawArrays(gl.POINTS, 0, n_p);

    var n_h = shapeAndInit(x, y, gl, renderProgram, g_horiLines, 1);
    gl.drawArrays(gl.LINES, 0, n_h);

    var n_v = shapeAndInit(x, y, gl, renderProgram, g_vertiLines, 2);
    gl.drawArrays(gl.LINES, 0, n_v);

    var n_t = shapeAndInit(x, y, gl, renderProgram, g_triangles, 3);
    gl.drawArrays(gl.TRIANGLES, 0, n_t);

    var n_q = shapeAndInit(x, y, gl, renderProgram, g_squares, 4);
    gl.drawArrays(gl.POINTS, 0, n_q);

    var n_c = shapeAndInit(x, y, gl, renderProgram, g_circles, 5);
    gl.drawArrays(gl.POINTS, 0, n_c);
    
}
