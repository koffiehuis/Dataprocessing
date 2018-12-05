// Mark van Malestein
// 10807640
// d3-scatterplot

// direct laden van ........................
var startYear = 2007;
var endYear = 2015;


window.onload = function() {

  var womenInScience = "http://stats.oecd.org/SDMX-JSON/data/MSTI_PUB/TH_WRXRS.FRA+DEU+KOR+NLD+PRT+GBR/all?startTime=2007&endTime=2015"
  var consConf = "http://stats.oecd.org/SDMX-JSON/data/HH_DASH/FRA+DEU+KOR+NLD+PRT+GBR.COCONF.A/all?startTime=2007&endTime=2015"

  var requests = [d3.json(womenInScience), d3.json(consConf)];

  var data = [];

  Promise.all(requests).then(function(response) {
    data = transformResponse(response)
    makeChart(data)
  }).catch(function(e){
      throw(e);
  });
};

function transformResponse(data){
    // access data
    let scienceData = data[0], houseData = data[1];

    // get series
    let scienceValues = scienceData.dataSets[0].series
    let houseValues = houseData.dataSets[0].series

    // get valyes is hetzelfde..
    let scienceYears = scienceData.structure.dimensions.observation[0].values
    let houseYears = houseData.structure.dimensions.observation[0].values

    let scienceCountries = scienceData.structure.dimensions.series[1].values
    let houseCountries = houseData.structure.dimensions.series[0].values

    let combiDict = combineData(scienceValues, scienceCountries, houseValues,
    houseCountries)

    array = toArray(combiDict, houseYears)
    return array;
}

function combineData(scienceValues, scienceCountries, houseValues,
houseCountries) {
  let dict = {}
  for (var i = 0; i <  Object.keys(scienceValues).length; i++) {
    var key = scienceCountries[i].id
    var weirdIndex = `0:${i}`
    var value = scienceValues[weirdIndex].observations
    dict[key] = {science: value}
  }

  for (var i = 0; i <  Object.keys(houseValues).length; i++) {
    var key = houseCountries[i].id
    var weirdIndex = `${i}:0:0`
    var value = houseValues[weirdIndex].observations
    Object.assign(dict[key], {house: value});
  }
  return dict
}


function toArray(d, y) {
  arr = [];
  for (var key in d) {
    miniArr = [];
    index = 0;
    for (var mand = 0; mand < 9; mand++){
      if (isNaN(parseInt(d[key]["science"][mand]))) {
        sci = -1;
      }
      else {
        sci = d[key]["science"][mand][0];
      }
      if (isNaN(parseInt(d[key]["house"][mand]))) {
        hou = -1;
      }
      else {
        hou = d[key]["house"][mand][0];
      }
      miniArr.push([key, sci, hou])
      index++;
    }
    arr.push(miniArr);
  }
  return arr;
}

function makeChart(data) {
  // size
  var margin = {top: 20, right: 10, bottom: 50, left: 80};
  var w = 1000 - margin.left - margin.right;
  var h = 600 - margin.top - margin.bottom;

  var xMin = Math.min.apply(Math, getData(data, "science"));
  var xMax = Math.max.apply(Math, getData(data, "science"));

  console.log(xMin)
  console.log(xMax)

  var Yscale = d3.scaleLinear()
                .domain([xMin, xMax])
                .range([h, 0]);
  var Xscale = d3.scaleLinear()
                .domain([startYear, endYear])
                .range([0, w])

  // var xValue = function(d) {
  //
  // }

  var svg = d3.select("body")
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", function(d) { return xScale(xValue(d));})
      .attr("cy", function(d) { return yScale(xValue(d));})
}

// Functions to transform coordinates

function getData(data, spec) {
  array = [];
  data.map(function (i) {
    for (var elem in i) {
      if (i[elem][1] > 0 && spec == "science") {
        array.push(parseFloat(i[elem][1]))

      }
      if (i[elem][2] && spec == "house") {
        array.push(parseFloat(i[elem][2]))
      }
    }
  });
  return array
}
