(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var randomseed = require('random-seed');

var scene = new THREE.Scene()
var raycaster = new THREE.Raycaster();
var renderer = new THREE.WebGLRenderer(antialaising = true);
renderer.setSize( window.innerWidth, window.innerHeight);

document.body.appendChild( renderer.domElement );
// Our Javascript will go here.

class Planet {
    constructor(resolution, seed) {
        this.seaLevel = 1;
        this.poles = true;
        this.maxHeight = 1.1;
        this.minHeight = 0.9;
        this.seed = seed;
        this.terrain = new terrainGenerator( 2, .5, 5, this.seed, 1.3, .95, 1.05);
        this.baseTemp = 70;
        this.generateLayers()
        this.rotationSpeed = 2;
        var geometries = basicSphere(resolution)
        var body = [];
        geometries.forEach((face, index) => {
            var temp = geometryToObject(face);
            body.push(temp);
        });

        this.body = body;
        this.modulateSurface()
        this.updateColors();
    }

    addToScene() {
        this.body.forEach((face) => {
            scene.add(face)
        });
    }
    
    getPosition() {
        return this.body[0].position;
    }

    modulateSurface() {
        this.body.forEach((face) => {
            face.geometry.vertices.forEach((point) => {
                point.normalize()
                //point.multiplyScalar(this.terrain.get3DPoint(point.x, point.y, point.z));
                point.multiplyScalar(this.getHeight(point.x, point.y, point.z));
                if(point.length()<this.seaLevel){
                    point = point.normalize().multiplyScalar(this.seaLevel)
                }
            });
            face.geometry.computeFaceNormals();
            face.geometry.verticesNeedUpdate = true;
            face.geometry.elementsNeedUpdate = true;
            face.geometry.normalsNeedUpdate = true;
            face.geometry.colorsNeedUpdate = true;
        });
    }

    setTerrainValues(lacunarity, persistance, layers, seed, base, min, max) {
        this.maxHeight = max
        this.minHeight = min
        this.terrain = new terrainGenerator( lacunarity, persistance, layers, seed, base, min, max);
    }

    resetResolution() {

    }
    
    move() {
        this.rotateY(this.rotationSpeed/1000)
    }
    
    regeneratePlanet() {
        this.generateLayers()
        this.modulateSurface();
        this.updateColors();
    }

    rotateX(value) {
        this.body.forEach((face) => {
            face.rotation.x += value
        })
    } 

    rotateY(value) {
        this.body.forEach((face) => {
            face.rotation.y += value
        })
    } 

    rotateZ(value) {
        this.body.forEach((face) => {
            face.rotation.z += value
        })
    } 
    
    setPosition(x, y, z) {
        this.body.forEach((face) => {
            face.position.x = x;
            face.position.y = y;
            face.position.z = z;
        })
    }
    
    generateLayers() {
        var continents = {
            terrain: new terrainGenerator( 2, .5, 5, this.seed, 1.5, .9, 1.1),
            type: "all"
        }
        var mountains = {
            terrain: new terrainGenerator( 2, .5, 5, this.seed, 1, .7, 1.15),
            type: "above"
        }
        var hills = {
            terrain: new terrainGenerator( 2, .5, 5, this.seed, .5, .9, 1.05),
            type: "above"
        }

        this.layers = [continents, hills, mountains]
    }

    getHeight( x, y, z) {
        var height = this.seaLevel

        this.layers.forEach(layer => {
            switch(layer.type) {
                case "all": 
                    height = height*layer.terrain.get3DPoint( x, y, z);
                    break;
                case "above": 
                    var tempHeight = Math.max(0, (Math.pow(layer.terrain.get3DPoint( x, y, z),3)-1)/3);
                    height = height+tempHeight;
                    break;
                default:
                    break;
            }
        });

        return height
    }

    calculateColor(averagePoint, temperature) {
        //if((averagePoint.y>=.85 || averagePoint.y<=-.85) && averagePoint.length()>=this.seaLevel*1.00011){
        //    return [new THREE.Color('white'), 0];
        //}
        if(this.poles){
            if(temperature<11.5 && averagePoint.length()>this.seaLevel*1.0001 || averagePoint.length() >= this.seaLevel*1.075) {
                return [new THREE.Color('white'), 1];
            }
        } else {
            if(averagePoint.length() >= this.seaLevel*1.075) {
                return [new THREE.Color('white'), 1];
            }
        }

        var color = [new THREE.Color('white'), 1]
        if(averagePoint.length()<=this.seaLevel*1.0001){
            var depth = this.seaLevel-this.getHeight(averagePoint.x, averagePoint.y, averagePoint.z);
            var maxDepth = this.seaLevel-this.minHeight
            //alert(depth)
            var colorstring = "rgb("+String(Math.floor(46-41*(Math.log10(1+9*depth/maxDepth))))+", "+String(Math.floor(200-118*(Math.log10(1+9*depth/maxDepth))))+", "+String(Math.floor(255-20*(Math.log10(1+9*depth/maxDepth))))+")"
            //alert(colorstring)
            //alert(String(Math.floor(66-61*(Math.log(1+9*depth/.1)))))
            //alert(colorstring);
            color = [new THREE.Color(colorstring), 0];
            //return [new THREE.Color('blue'), 0];
        } else if(averagePoint.length()<=this.seaLevel*1.002) {
            color = [new THREE.Color('white'), 1];
        } else {
            color = [new THREE.Color('green'), 1];
        }

        return color;
        //return [new THREE.Color('white'), 1];

    }

    getFaceAverage(face, polygon) {
        var x = (face.geometry.vertices[polygon.a].x+face.geometry.vertices[polygon.b].x+face.geometry.vertices[polygon.c].x)/3;
        var y = (face.geometry.vertices[polygon.a].y+face.geometry.vertices[polygon.b].y+face.geometry.vertices[polygon.c].y)/3;
        var z = (face.geometry.vertices[polygon.a].z+face.geometry.vertices[polygon.b].z+face.geometry.vertices[polygon.c].z)/3;
        var average = new THREE.Vector3(x, y, z);
        return average;
    }

    getTemperature(average) {
        var temperature = this.baseTemp*(1/(average.length()*4))*(1-(0.4*Math.abs(average.y)))

        return temperature;
    }

    updateColors() {
        this.body.forEach((face)=>{
            face.geometry.faces.forEach((polygon)=>{
                var average = this.getFaceAverage(face, polygon);
                var temperature = this.getTemperature(average);
                var material = this.calculateColor(average, temperature);
                polygon.color = material[0];
                polygon.materialIndex = material[1];
            });
        })
    }
}

//******************************************
// Creates an emmissive sun object
//******************************************
class Sun {
    constructor(radius = 1, resolution = 20, intensity = 1) {
        var geometries = basicSphere(resolution, radius);
        var body = [];
        geometries.forEach((face, index) => {
            var temp = geometryToObject(face, "Sun", intensity);
            body.push(temp);
        });
        //this.light = new THREE.PointLight( 0xffffff, 1, 100 );
        this.body = body;

        this.light = new THREE.PointLight( 0xffffff, 1, 100 );
        this.light.position.set( 0, 0,  7);
    }

    addToScene() {
        this.body.forEach((face) => {
            scene.add(face)
        });
        scene.add(this.light);
    }

    setPosition(x, y, z) {
        this.body.forEach((face) => {
            face.position.x = x;
            face.position.y = y;
            face.position.z = z;
            this.light.add(face);
        })
        this.light.position.set( x, y, z ); 
    }

    move(x, y, z) {
        this.body.forEach((face) => {
            face.position.x += x;
            face.position.y += y;
            face.position.z += z;
            this.light.add(face);
        })
        this.light.position.set( this.light.position.x+x, this.light.position.y+y, this.light.position.z+z ); 
    }

}

//******************************************
// Returns a face of resolution^2 vertices
// Faces upwards
// Normals and material not yet applied
// Now normalized to make a sphere
//******************************************
function generateFace(resolution, radius = 1) {
    const face = new THREE.Geometry();

    // Create vertices as a percentage of each face axis, except y, which is 1
    for(var x = 0; x<resolution; x++){
        var x_percent = x/(resolution-1);
        for(var z = 0; z<resolution; z++){
            var z_percent = z/(resolution-1);

            // Push the vertices, based on the position calculations
            // face.vertices.push((new THREE.Vector3(2*x_percent-1, 1,  2*z_percent-1)).normalize());

            // Push the vertices, based on the position calculations
            face.vertices.push((new THREE.Vector3(2*x_percent-1, 1,  2*z_percent-1)).normalize().multiplyScalar(radius));
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

var waterMaterial = new THREE.MeshPhongMaterial({vertexColors: THREE.FaceColors, shininess: 70});
var landMaterial = new THREE.MeshStandardMaterial({vertexColors: THREE.FaceColors});
var sunMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 20,
    color: 0xffffee,
    roughness: 1
});

function geometryToObject(geometry, type = "planet", intensity = 20){
    geometry.computeFaceNormals();
	geometry.mergeVertices();
    // Alternate colors
    /*geometry.faces.forEach((face, index) => {
        if(index%2==0) {
            face.color = new THREE.Color('skyblue');
        }
        else {
            face.color = new THREE.Color('skyblue');
        }
    });*/
    
    //geometry.faces[ 0].color = new THREE.Color('green');
    
    //geometry.rotateX(1.5708);

    // Set material for planet polygons
    var materials = [ waterMaterial, landMaterial ];

    if(type == "Sun") {
        materials = [sunMaterial];
    }
    var mesh = new THREE.Mesh(geometry, materials)
    mesh.receiveShadow = true;
    return mesh;
}

//******************************************
// Makes 6 pieces of a sphere and then combines them
// Returns a "Sphere" that is actually 6 cube faces inflated into a ball
//******************************************

function basicSphere(resolution, radius = 1) {
    
    var faces = []

    var topFace = generateFace(resolution, radius);
    faces.push(topFace);

    var bottomFace = generateFace(resolution, radius);
    bottomFace.rotateX(Math.PI);
    faces.push(bottomFace);
    
    var xPlusFace = generateFace(resolution, radius);
    xPlusFace.rotateZ(0.5*Math.PI);
    xPlusFace.rotateX(0.5*Math.PI);
    faces.push(xPlusFace);

    var zPlusFace = generateFace(resolution, radius);
    zPlusFace.rotateZ(0.5*Math.PI);
    zPlusFace.rotateX(0.5*Math.PI);
    zPlusFace.rotateY(0.5*Math.PI);
    faces.push(zPlusFace);

    var xMinusFace = generateFace(resolution, radius);
    xMinusFace.rotateZ(0.5*Math.PI);
    xMinusFace.rotateX(0.5*Math.PI);
    xMinusFace.rotateY(Math.PI);
    faces.push(xMinusFace);

    var zMinusFace = generateFace(resolution, radius);
    zMinusFace.rotateZ(0.5*Math.PI);
    zMinusFace.rotateX(0.5*Math.PI);
    zMinusFace.rotateY(1.5*Math.PI);
    faces.push(zMinusFace);

    return faces;
}

function createSkyBox() {
    let materialArray = [];

    for (let i = 0; i < 6; i++) {
        let texture = new THREE.TextureLoader().load( 'assets/skybox_'+String(i)+'.png');
        var material = new THREE.MeshBasicMaterial( { map: texture });
        material.side = THREE.BackSide;
        materialArray.push(material);
    }
    
    let skyboxGeometry = new THREE.BoxGeometry( 1000, 1000, 1000);
    let skybox = new THREE.Mesh( skyboxGeometry, materialArray );
    scene.add( skybox );
}

//*****************************
//  LIGHT SOURCES
//*****************************


var light = new THREE.AmbientLight( 0x404040 , 1); // soft white light
scene.add( light );

createSkyBox()

//***********************************
//  Confirming cube face orientations
//***********************************

var planet = new Planet(300, 'williamZakai');
//planet.addToScene();

//var sun = new Sun(4,  15);
//sun.setPosition(0, 0, 6);
//sun.addToScene()

//***********************************
//  CAMERA
//***********************************

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
//var FPCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 10.5;
camera.position.y = 7.5;
camera.position.z = 12.5;
//FPCamera.rotation.x = 0//1.5;
//camera.rotation.z = 1.6;
var controls = new THREE.OrbitControls( camera, renderer.domElement );

var gui = new dat.GUI({
    height : 5 * 32 - 1
});

function regenerate() {
    planet.regeneratePlanet();
}

var guiParams = {
    poles: true,
    rotationSpeed: 2 ,
    lacunarity: 2,
    persistance: .5,
    layers: 5,
    seed: 'Ezra Bartlett',
    base: .7,
    min: .95,
    max: 1.05,
    regenerateFunction: regenerate,
    sunOrbit: 1,
    sunDistance: 12
};

function regenerate() {
    planet.seed = guiParams['seed']
    planet.poles = guiParams['poles']
    planet.setTerrainValues( guiParams['lacunarity'], guiParams['persistance'], guiParams['layers'], guiParams['seed'], guiParams['base'], guiParams['min'], guiParams['max']);
    planet.regeneratePlanet();
}

gui.add(guiParams, 'rotationSpeed').min(0).max(100).step(1);
gui.add(guiParams, 'poles');
//gui.add(guiParams, 'lacunarity').min(0).max(10).step(.1);
//gui.add(guiParams, 'persistance').min(0).max(2).step(.1);
//gui.add(guiParams, 'layers').min(0).max(15).step(1);
gui.add(guiParams, 'seed').name("Coordinates");
//gui.add(guiParams, 'base').min(0.05).max(15).step(.05);
//gui.add(guiParams, 'min').min(0.5).max(1).step(.05);
//gui.add(guiParams, 'max').min(1).max(2).step(.05);
gui.add(guiParams, 'regenerateFunction').name('Go');
gui.add(guiParams, 'sunOrbit').min(0).max(5).step(.1).name('sun speed');
gui.add(guiParams, 'sunDistance').min(0).max(30).step(.1).name('sun distance');

var sphere = new THREE.SphereGeometry( .05, 32, 32 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var playerTracker = new THREE.Mesh( sphere, material );

playerTracker.position.set(1,1,1);
//scene.add( playerTracker );

//***********************************
//*   Solar system
//***********************************

    
class SolarSystem {
    constructor(seed) {
        this.rand = randomseed.create(seed);
        this.seed = seed
        this.generateSun()
        this.generatePlanets();
    }
    
    generateSun() {
        this.sun = new Sun(3,  15);
        this.sun.setPosition(0, 0, 0);
    }
    
    generatePlanets() {
        this.planets = [];
        for(var i = 0; i<6; i++){
            if(this.rand.random()>=0.5){
                var planet = new Planet(200, 'williamZakai');
                planet.setPosition(0,0,6*i+12);
                this.planets.push(planet);
            }
        }
    }
    
    addToScene() {
        this.sun.addToScene()
        this.planets.forEach((planet) => {
            planet.addToScene();
        });
    }
    
    move() {
        this.planets.forEach((planet) => {
            planet.move();
        });
    }
}

//***********************************
//*   Mouse Click
//***********************************
var raycaster = new THREE.Raycaster(); // create once
var mouse = new THREE.Vector2(); // create once

document.addEventListener("click", event => {
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( scene.children, false );
    
	console.log(intersects[0]);
    controls.target.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
    controls.update();
    
});

//***********************************
//*   Setup Solar System
//***********************************

var SS = new SolarSystem("Seed");
SS.addToScene()

function animate(time) {
    requestAnimationFrame( animate );
    SS.move()
    //targetPosition = SS.planets[0].getPosition()
    //controls.target.set(targetPosition.x, targetPosition.y, targetPosition.z);
    //controls.update();
    
    //const intersects = raycaster.intersectObjects(scene.children);
    //console.log(intersects);
    //var playerPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
    //playerPosition.multiplyScalar(planet.terrain.get3DPoint(playerPosition.x,playerPosition.y,playerPosition.z));
    //raycaster.set(new THREE.Vector3(0,0,0), playerPosition.normalize());

    //playerTracker.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    //shapes[0].rotation.y += 0.01;
    //cube2.rotation.y += 0.01;

    //planet.move()
    //shapes.forEach((face, index) => {
    //    face.rotation.x+=.01;
    //    face.rotation.y+=.01;
    //});

    //sun.move(sun.);
    //sun.setPosition(guiParams['sunDistance']*Math.cos(guiParams['sunOrbit']*(time/10000)),0,guiParams['sunDistance']*Math.sin(guiParams['sunOrbit']*(time/10000)));

    renderer.render( scene, camera);
}
animate();




},{"random-seed":3}],2:[function(require,module,exports){
exports = module.exports = stringify
exports.getSerialize = serializer

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}

},{}],3:[function(require,module,exports){
/*
 * random-seed
 * https://github.com/skratchdot/random-seed
 *
 * This code was originally written by Steve Gibson and can be found here:
 *
 * https://www.grc.com/otg/uheprng.htm
 *
 * It was slightly modified for use in node, to pass jshint, and a few additional
 * helper functions were added.
 *
 * Copyright (c) 2013 skratchdot
 * Dual Licensed under the MIT license and the original GRC copyright/license
 * included below.
 */
/*	============================================================================
									Gibson Research Corporation
				UHEPRNG - Ultra High Entropy Pseudo-Random Number Generator
	============================================================================
	LICENSE AND COPYRIGHT:  THIS CODE IS HEREBY RELEASED INTO THE PUBLIC DOMAIN
	Gibson Research Corporation releases and disclaims ALL RIGHTS AND TITLE IN
	THIS CODE OR ANY DERIVATIVES. Anyone may be freely use it for any purpose.
	============================================================================
	This is GRC's cryptographically strong PRNG (pseudo-random number generator)
	for JavaScript. It is driven by 1536 bits of entropy, stored in an array of
	48, 32-bit JavaScript variables.  Since many applications of this generator,
	including ours with the "Off The Grid" Latin Square generator, may require
	the deteriministic re-generation of a sequence of PRNs, this PRNG's initial
	entropic state can be read and written as a static whole, and incrementally
	evolved by pouring new source entropy into the generator's internal state.
	----------------------------------------------------------------------------
	ENDLESS THANKS are due Johannes Baagoe for his careful development of highly
	robust JavaScript implementations of JS PRNGs.  This work was based upon his
	JavaScript "Alea" PRNG which is based upon the extremely robust Multiply-
	With-Carry (MWC) PRNG invented by George Marsaglia. MWC Algorithm References:
	http://www.GRC.com/otg/Marsaglia_PRNGs.pdf
	http://www.GRC.com/otg/Marsaglia_MWC_Generators.pdf
	----------------------------------------------------------------------------
	The quality of this algorithm's pseudo-random numbers have been verified by
	multiple independent researchers. It handily passes the fermilab.ch tests as
	well as the "diehard" and "dieharder" test suites.  For individuals wishing
	to further verify the quality of this algorithm's pseudo-random numbers, a
	256-megabyte file of this algorithm's output may be downloaded from GRC.com,
	and a Microsoft Windows scripting host (WSH) version of this algorithm may be
	downloaded and run from the Windows command prompt to generate unique files
	of any size:
	The Fermilab "ENT" tests: http://fourmilab.ch/random/
	The 256-megabyte sample PRN file at GRC: https://www.GRC.com/otg/uheprng.bin
	The Windows scripting host version: https://www.GRC.com/otg/wsh-uheprng.js
	----------------------------------------------------------------------------
	Qualifying MWC multipliers are: 187884, 686118, 898134, 1104375, 1250205,
	1460910 and 1768863. (We use the largest one that's < 2^21)
	============================================================================ */
'use strict';
var stringify = require('json-stringify-safe');

/*	============================================================================
This is based upon Johannes Baagoe's carefully designed and efficient hash
function for use with JavaScript.  It has a proven "avalanche" effect such
that every bit of the input affects every bit of the output 50% of the time,
which is good.	See: http://baagoe.com/en/RandomMusings/hash/avalanche.xhtml
============================================================================
*/
var Mash = function () {
	var n = 0xefc8249d;
	var mash = function (data) {
		if (data) {
			data = data.toString();
			for (var i = 0; i < data.length; i++) {
				n += data.charCodeAt(i);
				var h = 0.02519603282416938 * n;
				n = h >>> 0;
				h -= n;
				h *= n;
				n = h >>> 0;
				h -= n;
				n += h * 0x100000000; // 2^32
			}
			return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
		} else {
			n = 0xefc8249d;
		}
	};
	return mash;
};

var uheprng = function (seed) {
	return (function () {
		var o = 48; // set the 'order' number of ENTROPY-holding 32-bit values
		var c = 1; // init the 'carry' used by the multiply-with-carry (MWC) algorithm
		var p = o; // init the 'phase' (max-1) of the intermediate variable pointer
		var s = new Array(o); // declare our intermediate variables array
		var i; // general purpose local
		var j; // general purpose local
		var k = 0; // general purpose local

		// when our "uheprng" is initially invoked our PRNG state is initialized from the
		// browser's own local PRNG. This is okay since although its generator might not
		// be wonderful, it's useful for establishing large startup entropy for our usage.
		var mash = new Mash(); // get a pointer to our high-performance "Mash" hash

		// fill the array with initial mash hash values
		for (i = 0; i < o; i++) {
			s[i] = mash(Math.random());
		}

		// this PRIVATE (internal access only) function is the heart of the multiply-with-carry
		// (MWC) PRNG algorithm. When called it returns a pseudo-random number in the form of a
		// 32-bit JavaScript fraction (0.0 to <1.0) it is a PRIVATE function used by the default
		// [0-1] return function, and by the random 'string(n)' function which returns 'n'
		// characters from 33 to 126.
		var rawprng = function () {
			if (++p >= o) {
				p = 0;
			}
			var t = 1768863 * s[p] + c * 2.3283064365386963e-10; // 2^-32
			return s[p] = t - (c = t | 0);
		};

		// this EXPORTED function is the default function returned by this library.
		// The values returned are integers in the range from 0 to range-1. We first
		// obtain two 32-bit fractions (from rawprng) to synthesize a single high
		// resolution 53-bit prng (0 to <1), then we multiply this by the caller's
		// "range" param and take the "floor" to return a equally probable integer.
		var random = function (range) {
			return Math.floor(range * (rawprng() + (rawprng() * 0x200000 | 0) * 1.1102230246251565e-16)); // 2^-53
		};

		// this EXPORTED function 'string(n)' returns a pseudo-random string of
		// 'n' printable characters ranging from chr(33) to chr(126) inclusive.
		random.string = function (count) {
			var i;
			var s = '';
			for (i = 0; i < count; i++) {
				s += String.fromCharCode(33 + random(94));
			}
			return s;
		};

		// this PRIVATE "hash" function is used to evolve the generator's internal
		// entropy state. It is also called by the EXPORTED addEntropy() function
		// which is used to pour entropy into the PRNG.
		var hash = function () {
			var args = Array.prototype.slice.call(arguments);
			for (i = 0; i < args.length; i++) {
				for (j = 0; j < o; j++) {
					s[j] -= mash(args[i]);
					if (s[j] < 0) {
						s[j] += 1;
					}
				}
			}
		};

		// this EXPORTED "clean string" function removes leading and trailing spaces and non-printing
		// control characters, including any embedded carriage-return (CR) and line-feed (LF) characters,
		// from any string it is handed. this is also used by the 'hashstring' function (below) to help
		// users always obtain the same EFFECTIVE uheprng seeding key.
		random.cleanString = function (inStr) {
			inStr = inStr.replace(/(^\s*)|(\s*$)/gi, ''); // remove any/all leading spaces
			inStr = inStr.replace(/[\x00-\x1F]/gi, ''); // remove any/all control characters
			inStr = inStr.replace(/\n /, '\n'); // remove any/all trailing spaces
			return inStr; // return the cleaned up result
		};

		// this EXPORTED "hash string" function hashes the provided character string after first removing
		// any leading or trailing spaces and ignoring any embedded carriage returns (CR) or Line Feeds (LF)
		random.hashString = function (inStr) {
			inStr = random.cleanString(inStr);
			mash(inStr); // use the string to evolve the 'mash' state
			for (i = 0; i < inStr.length; i++) { // scan through the characters in our string
				k = inStr.charCodeAt(i); // get the character code at the location
				for (j = 0; j < o; j++) { //	"mash" it into the UHEPRNG state
					s[j] -= mash(k);
					if (s[j] < 0) {
						s[j] += 1;
					}
				}
			}
		};

		// this EXPORTED function allows you to seed the random generator.
		random.seed = function (seed) {
			if (typeof seed === 'undefined' || seed === null) {
				seed = Math.random();
			}
			if (typeof seed !== 'string') {
				seed = stringify(seed, function (key, value) {
					if (typeof value === 'function') {
						return (value).toString();
					}
					return value;
				});
			}
			random.initState();
			random.hashString(seed);
		};

		// this handy exported function is used to add entropy to our uheprng at any time
		random.addEntropy = function ( /* accept zero or more arguments */ ) {
			var args = [];
			for (i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			hash((k++) + (new Date().getTime()) + args.join('') + Math.random());
		};

		// if we want to provide a deterministic startup context for our PRNG,
		// but without directly setting the internal state variables, this allows
		// us to initialize the mash hash and PRNG's internal state before providing
		// some hashing input
		random.initState = function () {
			mash(); // pass a null arg to force mash hash to init
			for (i = 0; i < o; i++) {
				s[i] = mash(' '); // fill the array with initial mash hash values
			}
			c = 1; // init our multiply-with-carry carry
			p = o; // init our phase
		};

		// we use this (optional) exported function to signal the JavaScript interpreter
		// that we're finished using the "Mash" hash function so that it can free up the
		// local "instance variables" is will have been maintaining.  It's not strictly
		// necessary, of course, but it's good JavaScript citizenship.
		random.done = function () {
			mash = null;
		};

		// if we called "uheprng" with a seed value, then execute random.seed() before returning
		if (typeof seed !== 'undefined') {
			random.seed(seed);
		}

		// Returns a random integer between 0 (inclusive) and range (exclusive)
		random.range = function (range) {
			return random(range);
		};

		// Returns a random float between 0 (inclusive) and 1 (exclusive)
		random.random = function () {
			return random(Number.MAX_VALUE - 1) / Number.MAX_VALUE;
		};

		// Returns a random float between min (inclusive) and max (exclusive)
		random.floatBetween = function (min, max) {
			return random.random() * (max - min) + min;
		};

		// Returns a random integer between min (inclusive) and max (inclusive)
		random.intBetween = function (min, max) {
			return Math.floor(random.random() * (max - min + 1)) + min;
		};

		// when our main outer "uheprng" function is called, after setting up our
		// initial variables and entropic state, we return an "instance pointer"
		// to the internal anonymous function which can then be used to access
		// the uheprng's various exported functions.  As with the ".done" function
		// above, we should set the returned value to 'null' once we're finished
		// using any of these functions.
		return random;
	}());
};

// Modification for use in node:
uheprng.create = function (seed) {
	return new uheprng(seed);
};
module.exports = uheprng;

},{"json-stringify-safe":2}]},{},[1]);
