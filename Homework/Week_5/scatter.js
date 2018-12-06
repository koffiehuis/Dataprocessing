// Mark van Malestein
// 10807640
// d3-scatterplot

// Late day wildcard

// Onthoudt niet alle opties wanneer je opties verandert :(
var startYear = 2007;
var endYear = 2015;

// Get data from API when page loads
window.onload = function() {

  var womenInScience = "http://stats.oecd.org/SDMX-JSON/data/MSTI_PUB/TH_WRXRS.FRA+DEU+KOR+NLD+PRT+GBR/all?startTime=2007&endTime=2015"
  var consConf = "http://stats.oecd.org/SDMX-JSON/data/HH_DASH/FRA+DEU+KOR+NLD+PRT+GBR.COCONF.A/all?startTime=2007&endTime=2015"

  var requests = [d3.json(womenInScience), d3.json(consConf)];

  var data = [];

  // If requests are finished, make data arrays and initialize chart
  Promise.all(requests).then(function(response) {
    dataArray = transformResponse(response);
    data = dataArray[0];
    countryList = dataArray[1];
    makeChart(data, countryList, "science", "house", "ALL")
    load(data, countryList)
  }).catch(function(e){
      throw(e);
  });
};

// Gets options from user and reloads chart
function load(data, countryList) {
  // initializeing variables
  var country = "ALL"
  var xSpec = "science"
  var ySpec = "house"

  // Make array with dicts with country names and abbreviations
  // Include 'all countries' option
  countryOptions = [{id: "ALL", name: "All Countries"}]
  for (var index in countryList) {
    countryOptions.push(countryList[index])
  }

  // Make first dropdown menu for countries
  var options1 = d3.select("#options1")

    options1
		.append("select")
		.selectAll("option")
        .data(countryOptions)
        .enter()
        .append("option")
        .attr("value", function(d){
            return d.id;
        })
        .text(function(d){
            return d.name;
        })

    // Make second dropdown menu for X-axis
    var options2 = d3.select("#options2")

    options2
		.append("select")
		.selectAll("option")
        .data([{short: "house", long: "Consumer Confidence Index"}, {short: "year", long:"Years"}, {short: "science", long: "% of Women in Science"}])
       	.enter()
        .append("option")
        .attr("value", function(d){
            return d.short;
        })
        .text(function(d){
            return d.long;
        })

    // Make third dropdown for Y-axis
    var options3 = d3.select("#options3")

      options3
  		.append("select")
  		.selectAll("option")
          .data([{short: "science", long: "% of Women in Science"}, {short: "house", long: "Consumer Confidence Index"}])
         	.enter()
          .append("option")
          .attr("value", function(d){
              return d.short;
          })
          .text(function(d){
              return d.long;
          })
  // If first country option changes
  options1.on('change', function(){
 		var country = d3.select(this)
            .select("select")
            .property("value")
        // Update chart
        makeChart(data, countryList, xSpec, ySpec, country)
    });

  // If second country option changes
  options2.on('change', function(){
    var xSpec = d3.select(this)
            .select("select")
            .property("value")
        // Update chart
        makeChart(data, countryList, xSpec, ySpec, country)
    });

    // If third country option change
    options3.on('change', function(){
      var ySpec = d3.select(this)
              .select("select")
              .property("value")
          // Update chart
          makeChart(data, countryList, xSpec, ySpec, country)
      });
}


// Transforms raw data to useable data
function transformResponse(data){
    // access data
    let scienceData = data[0], houseData = data[1];

    // get series
    let scienceValues = scienceData.dataSets[0].series
    let houseValues = houseData.dataSets[0].series

    // get years
    let scienceYears = scienceData.structure.dimensions.observation[0].values
    let houseYears = houseData.structure.dimensions.observation[0].values

    // get countries
    let scienceCountries = scienceData.structure.dimensions.series[1].values
    let houseCountries = houseData.structure.dimensions.series[0].values

    // combine all data into dict
    let combiDict = combineData(scienceValues, scienceCountries, houseValues,
    houseCountries)

    // return as array of dicts
    array = toArray(combiDict, houseYears)
    return [array, scienceCountries];
}

// Makes dict of all lists
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

// Converts dict to array of dicts
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

//  Actually make the chart
function makeChart(data, countryList, xSpec, ySpec, country) {

  // clear old chart if there was one
  d3.selectAll("svg").remove()

  // filter country-specific data
  if (country != "ALL") {
    countryList = country
    data = data.filter(elem => elem.id === country)
  }

  var other = "year"
  var colorDict = {FRA: "#800000", DEU: "#9A6324", KOR: "#808000", NLD: "#469990",PRT: "#000075", GBR: "#000000"};

  // Sizing up the SVG
  var margin = {top: 80, right: 150, bottom: 50, left: 80};
  var w = 1000 - margin.left - margin.right;
  var h = 600 - margin.top - margin.bottom;

  // Calculate limits
  valueList = getDatapoints(data, xSpec)
  var xMin = d3.min(valueList);
  var xMax = d3.max(valueList);

  valueList = getDatapoints(data, ySpec)
  var yMin = d3.min(valueList);
  var yMax = d3.max(valueList);

  // Make the svg
  var svg = d3.select("body")
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Scaling for datapoints and axis
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

  // Scaling for datapoints and axis
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

  // place the datapoints
  svg.selectAll(".dot")
      .data(data)
    .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) {
        return colorDict[d.id]
      })

      // Make tooltip appear and disappear
      .on("mouseover", function(d) {
        div.transition()
             .duration(200)
             .style("opacity", .8);
         div .html(`${d.id}:`+ "<br>" +`${d[other]}`)
             .style("left", (d3.event.pageX) + "px")
             .style("top", (d3.event.pageY - 30) + "px");
        d3.select(this)
        .attr("fill", "red");
      })
      .on("mouseout", function(d) {
        div.transition()
           .duration(500)
           .style("opacity", 0);
        d3.select(this)
           .attr("fill", function(d) {
             return colorDict[d.id];
           })
      });

  // add the Axes
  svg.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(xAxis);
  svg.append("g")
      .call(yAxis);

  // Add the axis-labels
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${w / 2}, ${h + margin.bottom / 1.5})`)
      .text(`${xSpec}`)
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-margin.left / 2}, ${h / 2})rotate(-90)`)
      .text(`${ySpec}`)

  // Add dynamic title
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${w / 2}, ${-margin.top / 2})`)
      .style("font-size", "16px")
      .style("text-decoration", "underline")
    .text(`Graph showing ${ySpec} VS ${xSpec}`)

  // Make element for tooltip
  var div = d3.selectAll("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // make element for legend
  var legend = svg.selectAll(".legend")
      .data(Object.keys(colorDict))
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(60," + i * 20 + ")"; })

  // make box for legend
  legend.append("rect")
      .attr("x", w - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d) { return colorDict[d] });

  // include
  legend.append("text")
      .attr("x", w + 12)
      .attr("y", 9)
      .attr("dy", ".40em")
      .style("text-anchor", "start")
      .text(function(d) { return d; });
}

// Return list of values only for calculation limits
function getDatapoints(data, spec) {
  valueList  = [];
  for (var elem in data) {
    if (data[elem][spec] > -1){
      valueList.push(data[elem][spec]);
    }
  }
  return valueList;
}
