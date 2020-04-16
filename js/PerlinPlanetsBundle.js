(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight);

document.body.appendChild( renderer.domElement );
// Our Javascript will go here.

//******************************************
// Returns a face of resolution^2 vertices
// Faces upwards
// Normals and material not yet applied
// Now normalized to make a sphere
//******************************************
function generateFace(resolution) {
    const face = new THREE.Geometry();

    // Create vertices as a percentage of each face axis, except y, which is 1
    for(var x = 0; x<resolution; x++){
        var x_percent = x/(resolution-1);
        for(var z = 0; z<resolution; z++){
            var z_percent = z/(resolution-1);

            var rm = Math.random();
            rm = 1+rm;
            // Push the vertices, based on the position calculations
            // face.vertices.push((new THREE.Vector3(2*x_percent-1, 1,  2*z_percent-1)).normalize());

            // Push the vertices, based on the position calculations
            face.vertices.push((new THREE.Vector3(2*x_percent-1, 1,  2*z_percent-1)).normalize());
        }
    }

    // Create faces for each vertice
    for(var row = 0; row<resolution-1; row++){
        for(var col = 0; col<resolution-1; col++){
            // calculate the position in the vertex vector
            var index = row*resolution+col;
            // Push top triangle
            face.faces.push(new THREE.Face3(index, index+1, index+1+resolution));
            // Push bottom triangle
            face.faces.push(new THREE.Face3(index, index+1+resolution, index+resolution));
        }
    }

    return face;
}

function geometryToObject(geometry){
    geometry.computeFaceNormals();

    // Alternate colors
    geometry.faces.forEach((face, index) => {
        if(index%2==0) {
            face.color = new THREE.Color('grey');
        }
        else {
            face.color = new THREE.Color('grey');
        }
    });
    
    geometry.faces[ 0].color = new THREE.Color('green');
    
    //geometry.rotateX(1.5708);
    
    var material = new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors});
    
    return (new THREE.Mesh(geometry, material));
}

//******************************************
// Makes 6 pieces of a sphere and then combines them
// Returns a "Sphere" that is actually 6 cube faces inflated into a ball
//******************************************

function basicSphere(resolution) {
    
    var faces = []

    var topFace = generateFace(resolution);
    faces.push(topFace);

    var bottomFace = generateFace(resolution);
    bottomFace.rotateX(Math.PI);
    faces.push(bottomFace);
    
    var xPlusFace = generateFace(resolution);
    xPlusFace.rotateZ(0.5*Math.PI);
    xPlusFace.rotateX(0.5*Math.PI);
    faces.push(xPlusFace);

    var zPlusFace = generateFace(resolution);
    zPlusFace.rotateZ(0.5*Math.PI);
    zPlusFace.rotateX(0.5*Math.PI);
    zPlusFace.rotateY(0.5*Math.PI);
    faces.push(zPlusFace);

    var xMinusFace = generateFace(resolution);
    xMinusFace.rotateZ(0.5*Math.PI);
    xMinusFace.rotateX(0.5*Math.PI);
    xMinusFace.rotateY(Math.PI);
    faces.push(xMinusFace);

    var zMinusFace = generateFace(resolution);
    zMinusFace.rotateZ(0.5*Math.PI);
    zMinusFace.rotateX(0.5*Math.PI);
    zMinusFace.rotateY(1.5*Math.PI);
    faces.push(zMinusFace);

    return faces;
}

//*****************************
//  LIGHT SOURCES
//*****************************

var light = new THREE.PointLight( 0xffffff, 4, 100 );
light.position.set( 10, 0, 7 );

scene.add( light );

var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

//***********************************
//  JUNK
//***********************************

//var geometry = new THREE.SphereGeometry(4, 5, 5, 0, Math.PI * 2, 0, Math.PI * 2);
//var material = new THREE.MeshLambertMaterial();
//var cube = new THREE.Mesh(geometry, material);
//scene.add(cube);

//var geometry = new THREE.SphereGeometry( 5, 32, 32 );
//var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
//var sphere = new THREE.Mesh( geometry, material );

//***********************************
//  Confirming cube face orientations
//***********************************

var geometries = basicSphere(200);
var shapes = [];
geometries.forEach((face, index) => {
    var temp = geometryToObject(face);
    shapes.push(temp);
    scene.add(temp);
});

//cube.rotation.x += 0;

//***********************************
//  CAMERA
//***********************************

camera.position.z = 1;
camera.position.y = 2;
camera.rotation.x = -1.2;


function animate() {
    requestAnimationFrame( animate );

    //shapes[0].rotation.y += 0.01;
    //cube2.rotation.y += 0.01;

    shapes.forEach((face, index) => {
        face.rotation.x+=.01;
        face.rotation.y+=.01;
    });

    renderer.render( scene, camera );
}
animate();
},{}]},{},[1]);
