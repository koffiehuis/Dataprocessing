var fileName = "https://raw.githubusercontent.com/koffiehuis/Dataprocessing/master/Homework/Week_6/json.json";
const globalData = [];
let globalOptions = [];
let globalSpec = "";
loadData(fileName);


function loadData(fileName) {
  var dataArray = [];
  fetch(fileName)
    .then((response) => response.json())
    .then((rawData) => {
      for (index in rawData) {
        dataArray[index] = rawData[index]
      }
      globalData.push(dataArray);
      globalSpec = "Happiness.Score"
      changeColor(dataArray, globalSpec)

      keys = Object.keys(dataArray[0]);
      globalOptions = keys.slice(2, (keys.length - 1));
      d3.select("h2").append("select")
        .attr("class", "select")
        .on("change", onchange)
        .selectAll('option')
        .data(globalOptions).enter()
        .append('option')
          .text(function (d) { return d; });

      function onchange() {
         globalSpec = d3.select('select').property('value')

         // loadMap(specDict)
         changeColor(dataArray, globalSpec);
       };
    })
}


var map = new Datamap({
  element: document.getElementById('map_container'),
  projection: "mercator",
  geographyConfig: {
    highlightFillColor: "#00ff00",
    borderColor: '#DDDDDD',
    popupTemplate: function(geography, data) {
      return '<div class=hoverinfo><strong>' + geography.properties.name +
      ': ' + getPopupValue(geography) + '</strong></div>';
    }
  },
  responsive: false,
  fills: {
    defaultFill: "grey",
  },
  done: function(datamap) {
        datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
            barChart(geography.id);
          })
        }
});

function getPopupValue(geography) {
  var groupCode = _.groupBy(globalData[0], obj => obj.Code);

  // round data
  if (groupCode[geography.id]) {
    return (parseFloat(groupCode[geography.id][0][globalSpec])).toFixed(2);
  }
  else {
    return "No data";
  }
}

function barChart(id) {
  console.log(id)
  console.log(globalOptions)
  var values = calculateCountryValues(id)

  var margin = {top: 20, right: 10, bottom: 50, left: 80};
  var w = 1000 - margin.left - margin.right;
  var h = 600 - margin.top - margin.bottom;
  var barPadding = 3;

  // Colorlist, from red to green
  var colorList = ["blue"];

  // Functions to transform coordinates
  var Yscale = d3.scale.linear()
                .domain([0, d3.max(values)])
                .range([h, 0]);

  var Xscale = d3.scale.linear()
                .domain([0,globalOptions.length])
                .range([0, w]);

  // Make room for the chart and initialize svg
  var svg = d3.select("body")
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Make the bars and other elements
  svg.selectAll("rect")
    // Load data and transform to bars
    .data(values)
    .enter()
    .append("rect")
      .attr("x", function(d, i) {
        return i * (w / values.length);
      })
      .attr("y", function(d) {
        return Yscale(d);
      })
      .attr("width", w / values.length - barPadding)
      // .attr("width", w / values.length - barPadding)
      .attr("height", function(d) {
        return h - Yscale(d);

      // Color and bordor for bars
      })
      .attr("fill", function(d) {
        index = parseInt((d / d3.max(values)) * 18);
        return colorList[index]
      })
      .attr('stroke', 'black')
      .attr('stroke-width', '.5')

      // Show tooltip and change bar's color when the cursor hovers over
      .on("mouseover", function(d) {
        div.transition()
             .duration(200)
             .style("opacity", .8);
         div .html("KTOE:" + "<br>" + Math.round(d))
             .style("left", (d3.event.pageX) + "px")
             .style("top", (d3.event.pageY - 30) + "px");
        d3.select(this)
        .attr("fill", "blue");
         })
        .on("mouseout", function(d) {
         div.transition()
             .duration(500)
             .style("opacity", 0);
         d3.select(this)
             .attr("fill", function(d) {
               index = parseInt((d / d3.max(values)) * 18);
               return colorList[index]
             })
        });

  // Make the axes
  var xAxis = d3.svg.axis()
    .scale(Xscale)
    .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(Yscale)
      .orient("left");

  svg.append("g")
    .attr("transform", `translate(0, ${h})`)
    .call(xAxis);
  svg.append("g")
    .call(yAxis);

  // Actually add the tooltip
  var div = d3.selectAll("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Add the axis-labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${w / 2}, ${h + margin.bottom / 1.5})`)
    .text("Type")

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${-margin.left / 1.5}, ${h / 2})rotate(-90)`)
    .text("Score")
}

function calculateCountryValues(id) {
  var groupCode = _.groupBy(globalData[0], obj => obj.Code);
  if (groupCode[id]) {
    console.log("if statements")
    countryValues = groupCode[id][0]
    delete countryValues["Country"]
    delete countryValues["Code"]
    delete countryValues["Happiness.Rank"]
    returnList = [];
    for (var index in Object.values(countryValues)) {
      returnList.push(parseFloat(Object.values(countryValues)[index]));
    }
    return returnList;
  }
  else {
    return false;
  }
}

function changeColor(data, spec) {
  var obj = {};
  var colorRange = ["#ff0000", "#6600ff"];
  var both = loadSpecData(data, spec)
  var specDict = both[0];
  var valueList = both[1];
  console.log(d3.max(valueList))
  var color = d3.scale.linear().range(colorRange).domain([d3.min(valueList), d3.max(valueList)])
  for (var index in specDict) {
    obj[index] = color(specDict[index].value);
    map.updateChoropleth(obj);
  }
}

function loadSpecData(data, spec) {
  newDict = {};
  valueList = [];
  var groupCode = _.groupBy(data, obj => obj.Code);
  for (var index in groupCode) {
    if (index != "NaN") {
      newDict[index] = {value: parseFloat(groupCode[index][0][spec])};
      valueList.push(parseFloat(groupCode[index][0][spec]))
    }
  }
  return [newDict, valueList];
}
