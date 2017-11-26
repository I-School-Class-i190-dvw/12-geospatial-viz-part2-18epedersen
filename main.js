// initialize width and height
var width = Math.max(960, window.innerWidth),
height = Math.max(500, window.innerHeight);

// initializing pi variable that will be used for calculations later on
var pi = Math.PI;
tau = 2 * pi;


// initialize a map projector with a scale and origin of [0,0]
var projection = d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0]);

// initialize path generator, and set projection to projection
var path = d3.geoPath()
    .projection(projection);

// initialize tile to width and height
var tile = d3.tile()
    .size([width, height]);

// enables zooms on selections
// also .on is a zoom listener that re-renders on zoom
var zoom = d3.zoom()
    .scaleExtent([
        1 << 11,
        1 << 24
    ])
    .on('zoom', zoomed);

// initialize circle with this radius
var radius = d3.scaleSqrt().range([0, 10]);

// initialize svg with width and height
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

//initialize raster and vector
var raster = svg.append('g');
var vector = svg.selectAll('path');

// load the geodata
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
    if (error) throw error;

    // set up domain of radius
    radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);

    // initialize radius used for displaying magnitude
    path.pointRadius(function(d) {
        return radius(d.properties.mag);
    });


    // binding data
    vector = vector.data(geojson.features)
                    .enter().append('path')
                    .attr('d', path)
                    .on('mouseover', function(d) { console.log(d); });

    // make the map projection to center of CA
    var center = projection([-119.66, 37.414])

    // set upthe operations under zoom
    svg.call(zoom)
        .call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(1 << 14)
                .translate(-center[0], -center[1])
        );
});


function zoomed() {
    var transform = d3.event.transform;
    // apply transform to tile function
    var tiles = tile
        .scale(transform.k)
        .translate([transform.x, transform.y])
        ();


    // updating the projection scale
    projection
        .scale(transform.k / tau)
        .translate([transform.x, transform.y]);

    // drawing the vector
    vector.attr('d', path);

    // updating existing elements
    var image = raster
        .attr('transform', stringify(tiles.scale, tiles.translate))
        .selectAll('image')
        .data(tiles, function(d) { return d; });

    // removing old elements
    image.exit().remove();

    // loading tile images of the map
    image.enter().append('image')
        .attr('xlink:href', function(d) {
            // here we are returning url of the image
            return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
                d[2] + "/" + d[0] + "/" + d[1] + ".png";
        })
        .attr('x', function(d) { return d[0] * 256; })
        .attr('y', function(d) { return d[1] * 256; })
        .attr('width', 256)
        .attr('height', 256);
}

// function turns scale into a string for transformation
function stringify(scale, translate) {
    var k = scale / 256,
        r = scale % 1 ? Number : Math.round;

    return `translate(${r(translate[0] * scale)}, ${r(translate[1] * scale)}) scale(${k})`;
}
