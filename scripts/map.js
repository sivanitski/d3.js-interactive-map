function WorldMap (params) {
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    container: 'document',
    width: window.innerWidth,
    height: window.innerHeight,
    data: null,
    geojson: null,
    center: [43.5, 44],
    scale: 240,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }

  attrs = Object.assign(attrs, params);
  
  var viz = {
    container: d3.select(attrs.container),
    chart: null,
    svg: null
  }

  function main () {
    // calculated variables
    var chartWidth = attrs.width - attrs.margin.left - attrs.margin.right;
    var chartHeight = attrs.height - attrs.margin.top - attrs.margin.top;

    var projection = d3.geoMercator()
      .scale(attrs.scale)
      .translate([chartWidth * 0.62, chartHeight * 0.43])
      .center(attrs.center);
	
    var path = d3.geoPath()
      .projection(projection);

    var zoom = d3.zoom().on("zoom", d => onZoom(d));

    viz.svg = patternify({
      container: viz.container,
      tag: 'svg',
      selector: 'svg-container'
    })
    .attr('width', attrs.width)
    .attr('height', attrs.height)
    .call(zoom)

    viz.chart = patternify({
      container: viz.svg,
      tag: 'g',
      selector: 'chart'
    })
    .attr('transform', `translate(${attrs.margin.left}, ${attrs.margin.top})`)

    patternify({
      container: viz.chart,
      tag: 'path',
      selector: 'country',
      data: topojson.feature(attrs.geojson, attrs.geojson.objects.countries).features
    })
    .attr('fill-opacity', 0.2)
    .attr("stroke", "#ffc33b")
    .attr("d", path);

    // states
    patternify({
      container: viz.chart,
      tag: 'path',
      selector: 'state',
      data: topojson.feature(attrs.geojson, attrs.geojson.objects.states).features
    })
    .attr('fill-opacity', 0)
    .attr("d", path)
    .attr("stroke", "#ffc33b")
  }

  function onZoom () {
    var transform = d3.event.transform;
    viz.chart.attr('transform', transform);
  }

  function handleWindowResize() {
    d3.select(window).on('resize.' + attrs.id, function () {
        setDimensions();
    });
  }

  function setDimensions() {
      setSvgWidthAndHeight();
      main();
  }

  function setSvgWidthAndHeight() {
      var containerRect = viz.container.node().getBoundingClientRect();
      if (containerRect.width > 0) {
        attrs.width = containerRect.width;
      }
      if (containerRect.height > 0) {
        attrs.height = containerRect.height;
      }
  }

  main.data = function (data) {
    attrs.data = data;
    return main;
  }

  main.geojson = function (geojson) {
    attrs.geojson = geojson;
    return main;
  }

  main.render = function() {
    main();
    handleWindowResize();
    return main;
  }

  return main;
}