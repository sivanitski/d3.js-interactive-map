function WorldMap(params) {

  var attrs = Object.assign({
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    container: 'document',
    width: window.innerWidth,
    height: window.innerHeight,
    data: [],
    geojson: {},
    center: [0, 50],
    scale: 300,
    rotated: 100,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    transitionDuration: 750,
    pointBoundWidth: 50,
    minRadius: 5,
    maxRadius: 13,
    excludedCountries: [
      'Russia',
      'Kazakhstan',
      'India',
      'Kyrgyzstan',
      'China',
      'Sri Lanka'
    ]
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
    offsetL = viz.container.node().offsetLeft + 10,
    offsetT = viz.container.node().offsetTop + 10,
    onMouseMove = function () {},
    onMouseOut = function () {},
    onClick = function () {},
    blockMouseout = false;

  function main() {
    // calculated variables
    chartWidth = attrs.width - attrs.margin.left - attrs.margin.right;
    chartHeight = attrs.height - attrs.margin.top - attrs.margin.top;

    // radius scale
    var minWeight = d3.min(attrs.data, d => +d.weight);
    var maxWeight = d3.max(attrs.data, d => +d.weight);

    var radius = d3.scaleLinear()
      .range([attrs.minRadius, attrs.maxRadius])
      .domain([minWeight, maxWeight])

    projection = d3.geoMercator()
      .scale(attrs.scale)
      .rotate([attrs.rotated, 0, 0])
      .translate([chartWidth / 2, chartHeight / 2])
      .center(attrs.center);

    path = d3.geoPath()
      .projection(projection);

    zoom = d3.zoom()
      // .scaleExtent([0.7, 20])
      .translateExtent([
        [-900, -580], 
        [chartWidth + 900, chartHeight + 500]
      ])
      .on("zoom", d => onZoom(d));

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

    viz.features = d3.selectAll('.feature')
      .attr('data-name', d => d.properties.name)
      .on('click', function (d) {
        var name = d.properties.name;
        if (attrs.excludedCountries.indexOf(name) == -1) {
          clicked(d, this)
        }
      })
      .on("mousemove", function (d) {
        showTooltip(d);
        onMouseMove(d);
      })
      .on("mouseout", function (d, i) {
        if (blockMouseout) {
          return;
        }

        viz.tooltip.classed("hidden", true);
        onMouseOut(d);
      })

    // points
    viz.animatedPoints = patternify({
      tag: 'circle',
      selector: 'animated-point',
      data: attrs.data.filter(d => d.animate),
      container: viz.chart
    })
    .attr("cx", function (d) { 
      return projection([d.longitude, d.latitude])[0]; 
    })
    .attr("cy", function (d) { 
      return projection([d.longitude, d.latitude])[1]; 
    })
    .attr("r", d => radius(+d.weight))
    .attr("fill", '#000')
    .attr('fill-opacity', 0.3)
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none')
      .append("animate")
      .attr("attributeType", "SVG")
      .attr("attributeName", "r")
      .attr("begin","0s")
      .attr("dur","1.5s")
      .attr("repeatCount", "indefinite")
      .attr("from", d => radius(+d.weight))
      .attr("to", d => radius(+d.weight) * 2)

    viz.points = patternify({
      tag: 'circle',
      selector: 'point',
      data: attrs.data,
      container: viz.chart
    })
    .attr("cx", function (d) { 
      return projection([d.longitude, d.latitude])[0]; 
    })
    .attr("cy", function (d) { 
      return projection([d.longitude, d.latitude])[1]; 
    })
    .attr('data-name', d => d.region)
    .attr("r", d => radius(+d.weight))
    .attr("fill", d => d.color)
    .attr("cursor", "pointer")
    .on('click', function (d) {
      // region name
      var name = d.region;

      // find a feature for that reion
      var feature = viz.features.filter(x => x.properties.name == name);

      // if found
      if (!feature.empty() && attrs.excludedCountries.indexOf(name) == -1) {
        // show tooltip for the point
        showTooltip({properties: {name: d.label}});

        // click handler for the region (feature) without tooltip. 
        clicked(feature.datum(), feature.node(), false);
      } 
      // if not found, calculate point bounds and zoom to the point and also show the circle tooltip
      else {
        pointClick(Object.assign(d, {properties: {name}}), this);
      }

      blockMouseout = true;

      setTimeout(() => {
        blockMouseout = false;
      }, attrs.transitionDuration * 1.5)
    })
    .on('mousemove', function (d) {
      showTooltip({properties: {name: d.label}});
      onMouseMove(Object.assign({properties: {name: d.label}}));
    })
    .on('mouseout', function (d) {
      if (blockMouseout) {
        return;
      }
      
      viz.tooltip.classed("hidden", true);
      onMouseOut(Object.assign({properties: {name: d.label}}));
    })
  }

  function panTo(x, y, scale) {
    viz.svg.transition()
      .duration(attrs.transitionDuration)
      .call(
        zoom.transform,
        zoomIdentity.translate(x, y).scale(scale)
      )
  }

  function reset() {
    active.classed("active", false);
    active = d3.select(null);
    viz.tooltip.classed("hidden", true);

    panTo(0, 0, 1);
  }

  function clicked(d, that, tooltip = true) {
    if (active.node() === that) {
      onClick(d, false);
      return reset();
    } else {
      onClick(d, true);
    }

    active.classed("active", false);

    active = d3.select(that).classed("active", true);

    var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(0.18, Math.min(8, 0.9 / Math.max(dx / chartWidth, dy / chartHeight))),
      translate = [chartWidth / 2 - scale * x, chartHeight / 2 - scale * y];

    panTo(translate[0], translate[1], scale);

    if (tooltip) {
      showTooltip(d);
    }
  }

  function pointClick(d, that) {
    if (active.node() === that) {
      onClick(d, false);
      return reset();
    } else {
      onClick(d, true);
    }

    active.classed("active", false);

    active = d3.select(that).classed("active", true);

    var point = projection([d.longitude, d.latitude]);

    var bounds = [
      [point[0] - attrs.pointBoundWidth / 2, point[1] - attrs.pointBoundWidth / 2],
      [point[0] + attrs.pointBoundWidth / 2, point[1] + attrs.pointBoundWidth / 2]
    ],
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = Math.max(0.18, Math.min(8, 0.9 / Math.max(dx / chartWidth, dy / chartHeight))),
    translate = [chartWidth / 2 - scale * x, chartHeight / 2 - scale * y];

    panTo(translate[0], translate[1], scale);

    showTooltip(d);
  }

  function showTooltip(d, mouse) {
    var label = d.properties.name;

    if (!mouse) {
      mouse = d3.mouse(viz.svg.node());
    }

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

  function findRegion (regionName) {
    return viz.features.filter(x => x.properties.name == regionName); 
  }

  // programatically show tooltip
  main.showTooltip = function (regionName) {
    var region = findRegion(regionName);

    if (!region.empty()) {
      showTooltip({properties: {name: regionName}}, path.centroid(region.datum()));
    }
    
    return main;
  }

  main.reset = reset;

  // pan and zoom in to specific point (x, y, scale)
  main.panTo = function (x, y, scale) {
    panTo(x, y, scale);
    return main;
  };

  // programatically activate region and zoom in
  main.activateRegion = function (regionName) {
    var feature = findRegion(regionName);

    if (!feature.empty()) {
      clicked(feature.datum(), feature.node(), false);
    }

    return main;
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

  main.onClick = function (f) {
    onClick = f;
    return main;
  }

  main.onMouseMove = function (f) {
    onMouseMove = f;
    return main;
  }

  main.onMouseOut = function (f) {
    onMouseOut = f;
    return main;
  }

  return main;
}