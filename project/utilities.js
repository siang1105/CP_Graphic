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
  
  
// function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
//     var nVertices = vertices.length / 3;

//     var o = new Object();
//     o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
//     if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
//     if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
//     //you can have error check here
//     o.numVertices = nVertices;

//     gl.bindBuffer(gl.ARRAY_BUFFER, null);
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

//     return o;
// }
function initVertexBufferForLaterUse(gl, vertices, normals, texCoords, tagents, bitagents, crossTexCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  if( tagents != null ) o.tagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(tagents), 3, gl.FLOAT);
  if( bitagents != null ) o.bitagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(bitagents), 3, gl.FLOAT);
  if( crossTexCoords != null ) o.crossTexCoordsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(crossTexCoords), 1, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

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

