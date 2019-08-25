function main () {
  var container = document.getElementById('map');

  var bound = container.getBoundingClientRect();
  var width = bound.width;
  var height = bound.height;

  var map = WorldMap({
    container,
    width,
    height
  })
  .onClick(function (d, isFirstClick) {
    var {name} = d.properties;

    if (isFirstClick) {
      // api call example!!!!
      // fetch('https://example.com?name=' + name, {
      //   method: 'GET'
      // }).then(resp => {
        // console.log(resp)
      // })
    }
  })
  .onMouseMove(function (d) {
    var {name} = d.properties;
    // console.log(name);
  })
  .onMouseOut(function (d) {
    var {name} = d.properties;
    // console.log(name);
  })

  Promise.all([
    d3.json('./data/the_world.json'),
    d3.json('./data/points.json')
  ])
  .then(resp => {
    map.geojson(resp[0])
      .data(resp[1])
      .render()
  })

  window.worldMap = map;
}

main();