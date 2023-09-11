var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_scaleMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;

    void main(){
        gl_Position = u_MvpMatrix * a_Position * u_scaleMatrix;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
        
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform sampler2D u_Sampler;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    uniform int u_tex;
    
    void main(){
        // let ambient and diffuse color are u_Color
        // (you can also input them from ouside and make them different)
        
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        if(u_tex == 1){
          vec3 texColor = texture2D( u_Sampler, v_TexCoord ).rgb;
          ambientLightColor = texColor;
          diffuseLightColor = texColor;
        }
        else{
          ambientLightColor = u_Color;
          diffuseLightColor = u_Color;
        }
        
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

var VSHADER_SOURCE_ENVCUBE = `
  attribute vec4 a_Position;
  varying vec4 v_Position;
  void main() {
    v_Position = a_Position;
    gl_Position = a_Position;
  } 
`;

var FSHADER_SOURCE_ENVCUBE = `
  precision mediump float;
  uniform samplerCube u_envCubeMap;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_Position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_Position;
    gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
  }
`;


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

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}




function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}
/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

///// normal vector calculation (for the cube)
function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var mdlMatrix;
var nVertex;
// var cameraX = 3.5, cameraY = 3.5, cameraZ = 7.5;
// var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
var cameraX = 0.5, cameraY = 3, cameraZ = 9.5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
var bench = [];
var house_tree = [];
var cube = [];
var rect = [];
var sphere = [];
var pyramid = [];
var cube = [];
var moveDistanceX = 0;
var moveDistanceY = 0;
var SPHERE_DIV = 150;
var i, ai, si, ci;
var j, aj, sj, cj;
var p1, p2;
var Svertices = [];
var sphereVertice = [];
var joint1 = 0;
var joint2 = 0;
var joint3 = 0;
var joint4 = 0;
var robotSize = 0;
var textures = {};

var imgNames = ["531305 (1).jpg", "download.jpeg", "AlternatingBrick-ColorMap.png", "Window.png", "door.jpg", "floor.jpg", "leafs.jpg", "roof.jpg", "trunk.jpg", "grass.jpg"];
var objCompImgIndex = ["531305 (1).jpg", "download.jpeg", "531305 (1).jpg"];
var objCompImgIndex2 = ["grass.jpg", "Window.png", "Window.png", "AlternatingBrick-ColorMap.png", 
                       "door.jpg", "floor.jpg", "Window.png", "roof.jpg", 
                       "leafs.jpg", "trunk.jpg"];
var texCount = 0;
var numTextures = imgNames.length;

var quadObj;
var cubeMapTex;

var offScreenWidth = 0, offScreenHeight = 0;
var fbo;



