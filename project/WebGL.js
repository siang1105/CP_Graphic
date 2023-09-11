var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var mdlMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 12.5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
// var lightX = -5, lightY = 10, lightZ = 4;
// var lightX = 0, lightY = 0, lightZ = 12.5;
var lightX = 1, lightY = 5, lightZ = 6.5;
var offScreenWidth = 2048, offScreenHeight = 2048;
var foxObj;
var bench = [];
var christmas_tree = [];
var cube = [];
var sphere = [];
var mvpFromLight = [];
var matStack = [];
var textures = {};
var snowTranslate = 8.5;
var robotSize = 0;

var imgNames = ["normalMap.jpeg", "3Dmodel/fox/texture.png", "3Dmodel/christmas/tree_image.jpg", "3Dmodel/christmas/tree.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/wood texture.jpg", "3Dmodel/park-bench/531305 (1).jpg", "3Dmodel/park-bench/download.jpeg", "3Dmodel/house-tree/AlternatingBrick-ColorMap.png", "3Dmodel/house-tree/Window.png", "3Dmodel/house-tree/door.jpg", "3Dmodel/house-tree/floor.jpg", "3Dmodel/house-tree/leafs.jpg", "3Dmodel/house-tree/roof.jpg", "3Dmodel/house-tree/trunk.jpg", "3Dmodel/house-tree/grass.jpg"];
var objCompImgIndex = ["3Dmodel/park-bench/531305 (1).jpg", "3Dmodel/park-bench/download.jpeg", "3Dmodel/park-bench/531305 (1).jpg"];
var objCompImgIndex2 = ["3Dmodel/christmas/tree_image.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/tree.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg",
                        "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/tree.jpg", "3Dmodel/christmas/tree.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg",
                        "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/wood texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/wood texture.jpg", 
                        "3Dmodel/christmas/tree.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg", "3Dmodel/christmas/gold texture.jpg"];
var objCompImgIndex3 = ["3Dmodel/fox/texture.png"];

var texCount = 0;
var numTextures = imgNames.length;

var quadObj;
var cubeMapTex;

var fbo;
var shadow_fbo;

var rotateAngle = 0;
var thirdVision = false;
var viewAngle = 70;


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
    programEnvCube.u_viewDirectionProjectionInverse = gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse'); 
    quadObj = initVertexBufferForLaterUse(gl, quad);
    cubeMapTex = initCubeTexture("env/px.png", "env/nx.png", "env/py.png", "env/ny.png", 
                                      "env/pz.png", "env/nz.png", 2048, 2048)
    
    programTextureOnCube = compileShader(gl, VSHADER_SOURCE_TEXTURE_ON_CUBE, FSHADER_SOURCE_TEXTURE_ON_CUBE);
    programTextureOnCube.a_Position = gl.getAttribLocation(programTextureOnCube, 'a_Position'); 
    programTextureOnCube.a_Normal = gl.getAttribLocation(programTextureOnCube, 'a_Normal'); 
    programTextureOnCube.u_MvpMatrix = gl.getUniformLocation(programTextureOnCube, 'u_MvpMatrix'); 
    programTextureOnCube.u_modelMatrix = gl.getUniformLocation(programTextureOnCube, 'u_modelMatrix'); 
    programTextureOnCube.u_normalMatrix = gl.getUniformLocation(programTextureOnCube, 'u_normalMatrix');
    programTextureOnCube.u_ViewPosition = gl.getUniformLocation(programTextureOnCube, 'u_ViewPosition');
    programTextureOnCube.u_envCubeMap = gl.getUniformLocation(programTextureOnCube, 'u_envCubeMap'); 
    programTextureOnCube.u_Color = gl.getUniformLocation(programTextureOnCube, 'u_Color'); 

    program_refraction = compileShader(gl, VSHADER_SOURCE_REFRACTION, FSHADER_SOURCE_REFRACTION);
    program_refraction.a_Position = gl.getAttribLocation(program_refraction, 'a_Position'); 
    program_refraction.a_Normal = gl.getAttribLocation(program_refraction, 'a_Normal'); 
    program_refraction.u_MvpMatrix = gl.getUniformLocation(program_refraction, 'u_MvpMatrix'); 
    program_refraction.u_modelMatrix = gl.getUniformLocation(program_refraction, 'u_modelMatrix'); 
    program_refraction.u_normalMatrix = gl.getUniformLocation(program_refraction, 'u_normalMatrix');
    program_refraction.u_ViewPosition = gl.getUniformLocation(program_refraction, 'u_ViewPosition');
    program_refraction.u_envCubeMap = gl.getUniformLocation(program_refraction, 'u_envCubeMap');
    program_refraction.u_reflection = gl.getUniformLocation(program_refraction, 'u_reflection');

    shadowProgram = compileShader(gl, VSHADER_SHADOW_SOURCE, FSHADER_SHADOW_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    
    fbo = initFrameBufferForCubemapRendering(gl);
    shadow_fbo = initFrameBuffer(gl);


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
    program.u_MvpMatrixOfLight = gl.getUniformLocation(program, 'u_MvpMatrixOfLight'); 
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_ShadowMap = gl.getUniformLocation(program, "u_ShadowMap");
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 
    u_tex = gl.getUniformLocation(program, 'u_tex');
    u_sha = gl.getUniformLocation(program, 'u_sha');
    u_bump = gl.getUniformLocation(program, 'u_bump');

    program.a_Tagent = gl.getAttribLocation(program, 'a_Tagent'); 
    program.a_Bitagent = gl.getAttribLocation(program, 'a_Bitagent'); 
    program.a_crossTexCoord = gl.getAttribLocation(program, 'a_crossTexCoord'); 
    program.u_SamplerBump = gl.getUniformLocation(program, 'u_SamplerBump');
    program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');


    foxObj = await loadOBJtoCreateVBO('3Dmodel/fox/low-poly-fox-by-pixelmannen.obj');

    response = await fetch('3Dmodel/sphere/sphere.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      sphere.push(o);
    }


    //3D model bench
    response = await fetch('3Dmodel/park-bench/park-bench.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      bench.push(o);
    }

    //3D model christmas_tree
    response = await fetch('3Dmodel/christmas/christmas-tree.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      christmas_tree.push(o);
    }

    //cube
    response = await fetch('3Dmodel/cube/cube.obj');
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


    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    draw();//draw it once before mouse move

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};

    var tick = function() {
      snowTranslate -= 0.05;
      rotateAngle += 0.25;
      if(snowTranslate < -7) snowTranslate = 8.5
      draw();
      requestAnimationFrame(tick);
    }
    tick();
}

