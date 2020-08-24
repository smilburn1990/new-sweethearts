import UkMap from "./uk-map";
import { findSuffixOf } from "./utils";
import * as d3 from "d3";
import Choices from "choices.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// CONSTANTS
const containerId = "#map";
const height = 585;
const urls = {
  dataset: "./data/UK.csv",
  geojson: "./data/map.json"
};
var currentRegion = "N"; // north london

// INSTANCES
var ukMap;
var dataset;
var locationChoice;
var dataMap = {};
var colorScale = d3
  .scaleQuantile()
  .range(["#ff8000", "#ffac59", "#ffd9b2", "#ffead4"]);
var colorByField = "Order per Capita - 2020";
var maxScale = 4;
var minScale = 0.4;
var currentScale = 1;
var zoomStep = 0.2;
var zoomSlider = document.querySelector("#zoom-slider");

zoomSlider.min = minScale;
zoomSlider.max = maxScale;
zoomSlider.value = currentScale;
zoomSlider.step = zoomStep;

main();

async function main() {
  // initialize UkMap
  ukMap = UkMap({
    height: height,
    container: containerId,
    margin: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    currentRegion,
    onFeatureClick: (name) => {
      selectLocation(name);
    },
    getTooltipHtml: (name) => {
      const datum = dataMap[name];
      return datum ? datum.Region : null;
    }
  });

  // load data
  var data = await loadData();
  var disabledRegions = ["Ireland"];

  dataset = data.dataset
    .filter((d) => {
      if (d[colorByField] === "n/a") {
        disabledRegions.push(d.Postcode);
        return false;
      } else {
        return true;
      }
    })
    .sort((a, b) => {
      return b[colorByField] - a[colorByField];
    })
    .map((d, i) => {
      d.rank = i + 1;
      return d;
    });

  dataset.forEach((d) => {
    dataMap[d.Postcode] = d;
  });

  colorScale.domain(d3.extent([1, d3.max(dataset, (d) => d.rank)]));

  // render map
  ukMap
    .inactiveFeatures(disabledRegions)
    .onColor((name) => {
      const datum = dataMap[name];

      if (datum) {
        return colorScale(datum.rank);
      }

      return "#D7D7D7";
    })
    .geojson(data.geojson)
    .render();

  const locations = document.querySelector("#locations");
  locationChoice = new Choices(locations, {
    choices: dataset.map((d) => ({
      value: d.Postcode,
      label: d.Region
    })),
    position: "bottom",
    sorter: (a, b) => {
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }
      return 0;
    }
  });

  locations.addEventListener(
    "change",
    function (event) {
      var code = event.detail.value;
      selectLocation(code);
    },
    false
  );

  zoomSlider.addEventListener("input", function () {
    const scale = zoomSlider.value;
    currentScale = scale;
    if (ukMap) {
      ukMap.zoom(scale);
    }
  });

  d3.select("#zoom_in").on("click", zoomIn);
  d3.select("#zoom_out").on("click", zoomOut);

  selectLocation(currentRegion);
}

function loadData() {
  var mapJson = d3.json(urls.geojson);
  var dataset = d3.csv(urls.dataset, d3.autoType);

  return Promise.all([mapJson, dataset]).then((d) => {
    return {
      geojson: d[0],
      dataset: d[1]
    };
  });
}

function zoomIn() {
  if (ukMap) {
    const scale = Math.min(maxScale, currentScale + zoomStep);
    currentScale = scale;
    zoomSlider.value = scale;
    ukMap.zoom(scale);
  }
}

function zoomOut() {
  if (ukMap) {
    const scale = Math.max(minScale, currentScale - zoomStep);
    currentScale = scale;
    zoomSlider.value = scale;
    ukMap.zoom(scale);
  }
}

function selectLocation(postCode) {
  var datum = dataMap[postCode];

  if (!datum) return;

  // update sweetest rank
  const loc = document.querySelector("#sweet-rank-loc");
  const rank = document.querySelector("#sweet-rank");

  loc.innerHTML = datum.Region;
  rank.innerHTML =
    datum.rank + `<span class="suffix">${findSuffixOf(datum.rank)}</span>`;

  // update top orders
  const order1 = document.querySelector("#order-1");
  const order2 = document.querySelector("#order-2");
  const order3 = document.querySelector("#order-3");

  order1.innerHTML = datum["Sweet Dish 1"];
  order2.innerHTML = datum["Sweet Dish 2"];
  order3.innerHTML = datum["Sweet Dish 3"];

  // highlight map
  ukMap.currentRegion(postCode);
  ukMap.highlightFeatures([postCode]);

  // update dropdown
  locationChoice.setChoiceByValue(postCode);
}
