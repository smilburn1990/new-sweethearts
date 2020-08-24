import { makeChain, globals } from "./utils";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import tippy from "tippy.js";

export default function UkMap(params) {
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll("." + selector).data(data, (d, i) => {
      if (typeof d === "object") {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    });
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection);
    selection.attr("class", selector);
    return selection;
  };

  var attrs = Object.assign(
    {
      id: Math.floor(Math.random() * 10000000),
      width: window.innerWidth,
      height: window.innerHeight,
      margin: {
        top: 15,
        left: 15,
        bottom: 15,
        right: 15
      },
      transitionTime: 500,
      data: null,
      geojson: null,
      container: document.body,
      initialScale: 1,
      inactiveFeatures: [],
      currentRegion: null,
      getTooltipHtml: () => {},
      onFeatureClick: () => {},
      onColor: () => {
        return "#ff8000";
      }
    },
    params
  );

  var container,
    svg,
    chart,
    chartInner,
    featuresDom,
    mapContainer, // map will be rendered in this
    chartWidth,
    chartHeight,
    geoFeatures, // geojson features collection object
    path, // geo path generator
    projection, // geo projection
    marker,
    zoom = d3.zoom().on("zoom", zoomed),
    currentStateClicked = null;

  function main() {
    container = d3.select(attrs.container);
    geoFeatures = topojson.feature(
      attrs.geojson,
      attrs.geojson.objects.collection
    );

    setDimensions();

    // projection
    projection = d3
      .geoMercator()
      .fitSize([chartWidth, chartHeight], geoFeatures);

    // path generator
    path = d3.geoPath().projection(projection);

    //Add svg
    svg = container
      .patternify({
        tag: "svg",
        selector: "uk-chart-svg"
      })
      .attr("width", attrs.width)
      .attr("height", attrs.height)
      .call(zoom)
      .on("wheel.zoom", null)
      .on("dblclick.zoom", null);

    //Add chart group
    chart = svg
      .patternify({
        tag: "g",
        selector: "chart"
      })
      .attr(
        "transform",
        `translate(
                ${attrs.margin.left + (attrs.initialScale > 1 ? -35 : 0)}, 
                ${attrs.margin.top + (attrs.initialScale > 1 ? -105 : 0)}
            ) scale(${attrs.initialScale})`
      );

    //Add chart inner group
    chartInner = chart.patternify({
      tag: "g",
      selector: "chart-inner"
    });

    //Add map container
    mapContainer = chartInner.patternify({
      tag: "g",
      selector: "map-container"
    });

    drawFeatures();

    marker = mapContainer
      .patternify({
        tag: "g",
        selector: "marker-container"
      })
      .attr("pointer-events", "none");

    marker
      .patternify({
        tag: "image",
        select: "marker-image"
      })
      .attr("href", "./images/marker.svg")
      .attr("width", 30)
      .attr("height", 30)
      .attr("x", -10)
      .attr("y", -30)
      .attr("pointer-events", "none");
  }

  function zoomed() {
    var transform = d3.event.transform;
    chartInner.attr("transform", transform);
  }

  function resetZoom() {
    svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity);
  }

  function scaleOnly(scale) {
    svg
      .transition()
      .duration(300)
      .call(zoom.scaleTo, scale, [chartWidth / 2, chartHeight / 2]);
  }

  function drawFeatures() {
    //Render states
    featuresDom = mapContainer
      .patternify({
        tag: "path",
        selector: "state",
        data: geoFeatures.features
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", "0.5px")
      .attr("fill", (d) => {
        if (isActive(d)) {
          return attrs.onColor(d.properties.name);
        }
        return "#D7D7D7";
      })
      .attr("d", path)
      .on("click", (d) => {
        if (isActive(d)) {
          attrs.onFeatureClick(d.properties.name, currentStateClicked);
          currentStateClicked = !currentStateClicked;
        }
      });
    // .on('mouseover', function(d) {
    //     if (isActive(d)) {
    //         highlightFeatures([d.properties.name, attrs.currentRegion]);
    //     }
    // })
    // .on('mouseout', function(d) {
    //     if (isActive(d)) {
    //         highlightFeatures([attrs.currentRegion]);
    //     }
    // })

    featuresDom.each(function (d) {
      let node = this;
      let tip = node._tippy;
      if (tip) {
        tip.destroy();
      }
      const content = attrs.getTooltipHtml(d.properties.name);

      if (content) {
        tippy(node, {
          content,
          arrow: true,
          theme: "light",
          animation: "scale",
          duration: 0
        });
      }
    });
  }

  function isActive(d) {
    return attrs.inactiveFeatures.indexOf(d.properties.name) === -1;
  }

  function setDimensions() {
    var containerRect = container.node().getBoundingClientRect();

    if (containerRect.width > 0) {
      attrs.width = containerRect.width;
    }

    if (globals.isMobile) {
      attrs.height = 530;
    } else {
      attrs.height = 585;
    }

    chartWidth = attrs.width - attrs.margin.right - attrs.margin.left;
    chartHeight = attrs.height - attrs.margin.bottom - attrs.margin.top;
  }

  function highlightFeatures(featureIds) {
    var feature = featuresDom.filter(
      (d) => featureIds.indexOf(d.properties.name) > -1
    );

    if (!feature.empty()) {
      feature.each(function (d) {
        const centroid = path.centroid(d);
        marker.attr("transform", `translate(${centroid})`);
      });
    }
  }

  //////////////////////////////////////////////////////
  ///////////////// instance methods ///////////////////
  //////////////////////////////////////////////////////

  main.highlightFeatures = highlightFeatures;
  main.resetZoom = resetZoom;

  main.updateTooltip = function () {
    featuresDom.each(function (d) {
      let node = this;
      let tip = node._tippy;
      if (tip) {
        tip.setContent(attrs.getTooltipHtml(d));
      }
    });
  };

  main.render = function () {
    main();
    return main;
  };

  main.zoom = function (scale) {
    scaleOnly(scale);
  };

  // enable chain syntax
  makeChain(attrs, main);

  let timer = null;
  // on window resize, rerender map
  d3.select(window).on("resize." + attrs.id, function () {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      setDimensions();
      main();
      if (attrs.currentRegion) {
        highlightFeatures([attrs.currentRegion]);
      }
    }, 100);
  });

  return main;
}
