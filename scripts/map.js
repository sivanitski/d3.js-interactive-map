function WorldMap(params) {

  var attrs = Object.assign({
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    container: 'document',
    width: window.innerWidth,
    height: window.innerHeight,
    data: null,
    geojson: null,
    center: [0, 50],
    scale: 300,
    rotated: 100,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }, params);

  // viz selection
  var viz = {
    container: d3.select(attrs.container),
    chart: null,
    svg: null
  };

  // some global variables initilized in main
  var active = d3.select(null),
    chartWidth,
    chartHeight,
    path,
    projection,
    zoom,
    zoomIdentity = d3.zoomIdentity,
    offsetL = viz.container.node().offsetLeft + 10;
  offsetT = viz.container.node().offsetTop + 10;

  function main() {
    // calculated variables
    chartWidth = attrs.width - attrs.margin.left - attrs.margin.right;
    chartHeight = attrs.height - attrs.margin.top - attrs.margin.top;

    projection = d3.geoMercator()
      .scale(attrs.scale)
      .rotate([attrs.rotated, 0, 0])
      .translate([chartWidth / 2, chartHeight / 2])
      .center(attrs.center);

    path = d3.geoPath()
      .projection(projection);

    zoom = d3.zoom().on("zoom", d => onZoom(d));

    viz.tooltip = patternify({
      tag: 'div',
      selector: 'tooltip',
      container: viz.container
    })
      .classed('hidden', true)

    viz.svg = patternify({
      container: viz.container,
      tag: 'svg',
      selector: 'svg-container'
    })
      .attr('width', attrs.width)
      .attr('height', attrs.height)
      .call(zoom)

    viz.background = patternify({
      tag: 'rect',
      selector: 'background',
      container: viz.svg
    })
      .attr("width", attrs.width)
      .attr("height", attrs.height)
      .on("click", reset);

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
      .classed('feature', true)
      .attr("d", path);

    // states
    patternify({
      container: viz.chart,
      tag: 'path',
      selector: 'state',
      data: topojson.feature(attrs.geojson, attrs.geojson.objects.states).features
    })
      .attr("d", path)
      .classed('feature', true)

    d3.selectAll('.feature')
      .on('click', clicked)
      .on("mousemove", showTooltip)
      .on("mouseout", function (d, i) {
        viz.tooltip.classed("hidden", true);
      })
  }

  function reset() {
    active.classed("active", false);
    active = d3.select(null);
    viz.tooltip.classed("hidden", true);

    viz.svg.transition()
      .duration(750)
      .call(
        zoom.transform,
        zoomIdentity.translate(0, 0).scale(1)
      )
  }

  function clicked(d) {
    if (active.node() === this) return reset();

    active.classed("active", false);

    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / chartWidth, dy / chartHeight))),
      translate = [chartWidth / 2 - scale * x, chartHeight / 2 - scale * y];

    viz.svg.transition()
      .duration(750)
      .call(
        zoom.transform,
        zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );

    showTooltip(d);
  }

  function showTooltip(d) {
    var label = d.properties.name;

    var mouse = d3.mouse(viz.svg.node());

    viz.tooltip
      .classed("hidden", false)
      .attr("style", `left: ${mouse[0] + offsetL}px; top: ${mouse[1] + offsetT}px;`)
      .html(label);
  }

  function onZoom() {
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

  main.render = function () {
    main();
    handleWindowResize();
    return main;
  }

  return main;
}