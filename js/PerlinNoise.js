
// Mathematically models a terrain that the user can sample points from.
class terrainGenerator {
    
    constructor(lacunarity, persistance, layers, seed, basePeriod, low, high) {
        this.lacunarity = lacunarity;
        this.persistance = persistance;
        this.seed = seed;
        this.basePeriod = basePeriod;
        this.low = low;
        this.high = high;
        this.naturalMax = 0;
        for(var i = 0; i < layers; i++){
            this.naturalMax+=persistance**i
        }
        this.layers = [];
        for(var i = 0; i < layers; i++){
            var tempSeed = seed
            for(var j = 1; j<i; j++){
                tempSeed = tempSeed+tempSeed
            }
            this.layers.push(new SimplexNoise(tempSeed));
        }
    };

    // 2 input simplex
    get2DPoint( x, y) {
        var value = 0.0;
        for(var i = 0; i < this.layers.length; i++){
            var noise = (this.persistance**i)*this.layers[i].noise2D(x/this.basePeriod*(this.lacunarity**i),y/this.basePeriod*(this.lacunarity**i));
            value+=noise;
        }
        // Map for -1..1 to 0..1
        var unitNoise = (value/this.naturalMax)/2+.5;
        // Map to max height and dip
        var adjustedNoise = unitNoise*(this.high-this.low)+this.low

        return adjustedNoise
    }

    // 3 input simplex
    get3DPoint( x, y, z) {
        var value = 0.0;
        for(var i = 0; i < this.layers.length; i++){
            var noise = (this.persistance**i)*this.layers[i].noise3D(x/this.basePeriod*(this.lacunarity**i),y/this.basePeriod*(this.lacunarity**i),z/this.basePeriod*(this.lacunarity**i));
            value+=noise;
        }
        // Map for -1..1 to 0..1
        var unitNoise = (value/this.naturalMax)/2+.5;
        // Map to max height and dip
        var adjustedNoise = unitNoise*(this.high-this.low)+this.low

        return adjustedNoise
    }
};

// For testing terrain map on a canvas
//window.onload = function() {
function onLoad() {
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
    // Define the image dimensions
    var width = canvas.width;
    var height = canvas.height;
 
    // Create an ImageData object
    var imagedata = context.createImageData(width, height);
    // Create the image
    var redTerr = new terrainGenerator( 2, .5, 6, 'red', 20, .3, 255);
    var greenTerr = new terrainGenerator( 2, .5, 6, 'green', 20, 0, 255);
   
    var terrain = new terrainGenerator( 4, .1, 4, 'bluadsfe', 150, .5, 1.5);
    function createImage(tframe) {
        // Loop over all of the pixels
        for (var x=0; x<width; x++) {
            for (var y=0; y<height; y++) {
                // Get the pixel index
                var pixelindex = (y * width + x) * 4;
                
                //var simp = simplex.noise2D(x*10, y)

                // Generate a xor pattern with some random noise
                var red = 0;
                var green = 0;
                var blue = 255;
                var Alpha = terrain.get3DPoint(x,y,tframe/100);
                alert(Alpha)
                // Set the pixel data
                imagedata.data[pixelindex] = red;     // Red
                imagedata.data[pixelindex+1] = green; // Green
                imagedata.data[pixelindex+2] = blue;  // Blue
                imagedata.data[pixelindex+3] = Alpha;   // Alpha
            }
        }
    }
 
    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);
 
        // Create the image
        createImage(tframe);
 
        // Draw the image data to the canvas
        context.putImageData(imagedata, 0, 0);
    }
 
    // Call the main loop
    main(0);
}