async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }
    offScreenWidth = canvas.width;
    offScreenHeight = canvas.height;
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);

    var quad = new Float32Array(
      [
        -1, -1, 1,
         1, -1, 1,
        -1,  1, 1,
        -1,  1, 1,
         1, -1, 1,
         1,  1, 1
      ]); //just a quad

    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position'); 
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap'); 
    programEnvCube.u_viewDirectionProjectionInverse = 
               gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse'); 
    quadObj = initVertexBufferForLaterUse(gl, quad);
    cubeMapTex = initCubeTexture("posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", 
                                      "posz.jpg", "negz.jpg", 2048, 2048)
    

    
    fbo = initFrameBuffer(gl);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_scaleMatrix = gl.getUniformLocation(program, 'u_scaleMatrix' );
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 
    u_tex = gl.getUniformLocation(program, 'u_tex');


    
    //3D model bench
    response = await fetch('park-bench.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      bench.push(o);
    }

    //3D model house_tree
    response = await fetch('house-tree.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      house_tree.push(o);
    }

    //cube
    response = await fetch('cube.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      cube.push(o);
    }

    for( let i=0; i < imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, imgNames[i]);};
      image.src = imgNames[i];
    }

    
 
    //sphere
    for (j = 0; j <= SPHERE_DIV; j++){
      aj = j * Math.PI / SPHERE_DIV;
      sj = Math.sin(aj);
      cj = Math.cos(aj);
      for (i = 0; i <= SPHERE_DIV; i++) {
        ai = i * 2 * Math.PI / SPHERE_DIV;
        si = Math.sin(ai);
        ci = Math.cos(ai);
        Svertices.push(si * sj);  // X
        Svertices.push(cj);       // Y
        Svertices.push(ci * sj);  // Z
      }
    }
    for (j = 0; j < SPHERE_DIV; j++){
      for (i = 0; i < SPHERE_DIV; i++){
        p1 = j * (SPHERE_DIV+1) + i;
        p2 = p1 + (SPHERE_DIV+1);
        sphereVertice.push(Svertices[p1 * 3], Svertices[p1 * 3 + 1], Svertices[p1 * 3 + 2]);
        sphereVertice.push(Svertices[p2 * 3], Svertices[p2 * 3 + 1], Svertices[p2 * 3 + 2]);
        p1 = p1 + 1;
        sphereVertice.push(Svertices[p1 * 3], Svertices[p1 * 3 + 1], Svertices[p1 * 3 + 2]);
        sphereVertice.push(Svertices[p1 * 3], Svertices[p1 * 3 + 1], Svertices[p1 * 3 + 2]);
        sphereVertice.push(Svertices[p2 * 3], Svertices[p2 * 3 + 1], Svertices[p2 * 3 + 2]);
        p2 = p2 + 1;
        sphereVertice.push(Svertices[p2 * 3], Svertices[p2 * 3 + 1], Svertices[p2 * 3 + 2]);
      }
    }

    sphereNormals = getNormalOnVertices(sphereVertice);
    o = initVertexBufferForLaterUse(gl, sphereVertice, sphereNormals, null);
    sphere.push(o);
    


    //pyramid
    pyramidVertices = [ -1, 1, 1, 0, -1, 0, 1, 1, 1,
                        1, 1, 1, 0, -1, 0, 1, 1, -1,
                        1, 1, -1, 0, -1, 0, -1, 1, -1,
                        -1, 1, -1, 0, -1, 0, -1, 1, 1,
                        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1
                ]
    pyramidNormals = getNormalOnVertices(pyramidVertices);
    o = initVertexBufferForLaterUse(gl, pyramidVertices, pyramidNormals, null);
    pyramid.push(o);

    

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    draw();//draw it once before mouse move
    drawOffScreen();

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};

    var sliderMoveX = document.getElementById("movex");
    sliderMoveX.oninput = function() {
        if(this.value > 0) joint1 = -1 * (this.value / 4.5)
        else joint1 = -1 * (this.value / 2)
        joint2 = joint1
        joint3 = joint2
        joint4 = joint3
        moveDistanceX = this.value/60.0/2
        draw();
    }

    var sliderMoveY = document.getElementById("movey");
    sliderMoveY.oninput = function() {
        if(this.value > 0) joint1 = -1 * (this.value / 4.5)
        else joint1 = -1 * (this.value / 2)
        joint2 = joint1
        joint3 = joint2
        joint4 = joint3
        moveDistanceY = this.value/60.0/1.7
        draw();
    }

    var joint1Slider = document.getElementById("joint1");
    joint1Slider.oninput = function() {
        joint1 = this.value;
        draw();
    }

    
    var joint2Slider = document.getElementById("joint2");
    joint2Slider.oninput = function() {
        joint2 = this.value; 
        draw();
    }

    
    var joint3Slider = document.getElementById("joint3");
    joint3Slider.oninput = function() {
        joint3 = this.value; 
        draw();
    }

    var joint4Slider = document.getElementById("joint4");
    joint4Slider.oninput = function() {
        joint4 = this.value; 
        draw();
    }

    var sizeSlider = document.getElementById("robotSize");
    sizeSlider.oninput = function() {
        robotSize = this.value; 
        robotSize = robotSize / 45;
        draw();
    }
}

/////Call drawOneObject() here to draw all object one by one 
////   (setup the model matrix and color to draw)

var matStack = [];

function pushMatrix(){
    matStack.push(new Matrix4(mdlMatrix));
}
function popMatrix(){
    mdlMatrix = matStack.pop();
}

function draw(){
  // drawOffScreen();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(program);
  
  drawObject();
  drawOnScreen();
  cubeMap();
}

function drawOffScreen(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.8, 0.6, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);
    drawObject();
}