function pushMatrix(){
    matStack.push(new Matrix4(mdlMatrix));
}
function popMatrix(){
    mdlMatrix = matStack.pop();
}

function draw(){

  drawObjectOffScreen();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  renderCubeMap(0, 0, 0);
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(program);

  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);
  let vpMatrix = new Matrix4();
  vpMatrix.setPerspective(viewAngle, 1, 1, 100);
  vpMatrix.lookAt(cameraX, cameraY, cameraZ,   
                  cameraX + newViewDir.elements[0], 
                  cameraY + newViewDir.elements[1],
                  cameraZ + newViewDir.elements[2], 
                  0, 1, 0);
  
  rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);
  var vpFromCamera = new Matrix4();
  vpFromCamera.setPerspective(viewAngle, 1, 1, 15);
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
  
  drawObject(vpMatrix);
  
  drawEnvMap(vpFromCamera);
  drawRefraction(vpMatrix);
  drawReflection(vpMatrix);

  let mdlMatrix = new Matrix4();
  mdlMatrix.setTranslate(-1, -1.5, 0);
  mdlMatrix.scale(0.7, 0.7, 0.7);
  drawObjectWithDynamicReflection(sphere, mdlMatrix, vpMatrix, 1, 1, 0.9);
}



function drawRefraction(vpMatrix){
  gl.useProgram(program_refraction);
  gl.depthFunc(gl.LESS);
  let modelMatrix = new Matrix4();
  modelMatrix.setScale(0.8, 0.8, 0.8);
  modelMatrix.translate(2.5, 2.5, 2.0);
  modelMatrix.rotate(rotateAngle, 1, 1, 1); 
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniform3f(program_refraction.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(program_refraction.u_envCubeMap, 0);
  gl.uniform1i(program_refraction.u_reflection, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniformMatrix4fv(program_refraction.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program_refraction.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program_refraction.u_normalMatrix, false, normalMatrix.elements);
  for( let i=0; i < cube.length; i ++ ){
    initAttributeVariable(gl, program_refraction.a_Position, cube[i].vertexBuffer);
    initAttributeVariable(gl, program_refraction.a_Normal, cube[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, cube[i].numVertices);
  }
}

function drawReflection(vpMatrix){
  gl.useProgram(program_refraction);
  gl.depthFunc(gl.LESS);
  let modelMatrix = new Matrix4();
  modelMatrix.setScale(0.8, 0.8, 0.8);
  modelMatrix.translate(-4.5, 2.5, 2.0);
  modelMatrix.rotate(rotateAngle, 1, 1, 1); 
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniform3f(program_refraction.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(program_refraction.u_envCubeMap, 0);
  gl.uniform1i(program_refraction.u_reflection, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniformMatrix4fv(program_refraction.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program_refraction.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program_refraction.u_normalMatrix, false, normalMatrix.elements);
  for( let i=0; i < cube.length; i ++ ){
    initAttributeVariable(gl, program_refraction.a_Position, cube[i].vertexBuffer);
    initAttributeVariable(gl, program_refraction.a_Normal, cube[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, cube[i].numVertices);
  }
}

function drawObjectOffScreen(){
  gl.useProgram(shadowProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadow_fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  mdlMatrix = new Matrix4(); //model matrix of objects
    
  //bench
  mdlMatrix.setIdentity();
  mdlMatrix.translate(-3, -6.5, 2.5);
  mdlMatrix.rotate(35, 0, 1, 0);
  mdlMatrix.scale(1.8, 1.8, 1.8);
  mvpFromLight.push(drawOffScreen(bench, mdlMatrix));

  //christmas_tree
  mdlMatrix.setIdentity();
  mdlMatrix.translate(4, -5.5, -3.0);
  mdlMatrix.rotate(-45, 0, 1, 0);
  mdlMatrix.scale(1.5, 1.5, 1.5);
  mvpFromLight.push(drawOffScreen(christmas_tree, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(7, snowTranslate, 2);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(4, snowTranslate, 2);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(3, snowTranslate, 2);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(1, snowTranslate, -10);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(5, snowTranslate, 2);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(-2, snowTranslate, 3);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

  mdlMatrix.setIdentity();
  mdlMatrix.translate(-3, snowTranslate, 3);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  mvpFromLight.push(drawOffScreen(sphere, mdlMatrix))

}



function drawObject(vpMatrix){
    mdlMatrix = new Matrix4(); //model matrix of objects
    
    //bench
    mdlMatrix.setIdentity();
    mdlMatrix.translate(-4, -6.5, 3.5);
    mdlMatrix.rotate(35, 0, 1, 0);
    mdlMatrix.scale(1.8, 1.8, 1.8);
    drawOneObject(bench, mdlMatrix, vpMatrix, 0.9, 0.5, 0, true, objCompImgIndex, mvpFromLight[0]);

    //christmas_tree
    mdlMatrix.setIdentity();
    mdlMatrix.translate(4, -5.5, -3.0);
    mdlMatrix.rotate(-45, 0, 1, 0);
    mdlMatrix.scale(1.5, 1.5, 1.5);
    drawOneObject(christmas_tree, mdlMatrix, vpMatrix, 0.6, 0.8, 1, true, objCompImgIndex2, mvpFromLight[1]);


    mdlMatrix.setIdentity();
    mdlMatrix.translate(7, snowTranslate, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[2]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(4, snowTranslate, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[3]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(3, snowTranslate, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[4]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(1, snowTranslate, 5);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[5]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(-1, snowTranslate, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[6]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(-3, snowTranslate, 2);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[7]);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(-4, snowTranslate, 3);
    mdlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, mdlMatrix, vpMatrix, 1, 1, 1, false, null, mvpFromLight[8]);


    if(thirdVision == true){
      mdlMatrix.setIdentity();
      mdlMatrix.setTranslate(0, -5, 12.5);
      // mdlMatrix.setTranslate(0, -5, 5.5);
      mdlMatrix.rotate(180, 0, 1, 0);
      mdlMatrix.scale(0.03, 0.03, 0.03);
      drawObjectFox(foxObj, mdlMatrix, vpMatrix, 1, 1, 1, true, objCompImgIndex3);
    }
}

function drawEnvMap(vpFromCamera){
      var vpFromCameraInverse = vpFromCamera.invert();
      gl.useProgram(programEnvCube);
      gl.depthFunc(gl.LEQUAL);
      gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
      gl.uniform1i(programEnvCube.u_envCubeMap, 0);
      initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
} 

function drawOffScreen(obj, mdlMatrix){
  var mvpFromLight = new Matrix4();
  //model Matrix (part of the mvp matrix)
  let modelMatrix = new Matrix4();
  modelMatrix.multiply(mdlMatrix);
  //mvp: projection * view * model matrix  
  mvpFromLight.setPerspective(70, offScreenWidth/offScreenHeight, 1, 15);
  mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
  mvpFromLight.multiply(modelMatrix);

  gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, mvpFromLight.elements);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, shadowProgram.a_Position, obj[i].vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }

  return mvpFromLight;
}


function drawOneObjectPreProcessing(mdlMatrix, vpMatrix, colorR, colorG, colorB, mvpFromLight){
    var formMatrix = new Float32Array( [
      1 + robotSize, 0.0, 0.0, 0.0,
      0.0, 1 + robotSize, 0.0, 0.0,
      0.0, 0.0, 1, 0.0,
      0.0, 0.0, 0.0, 1.0
    ])

    gl.useProgram(program);
    let mvpMatrix = new Matrix4();
    let normalMatrix = new Matrix4();
    mvpMatrix.set(vpMatrix);
    mvpMatrix.multiply(mdlMatrix);

    //normal matrix
    normalMatrix.setInverseOf(mdlMatrix);
    normalMatrix.transpose();
    
    gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);
    gl.uniform1i(program.u_ShadowMap, 1);
    gl.uniform1i(u_sha, 1);
    gl.uniform1i(u_bump, 0);

    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(program.u_scaleMatrix, false, formMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrixOfLight, false, mvpFromLight.elements);

    gl.activeTexture(gl.TEXTURE1);   
    gl.bindTexture(gl.TEXTURE_2D, shadow_fbo.texture); 
}

function drawOneObject(obj, mdlMatrix, vpMatrix, colorR, colorG, colorB, Tex, index, mvpFromLight){
    drawOneObjectPreProcessing(mdlMatrix, vpMatrix, colorR, colorG, colorB, mvpFromLight)
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

function drawObjectFox(obj, mdlMatrix, vpMatrix, colorR, colorG, colorB, Tex, index){
  var formMatrix = new Float32Array( [
    1 + robotSize, 0.0, 0.0, 0.0,
    0.0, 1 + robotSize, 0.0, 0.0,
    0.0, 0.0, 1, 0.0,
    0.0, 0.0, 0.0, 1.0
  ])

  gl.useProgram(program);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(mdlMatrix);

  //normal matrix
  normalMatrix.setInverseOf(mdlMatrix);
  normalMatrix.transpose();
  
  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 10.0);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);
  gl.uniform1i(u_sha, 0);
  gl.uniform1i(u_bump, 1);
  gl.uniform1i(program.u_SamplerBump, 2);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(program.u_scaleMatrix, false, formMatrix);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, textures["normalMap.jpeg"]); 

  if(Tex == true) {
    gl.uniform1i(u_tex, 1);
    gl.uniform1i(program.u_Sampler, 3);
  }
  else gl.uniform1i(u_tex, 0);

  for( let i=0; i < obj.length; i ++ ){
    if(Tex == true){
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, textures[index[i]]);
    }
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    if(Tex == true) initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    initAttributeVariable(gl, program.a_Tagent, obj[i].tagentsBuffer);
    initAttributeVariable(gl, program.a_Bitagent, obj[i].bitagentsBuffer);
    initAttributeVariable(gl, program.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
  if(Tex == true) gl.bindTexture(gl.TEXTURE_2D, null); 
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

function initFrameBufferForCubemapRendering(gl){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // 6 2D textures
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, 
                  gl.RGBA, offScreenWidth, offScreenHeight, 0, gl.RGBA, 
                  gl.UNSIGNED_BYTE, null);
  }

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the depth buffer to it (no color buffer here)
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);

  frameBuffer.texture = texture;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return frameBuffer;
}

function renderCubeMap(camX, camY, camZ)
{
  
  //camera 6 direction to render 6 cubemap faces
  var ENV_CUBE_LOOK_DIR = [
      [1.0, 0.0, 0.0],
      [-1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0]
  ];

  //camera 6 look up vector to render 6 cubemap faces
  var ENV_CUBE_LOOK_UP = [
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0],
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0]
  ];
  
  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.4, 0.4, 0.4,1);
  for (var side = 0; side < 6;side++){
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, fbo.texture, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(90, 1, 1, 100);
    vpMatrix.lookAt(camX, camY, camZ,   
                    camX + ENV_CUBE_LOOK_DIR[side][0], 
                    camY + ENV_CUBE_LOOK_DIR[side][1],
                    camZ + ENV_CUBE_LOOK_DIR[side][2], 
                    ENV_CUBE_LOOK_UP[side][0],
                    ENV_CUBE_LOOK_UP[side][1],
                    ENV_CUBE_LOOK_UP[side][2]);
    
    drawObject(vpMatrix);
    drawEnvMap(vpMatrix)
    
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
}

function drawObjectWithDynamicReflection(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(programTextureOnCube);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(programTextureOnCube.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform3f(programTextureOnCube.u_Color, colorR, colorG, colorB);

  gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_normalMatrix, false, normalMatrix.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, fbo.texture);
  gl.uniform1i(programTextureOnCube.u_envCubeMap, 0);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, programTextureOnCube.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, programTextureOnCube.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
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
  return frameBuffer;
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
      // cameraX += (newViewDir.elements[0] * 0.1);
      // cameraY += (newViewDir.elements[1] * 0.1);
      // cameraZ += (newViewDir.elements[2] * 0.1);
      viewAngle -= 0.5;
  }
  else if(ev.key == 's'){ 
      // cameraX -= (newViewDir.elements[0] * 0.1);
      // cameraY -= (newViewDir.elements[1] * 0.1);
      // cameraZ -= (newViewDir.elements[2] * 0.1);
      viewAngle += 0.5;
  }
  else if(ev.key == 'a'){ 
      angleX += 0.5;
  }
  else if(ev.key == 'd'){ 
    angleX -= 0.5;
  }

  else if(ev.key == 'f'){
    thirdVision = false;
    viewAngle = 70
    cameraX = 0, cameraY = 0, cameraZ = 12.5;
  }
  else if(ev.key == 't'){
    thirdVision = true;
    viewAngle = 75
    cameraX = -4, cameraY = 5, cameraZ = 28;
  }

  console.log(cameraX, cameraY, cameraZ)
  draw();
}

function calculateTangentSpace(position, texcoord){
  //iterate through all triangles
  let tagents = [];
  let bitagents = [];
  let crossTexCoords = [];
  for( let i = 0; i < position.length/9; i++ ){
    let v00 = position[i*9 + 0];
    let v01 = position[i*9 + 1];
    let v02 = position[i*9 + 2];
    let v10 = position[i*9 + 3];
    let v11 = position[i*9 + 4];
    let v12 = position[i*9 + 5];
    let v20 = position[i*9 + 6];
    let v21 = position[i*9 + 7];
    let v22 = position[i*9 + 8];
    let uv00 = texcoord[i*6 + 0];
    let uv01 = texcoord[i*6 + 1];
    let uv10 = texcoord[i*6 + 2];
    let uv11 = texcoord[i*6 + 3];
    let uv20 = texcoord[i*6 + 4];
    let uv21 = texcoord[i*6 + 5];

    let deltaPos10 = v10 - v00;
    let deltaPos11 = v11 - v01;
    let deltaPos12 = v12 - v02;
    let deltaPos20 = v20 - v00;
    let deltaPos21 = v21 - v01;
    let deltaPos22 = v22 - v02;

    let deltaUV10 = uv10 - uv00;
    let deltaUV11 = uv11 - uv01;
    let deltaUV20 = uv20 - uv00;
    let deltaUV21 = uv21 - uv01;

    let r = 1.0 / (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20);
    for( let j=0; j< 3; j++ ){
      crossTexCoords.push( (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20) );
    }
    let tangentX = (deltaPos10 * deltaUV21 - deltaPos20 * deltaUV11)*r;
    let tangentY = (deltaPos11 * deltaUV21 - deltaPos21 * deltaUV11)*r;
    let tangentZ = (deltaPos12 * deltaUV21 - deltaPos22 * deltaUV11)*r;
    for( let j = 0; j < 3; j++ ){
      tagents.push(tangentX);
      tagents.push(tangentY);
      tagents.push(tangentZ);
    }
    let bitangentX = (deltaPos20 * deltaUV10 - deltaPos10 * deltaUV20)*r;
    let bitangentY = (deltaPos21 * deltaUV10 - deltaPos11 * deltaUV20)*r;
    let bitangentZ = (deltaPos22 * deltaUV10 - deltaPos12 * deltaUV20)*r;
    for( let j = 0; j < 3; j++ ){
      bitagents.push(bitangentX);
      bitagents.push(bitangentY);
      bitagents.push(bitangentZ);
    }
  }
  let obj = {};
  obj['tagents'] = tagents;
  obj['bitagents'] = bitagents;
  obj['crossTexCoords'] = crossTexCoords;
  return obj;
}

async function loadOBJtoCreateVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let tagentSpace = calculateTangentSpace(obj.geometries[i].data.position, 
                                            obj.geometries[i].data.texcoord);
    let o = initVertexBufferForLaterUse(gl, 
                                        obj.geometries[i].data.position,
                                        obj.geometries[i].data.normal, 
                                        obj.geometries[i].data.texcoord,
                                        tagentSpace.tagents,
                                        tagentSpace.bitagents,
                                        tagentSpace.crossTexCoords);
    objComponents.push(o);
  }
  return objComponents;
}



