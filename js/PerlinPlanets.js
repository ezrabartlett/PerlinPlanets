var scene = new THREE.Scene()
var raycaster = new THREE.Raycaster();
var renderer = new THREE.WebGLRenderer(antialaising = true);
renderer.setSize( window.innerWidth, window.innerHeight);

document.body.appendChild( renderer.domElement );
// Our Javascript will go here.

class Planet {
    constructor(resolution, seed) {
        this.seaLevel = 1;
        this.maxHeight = 1.1
        this.minHeight = 0.9
        this.seed = seed
        this.terrain = new terrainGenerator( 2, .5, 5, this.seed, 1.3, .95, 1.05);

        this.generateLayers()

        var geometries = basicSphere(resolution)
        var body = [];
        geometries.forEach((face, index) => {
            var temp = geometryToObject(face);
            body.push(temp);
        });

        this.body = body;
    }

    addToScene() {
        this.body.forEach((face) => {
            scene.add(face)
        });
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

    calculateColor(averagePoint) {
        //if((averagePoint.y>=.85 || averagePoint.y<=-.85) && averagePoint.length()>=this.seaLevel*1.00011){
        //    return [new THREE.Color('white'), 0];
        //}
        if(averagePoint.length()<=this.seaLevel*1.0001){
            var depth = this.seaLevel-this.getHeight(averagePoint.x, averagePoint.y, averagePoint.z);
            var maxDepth = this.seaLevel-this.minHeight
            //alert(depth)
            var colorstring = "rgb("+String(Math.floor(46-41*(Math.log10(1+9*depth/maxDepth))))+", "+String(Math.floor(200-118*(Math.log10(1+9*depth/maxDepth))))+", "+String(Math.floor(255-20*(Math.log10(1+9*depth/maxDepth))))+")"
            //alert(colorstring)
            //alert(String(Math.floor(66-61*(Math.log(1+9*depth/.1)))))
            return [new THREE.Color(colorstring), 0];
            //return [new THREE.Color('blue'), 0];
        }
        if(averagePoint.length()<=this.seaLevel*1.002){
            return [new THREE.Color('white'), 1];
        }
        if(averagePoint.length()<=this.seaLevel*1.085){
            return [new THREE.Color('green'), 1];
        }
        return [new THREE.Color('white'), 1];

    }

    getFaceAverage(face, polygon) {
        var x = (face.geometry.vertices[polygon.a].x+face.geometry.vertices[polygon.b].x+face.geometry.vertices[polygon.c].x)/3;
        var y = (face.geometry.vertices[polygon.a].y+face.geometry.vertices[polygon.b].y+face.geometry.vertices[polygon.c].y)/3;
        var z = (face.geometry.vertices[polygon.a].z+face.geometry.vertices[polygon.b].z+face.geometry.vertices[polygon.c].z)/3;
        var average = new THREE.Vector3(x, y, z);
        return average;
    }

    updateColors() {
        this.body.forEach((face)=>{
            face.geometry.faces.forEach((polygon)=>{
                var average = this.getFaceAverage(face, polygon);
                var material = this.calculateColor(average);
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
        var geometries = basicSphere(resolution);
        var body = [];
        geometries.forEach((face, index) => {
            var temp = geometryToObject(face, "Sun", intensity);
            body.push(temp);
        });
        //this.light = new THREE.PointLight( 0xffffff, 1, 100 );
        this.body = body;

        this.light = new THREE.PointLight( 0xffffff, 1, 100 );
        this.light.position.set( 0, 0,  7);
        scene.add(this.light);

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

function geometryToObject(geometry, type = "planet", intensity = 20){
    geometry.computeFaceNormals();
	geometry.mergeVertices();
    // Alternate colors
    geometry.faces.forEach((face, index) => {
        if(index%2==0) {
            face.color = new THREE.Color('skyblue');
        }
        else {
            face.color = new THREE.Color('skyblue');
        }
    });
    
    //geometry.faces[ 0].color = new THREE.Color('green');
    
    //geometry.rotateX(1.5708);
    
    var waterMaterial = new THREE.MeshPhongMaterial({vertexColors: THREE.FaceColors, shininess: 70});
    var landMaterial = new THREE.MeshStandardMaterial({vertexColors: THREE.FaceColors});
    var sunMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: intensity,
        color: 0xffffee,
        roughness: 1
    });
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

function createSkyBox() {
    let materialArray = [];

    for (let i = 0; i < 6; i++) {
        let texture = new THREE.TextureLoader().load( 'assets/skybox_'+String(i)+'.png');
        var material = new THREE.MeshBasicMaterial( { map: texture });
        material.side = THREE.BackSide;
        materialArray.push(material);
    }
    
    let skyboxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000);
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
planet.addToScene();
planet.modulateSurface();
planet.updateColors();

var sun = new Sun(2,  15);
sun.setPosition(0, 0, 6);
sun.addToScene()

//***********************************
//  CAMERA
//***********************************

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
//var FPCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3.5;
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
    rotationSpeed: 0,
    lacunarity: 2,
    persistance: .5,
    layers: 5,
    seed: 'williamZakai',
    base: .7,
    min: .95,
    max: 1.05,
    regenerateFunction: regenerate,
    sunOrbit: 1,
    sunDistance: 3
};

function regenerate() {
    planet.seed = guiParams['seed']
    planet.setTerrainValues( guiParams['lacunarity'], guiParams['persistance'], guiParams['layers'], guiParams['seed'], guiParams['base'], guiParams['min'], guiParams['max']);
    planet.regeneratePlanet();
}

gui.add(guiParams, 'rotationSpeed').min(0).max(100).step(1);
//gui.add(guiParams, 'lacunarity').min(0).max(10).step(.1);
//gui.add(guiParams, 'persistance').min(0).max(2).step(.1);
//gui.add(guiParams, 'layers').min(0).max(15).step(1);
gui.add(guiParams, 'seed');
//gui.add(guiParams, 'base').min(0.05).max(15).step(.05);
//gui.add(guiParams, 'min').min(0.5).max(1).step(.05);
//gui.add(guiParams, 'max').min(1).max(2).step(.05);
gui.add(guiParams, 'regenerateFunction').name('Regenerate');
gui.add(guiParams, 'sunOrbit').min(0).max(5).step(.1).name('sun speed');
gui.add(guiParams, 'sunDistance').min(0).max(30).step(.1).name('sun distance');

var sphere = new THREE.SphereGeometry( .05, 32, 32 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var playerTracker = new THREE.Mesh( sphere, material );

playerTracker.position.set(1,1,1);
//scene.add( playerTracker );

function animate(time) {
    requestAnimationFrame( animate );

    //var playerPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
    //playerPosition.multiplyScalar(planet.terrain.get3DPoint(playerPosition.x,playerPosition.y,playerPosition.z));
    //raycaster.set(new THREE.Vector3(0,0,0), playerPosition.normalize());

    //playerTracker.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    //shapes[0].rotation.y += 0.01;
    //cube2.rotation.y += 0.01;

    planet.rotateY(guiParams['rotationSpeed']/1000)
    //shapes.forEach((face, index) => {
    //    face.rotation.x+=.01;
    //    face.rotation.y+=.01;
    //});

    //sun.move(sun.);
    sun.setPosition(guiParams['sunDistance']*Math.cos(guiParams['sunOrbit']*(time/10000)),0,guiParams['sunDistance']*Math.sin(guiParams['sunOrbit']*(time/10000)));

    renderer.render( scene, camera);
}
animate();