function drawOnScreen(){
    mdlMatrix = new Matrix4();
    mdlMatrix.setIdentity();
    mdlMatrix.translate(2, 1.5, -1.5);
    mdlMatrix.scale(0.4, 0.4, 0.4);
    drawOneObjectOnscreen(cube, mdlMatrix, 0.9, 0.8, 0.6);
}


function drawObject(){
    mdlMatrix = new Matrix4(); //model matrix of objects
    //Cube (ground)
    //TODO-1: set mdlMatrix for the cube
    
    mdlMatrix.setScale(1.3, 0.1, 1.3);
    drawOneObject(cube, mdlMatrix, 0.9, 0.8, 0.6);
    

    //bench
    mdlMatrix.setIdentity();
    mdlMatrix.translate(-0.7, 0.25, 0.1);
    mdlMatrix.scale(0.3, 0.3, 0.3);
    drawOneObject(bench, mdlMatrix, 0.9, 0.5, 0, true, objCompImgIndex);

    //house_tree
    mdlMatrix.setIdentity();
    mdlMatrix.translate(0.5, 0.08, -1.0);
    mdlMatrix.scale(0.15, 0.15, 0.15);
    drawOneObject(house_tree, mdlMatrix, 0.6, 0.8, 1, true, objCompImgIndex2);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(moveDistanceX, 0, moveDistanceY);
    mdlMatrix.translate(-0.3, 0.25, 0.6);
    pushMatrix();
    mdlMatrix.scale(0.2, 0.15, 0.15);
    drawOneObject(cube, mdlMatrix, 1.0, 0.6, 0.5, false);

    popMatrix();
    mdlMatrix.translate(0, 0.2, 0.0);
    mdlMatrix.rotate(joint1, 0, 0, 1);
    pushMatrix();
    mdlMatrix.scale(0.05, 0.05, 0.05);
    drawOneObject(sphere, mdlMatrix, 0.1, 0.5, 0.0, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    pushMatrix();
    mdlMatrix.scale(0.025, 0.08, 0.025);
    drawOneObject(cube, mdlMatrix, 0.6, 0.9, 0.1, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    mdlMatrix.rotate(joint2, 0, 0, 1);
    pushMatrix();
    mdlMatrix.scale(0.05, 0.05, 0.05);
    drawOneObject(sphere, mdlMatrix, 0.1, 0.5, 0.0, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    pushMatrix();
    mdlMatrix.scale(0.025, 0.08, 0.025);
    drawOneObject(cube, mdlMatrix, 0.6, 0.9, 0.1, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    mdlMatrix.rotate(joint3, 0, 0, 1);
    pushMatrix();
    mdlMatrix.scale(0.05, 0.05, 0.05);
    drawOneObject(sphere, mdlMatrix, 0.1, 0.5, 0.0, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    pushMatrix();
    mdlMatrix.scale(0.025, 0.08, 0.025);
    drawOneObject(cube, mdlMatrix, 0.6, 0.9, 0.1, false);

    popMatrix();
    mdlMatrix.translate(0, 0.12, 0.0);
    mdlMatrix.rotate(joint4, 0, 0, 1);
    pushMatrix();
    mdlMatrix.scale(0.05, 0.05, 0.05);
    drawOneObject(sphere, mdlMatrix, 0.1, 0.5, 0.0, false);

    popMatrix();
    mdlMatrix.translate(0, 0.14, 0.0);
    pushMatrix();
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(pyramid, mdlMatrix, 1.0, 0.2, 0.3, false);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(-1, 2, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, 0.6, 0.8, 1, false);
}

function cubeMap(){
    let rotateMatrix = new Matrix4();
      rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
      rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
      var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
      var newViewDir = rotateMatrix.multiplyVector3(viewDir);
      var vpFromCamera = new Matrix4();
      vpFromCamera.setPerspective(60, 1, 1, 15);
      var viewMatrixRotationOnly = new Matrix4();
      viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ, 
        cameraX + newViewDir.elements[0], 
        cameraY + newViewDir.elements[1], 
        cameraZ + newViewDir.elements[2], 
        0, 1, 0);
      viewMatrixRotationOnly.elements[12] = 0; //ignore translation
      viewMatrixRotationOnly.elements[13] = 0;
      viewMatrixRotationOnly.elements[14] = 0;
      vpFromCamera.multiply(viewMatrixRotationOnly);
      var vpFromCameraInverse = vpFromCamera.invert();
      gl.useProgram(programEnvCube);
      gl.depthFunc(gl.LEQUAL);
      gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, 
                          false, vpFromCameraInverse.elements);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
      gl.uniform1i(programEnvCube.u_envCubeMap, 0);
      initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
} 

function drawOneObjectPreProcessing(mdlMatrix, colorR, colorG, colorB){
    var formMatrix = new Float32Array( [
      1 + robotSize, 0.0, 0.0, 0.0,
      0.0, 1 + robotSize, 0.0, 0.0,
      0.0, 0.0, 1, 0.0,
      0.0, 0.0, 0.0, 1.0
    ])

    // modelMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    // modelMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    modelMatrix.setTranslate(angleX/25, -angleY/25, 0.0);
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, -1, 2, 2);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(program.u_scaleMatrix, false, formMatrix);
}

function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB, Tex, index){
    drawOneObjectPreProcessing(mdlMatrix, colorR, colorG, colorB)
    if(Tex == true) {
      gl.uniform1i(u_tex, 1);
      gl.uniform1i(program.u_Sampler, 0);
    }
    else gl.uniform1i(u_tex, 0);

    for( let i=0; i < obj.length; i ++ ){
      if(Tex == true){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[index[i]]);
      }
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      if(Tex == true) initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
    if(Tex == true) gl.bindTexture(gl.TEXTURE_2D, null); 
}


function drawOneObjectOnscreen(obj, mdlMatrix, colorR, colorG, colorB){
    drawOneObjectPreProcessing(mdlMatrix, colorR, colorG, colorB);
    gl.uniform1i(u_tex, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.uniform1i(program.u_Sampler, 0);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);

      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
    gl.bindTexture(gl.TEXTURE_2D, null); 
}

function initTexture(gl, img, imgName){
    var tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    textures[imgName] = tex;

    texCount++;
    gl.bindTexture(gl.TEXTURE_2D, null); 
    if( texCount == numTextures) {
      draw();
      drawOffScreen();
    }
}

function initCubeTexture(posXName, negXName, posYName, negYName, posZName, negZName, imgWidth, imgHeight){
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        fName: posXName,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        fName: negXName,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        fName: posYName,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        fName: negYName,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        fName: posZName,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        fName: negZName,
      },
    ];
    faceInfos.forEach((faceInfo) => {
      const {target, fName} = faceInfo;
      // setup each face so it's immediately renderable
      gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0, 
      gl.RGBA, gl.UNSIGNED_BYTE, null);
      
      var image = new Image();
      image.onload = function(){
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      };
      image.src = fName;
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    return texture;
} 

