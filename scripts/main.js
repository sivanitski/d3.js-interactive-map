function main () {
  var container = document.getElementById('map');

  var map = WorldMap({
    container
  })

  d3.json('./data/the_world.json').then(world => {
    map.geojson(world).render()
  })
}

main();