// Mark van Malestein
// 10807640
// d3-scatterplot

// Late day wildcard

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
  let arr = [];
  let yearArray = [];
  for (var i = startYear; i <= endYear; i++) {
    yearArray.push(i)
  }
  for (var key in d) {
    miniArr = [];
    index = 0;
    for (var mand = 0; mand < 9; mand++){
      if (isNaN(parseInt(d[key]["science"][mand]))) {
        sci = -1000;
      }
      else {
        sci = d[key]["science"][mand][0];
      }
      if (isNaN(parseInt(d[key]["house"][mand]))) {
        hou = -1000;
      }
      else {
        hou = d[key]["house"][mand][0];
      }
      arr.push({id: key, science: sci, house: hou, year: yearArray[index]})
      index++;
    }
  }
  return arr;
}

function makeChart(data) {
  // size
  var xSpec = "year"
  var ySpec = "science"

  var margin = {top: 20, right: 30, bottom: 50, left: 80};
  var w = 1000 - margin.left - margin.right;
  var h = 600 - margin.top - margin.bottom;

  valueList = getDatapoints(data, xSpec)
  var xMin = d3.min(valueList);
  var xMax = d3.max(valueList);

  valueList = getDatapoints(data, ySpec)
  var yMin = d3.min(valueList);
  var yMax = d3.max(valueList);


  var svg = d3.select("body")
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([h, 0]),
      yValue  = function(d) {
        return d[ySpec];
      },
      yMap = function(d) {
        return yScale(yValue(d));
      },
      yAxis = d3.axisLeft()
        .scale(yScale);

  var xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, w]),
      xValue = function(d) {
        return d[xSpec];
      },
      xMap = function(d) {
        return xScale(xValue(d));
      },
      xAxis = d3.axisBottom()
        .scale(xScale);

  svg.selectAll(".dot")
      .data(data)
    .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", "black")
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
        });

  svg.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(xAxis);
  svg.append("g")
      .call(yAxis);

      // Show tooltip and change bar's color when the cursor hovers over

  // Add the axis-labels
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${w / 2}, ${h + margin.bottom / 1.5})`)
      .text(`${xSpec}`)
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-margin.left / 2}, ${h / 2})rotate(-90)`)
      .text(`${ySpec}`)

  var div = d3.selectAll("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

}

function getDatapoints(data, spec) {
  valueList  = [];
  for (var elem in data) {
    if (data[elem][spec] > -1){
      valueList.push(data[elem][spec]);
    }
  }
  return valueList;
}