function initFrameBuffer(gl){
    //create and set up a texture object as the color buffer
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight,
                    0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    
    //create and setup a render buffer as the depth buffer
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                            offScreenWidth, offScreenHeight);
    
    //create and setup framebuffer: linke the color and depth buffer to it
    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                              gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                                gl.RENDERBUFFER, depthBuffer);
    frameBuffer.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, null); 
    return frameBuffer;
}


function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    if(angleX > 180) angleX = angleX - 360;
    if(angleY > 180) angleX = angleX - 360;

    if(angleX < -180) angleX = angleX + 360;
    if(angleY < -180) angleX = angleX + 360;
    mouseLastX = x;
    mouseLastY = y;

    draw();
}

function keydown(ev){ 
  //implment keydown event here
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  if(ev.key == 'w'){ 
      cameraX += (newViewDir.elements[0] * 0.1);
      cameraY += (newViewDir.elements[1] * 0.1);
      cameraZ += (newViewDir.elements[2] * 0.1);
  }
  else if(ev.key == 's'){ 
    cameraX -= (newViewDir.elements[0] * 0.1);
    cameraY -= (newViewDir.elements[1] * 0.1);
    cameraZ -= (newViewDir.elements[2] * 0.1);
  }

  console.log(cameraX, cameraY, cameraZ)
  draw();
}
