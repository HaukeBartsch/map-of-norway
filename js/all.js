// TODO: Add the European system as well https://www.ema.europa.eu/en/human-regulatory-overview/research-and-development/clinical-trials-human-medicines/clinical-trials-information-system
// TODO: Add REK as well
// TODO: Allow to export all values

//
// configuration fylker
//
var fname = 'regions/map.geojson';
var center_coord = [13.174043, 65.8368];
var init_zoom = 1400;
var k_zoomed = 4;
// good places to look for stuff
var places = [ "Oslo", "Bergen", "Stavanger", "stroke Norway"];


function nameFn(d) {
  //return d && d.properties ? d.properties.NOMBRE_DPT : null;
  return d && d.properties ? d.properties.VARNAME_1 : null;
}

//
// configuration kommuner
//
fname = 'komuner/Kommuner-large.json';
k_zoomed = 7;

//
// configuration fylkes
fname_fylker = "fylker/Fylker-large.json";


// Get province name
function nameFn(d) {
  //return d && d.properties ? d.properties.NOMBRE_DPT : null;
  return d && d.properties ? d.properties.navn : null;
}

function numFn(d) {
  return d && d.properties ? d.properties.kommunenummer : null;
}


var width = window.innerWidth, // 1200,
height = window.innerHeight, // 1000,
centered;

// Define color scale
/*   var color = d3.scale.linear()
.domain([1, 20])
.clamp(true)
.range(['#fff', '#409A99']); */
var color = d3.scaleLinear().domain([1, 20]).clamp(true).range(['#87CEFA', '#87CEFA']);

var projection = d3.geoMercator()
.scale(init_zoom)
// Center the Map in Norway 63°59′26″N 12°18′28″E
.center(center_coord)
.translate([width / 2, height / 2]);

var path = d3.geoPath()
.projection(projection);

// Set svg width & height
var svg = d3.select('svg')
.attr("preserveAspectRatio", "xMinYMin meet")
.classed("svg-content-responsive", true)
.attr('width', width)
.attr('height', height);

// Add background
svg.append('rect')
.attr('class', 'background')
.attr('width', '100%')
.attr('height', '100%')
.on('click', clicked);

var g = svg.append('g');

var effectLayer = g.append('g')
.classed('effect-layer', true);

var mapLayer = g.append('g')
.classed('map-layer', true);

var dummyText = g.append('text')
.classed('dummy-text', true)
.attr('x', 10)
.attr('y', 30)
.style('opacity', 0);

var bigText = g.append('text')
.classed('big-text', true)
.attr('x', 20)
.attr('y', 45);

// load the base maps
d3.json(fname_fylker).then(function (mapData) {
    var features1 = mapData.features;
    
    // Update color scale domain based on data
    color.domain([0, d3.max(features1, nameLength)]);
    
    // Draw each province as a path
    effectLayer.selectAll('path')
    .data(features1)
    .enter().append('path')
    .attr('d', path)
    .attr('stroke-width', 1.5)
    .attr('type', 'fylkes')
    //.attr('stroke-opacity', 0.1)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('fill', fillFn)
    .style('opacity', 1)
    .on('mouseover2', mouseover)
    .on('mouseout2', mouseout)
    //.on('click', clicked);

    // load the kommuner data after the fylker data  
});
  
    // Load map data
    d3.json(fname).then(function (mapData) {
        var features2 = mapData.features;
        
        // Update color scale domain based on data
        color.domain([0, d3.max(features2, nameLength)]);
        
        // Draw each province as a path
        mapLayer.selectAll('path')
        .data(features2)
        .enter().append('path')
        .attr('d', path)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('type', 'kommuner')
        .attr('kommune-name', function(d) {
            return d.properties.navn;
        })
        .style('fill', fillFn)
        .style('opacity', 0.5)
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', clicked);
    });




// Get province name length
function nameLength(d) {
  var n = nameFn(d);
  return n ? n.length : 0;
}

// Get province color
function fillFn(d) {
  return color(nameLength(d));
}

function sampleClick(name) {
    // some example samples based on names
    var my_d = mapLayer.selectAll('path').filter(function(d) {
        if (d.properties.navn == name) {
          clicked(d);
          textArt(nameFn(d), numFn(d), "ResultNameHighlighted");
        }
        return d; 
    });
}

// When clicked, zoom in
function clicked(d) {
  var x, y, k;
  
  // Compute centroid of the selected path
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0]-20;
    y = centroid[1];
    k = k_zoomed;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
    // reset the clicked info as well
    jQuery('.RegionNameHighlighted div.title').html("");
    jQuery('.RegionNameHighlighted div.description').html("");
  }
  
  // Highlight the clicked province
  mapLayer.selectAll('path')
  .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });
  
//  effectLayer.selectAll('path')
//  .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });
  
  // Zoom
  g.transition()
  .duration(750)
  .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');

  // Copy name to search field
  var name = d.properties.navn;
  jQuery('#inputSearch').val(name);
  jQuery('#inputSearch').trigger('change');
  search();

  textArt(nameFn(d), numFn(d), "RegionNameHighlighted"); 
}

function mouseover2(d) {
    d3.select(this).style('fill', 'orange');
}
function mouseout2(d) {
    effectLayer.selectAll('path')
    .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });  
}

function mouseover(d, ev) {
  // Highlight hovered province
  d3.select(this).style('fill', 'orange');
  
  function getAllElementsFromPoint(rootEl, x, y) { 
    var item = document.elementFromPoint(x, y); 
    //in this case is tagName == "ellipse" but you can find something else in commun, like a class - for example.
    while (item && item.tagName == "ellipse") {
      item.classList.add("hover")
      item.style.pointerEvents = "none";
      item = document.elementFromPoint(x, y);
    }
  }
  //getAllElementsFromPoint(effectLayer, ev.clientX, ev.clientY);

  // Draw effects
  textArt(nameFn(d), numFn(d));
}

function mouseout(d) {
  // Reset province color
  mapLayer.selectAll('path')
  .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });
  
  // Remove effect text
//  effectLayer.selectAll('path').transition()
//  .style('opacity', 0)
//  .remove();
  
  // Clear province name
  bigText.text('');
}

// Gimmick
// Just me playing around.
// You won't need this for a regular map.

var BASE_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

var FONTS = [
"Open Sans",
"Josefin Slab",
"Arvo",
"Lato",
"Vollkorn",
"Abril Fatface",
"Old StandardTT",
"Droid+Sans",
"Lobster",
"Inconsolata",
"Montserrat",
"Playfair Display",
"Karla",
"Alegreya",
"Libre Baskerville",
"Merriweather",
"Lora",
"Archivo Narrow",
"Neuton",
"Signika",
"Questrial",
"Fjalla One",
"Bitter",
"Varela Round"
];

function pullDataFromSSB(number, callback) {
    // this might fail for Oslo for example (number == 0301)
  jQuery.ajax({
    type: 'POST',
    url:  'https://data.ssb.no/api/v0/en/table/11342/',
    data: JSON.stringify({
      "query": [
      {
        "code": "Region",
        "selection": {
          "filter": "agg_single:Komm2020",
          "values": [
          "" + number
          ]
        }
      },
      {
        "code": "Tid",
        "selection": {
          "filter": "item",
          "values": [
          "2023"
          ]
        }
      }
      ],
      "response": {
        "format": "json-stat2"
      }
    }),
    success: function(data) {
      //console.log("got a result back from ssb " + JSON.stringify(data));
      callback(data);
    },
    dataType: 'json' 
  });
}

var timeoutID_SSB = "";
function textArt(text, number, region) {
  if (typeof region == "undefined") {
    // default to the RegionName
    region = "RegionName";
  }
  if (number == 301)
    number = "0301"; // for Oslo only

  // we should do the text in non-SVG
  jQuery('.'+region+' div.title').text(text);
  jQuery('.'+region+' div.description').addClass('hide');
  jQuery('.'+region+' div.source').addClass('hide');
  //jQuery('.RegionName div.description').html(""); // remove old text, wait for new text to arrive from SSB
  // query for the information from https://www.ssb.no/en/statbank/table/11342/tableViewLayout1/
  if (timeoutID_SSB != "") {
    clearTimeout(timeoutID_SSB); // cancel the current timeout, start again with the newest one
  }
  timeoutID_SSB = setTimeout(function() {
      pullDataFromSSB(number, function(data) {
        // add to display
        // we have 3 different results
        var idx = data["dimension"]["ContentsCode"]["category"]["index"];
        var idx_keys = Object.keys(idx);
        //for (var i = 0; i < idx_keys.length; i++) {
        //  console.log(idx_keys[i] + ": " + idx[idx_keys[i]]);
        //}
        var labels = data["dimension"]["ContentsCode"]["category"]["label"];
        var units = data["dimension"]["ContentsCode"]["category"]["unit"];
        var values = data["value"];
        // now create a string based on idx_keys here
        var txt = "";
        for (var i = 0; i < idx_keys.length; i++) {
          var key = idx_keys[i];
          var key_num = idx[idx_keys[i]];
          txt += labels[key] + ": " + " " + (values[key_num]<1?"<1":values[key_num]) + " " + units[key]['base'] + ".</br>";
        }
        // blend in
        jQuery('.'+region+' div.source').html("<hr><div style='margin-top: -10px;'>" + data['source'] + " (last updated " + data['updated'] + ")</div>");
        jQuery('.'+region+' div.description').html(txt);
        jQuery('.'+region+' div.description').removeClass('hide');
        jQuery('.'+region+' div.source').removeClass('hide');
      });
  }, 500);
  
  return;
  
  // Use random font
  var fontIndex = Math.round(Math.random() * FONTS.length);
  var fontFamily = FONTS[fontIndex] + ', ' + BASE_FONT;
  
  bigText
  .style('font-family', fontFamily)
  .style('fill', "white")
  .text(text);
  
  // Use dummy text to compute actual width of the text
  // getBBox() will return bounding box
  dummyText
  .style('font-family', fontFamily)
  .text(text);
  var bbox = dummyText.node().getBBox();
  
  var textWidth = bbox.width;
  var textHeight = bbox.height;
  var xGap = 3;
  var yGap = 1;
  
  // Generate the positions of the text in the background
  var xPtr = 0;
  var yPtr = 0;
  var positions = [];
  var rowCount = 0;
  /*      while (yPtr < height) {
    while (xPtr < width) {
      var point = {
        text: text,
        index: positions.length,
        x: xPtr,
        y: yPtr
      };
      var dx = point.x - width / 2 + textWidth / 2;
      var dy = point.y - height / 2;
      point.distance = dx * dx + dy * dy;
      
      positions.push(point);
      xPtr += textWidth + xGap;
    }
    rowCount++;
    xPtr = rowCount % 2 === 0 ? 0 : -textWidth / 2;
    xPtr += Math.random() * 10;
    yPtr += textHeight + yGap;
  } */
  
  var selection = effectLayer.selectAll('text')
  .data(positions, function (d) {
    return d.text + '/' + d.index;
  });
  
  // Clear old ones
  selection.exit().transition()
  .style('opacity', 0)
  .remove();
  
  // Create text but set opacity to 0
  selection.enter().append('text')
  .text(function (d) { return d.text; })
  .attr('x', function (d) { return d.x; })
  .attr('y', function (d) { return d.y; })
  .style('font-family', fontFamily)
  .style('fill', '#777')
  .style('opacity', 0);
  
  selection
  .style('font-family', fontFamily)
  .attr('x', function (d) { return d.x; })
  .attr('y', function (d) { return d.y; });
  
  // Create transtion to increase opacity from 0 to 0.1-0.5
  // Add delay based on distance from the center of the <svg> and a bit more randomness.
    selection.transition()
    .ease(d3.easeLinear)
    .delay(function (d) {
      return d.distance * 0.01 + Math.random() * 1000;
    })
    .style('opacity', function (d) {
      console.log("change opacity now: " + (0.1 + Math.random() * 0.4));
      return (0.1 + Math.random() * 0.4);
    });
  }
  
  function search() {
    var searchTerm = jQuery('#inputSearch').val();
    if (searchTerm == "") {
        // clear the find box
        jQuery('#results').children().remove();
        return;
    }
    // start a search with the values found
    jQuery('#results').children().remove();
    jQuery('#results').addClass('hide');
    jQuery('#underneath').children().remove();
    jQuery.getJSON('https://classic.clinicaltrials.gov/api/query/full_studies?expr=' + encodeURIComponent(searchTerm) + '&min_rnk=1&max_rnk=50&fmt=json', function(data) {
        var under = data['FullStudiesResponse']["NStudiesFound"] + "/" + data['FullStudiesResponse']["NStudiesAvail"];
        // add some example click thingies
        for (var i = 0; i < places.length; i++)
            under += "&nbsp;&nbsp;<button class='btn btn-sm btn-outline-primary py-0' style='font-size:0.8em;'>" + places[i] + "</button>";
        jQuery('#underneath').html(under);
        var studies = data['FullStudiesResponse']['FullStudies'];
        if (typeof studies == "undefined")
            return; // nothing else to do
        var txt = "";
        for (var i = 0; i < studies.length; i++) {
            //var references = studies[i]["ReferencesModule"]["ReferenceList"]["Reference"];
            var ref = "";
            //for (var j = 0; j < references.length; j++) {
            //    ref += references["ReferenceCitation"];
            //}

            var sponsor = "";
            // in case we have a sponsor module
            var sponsorSection = studies[i]?.Study?.ProtocolSection?.SponsorCollaboratorsModule;
            if (typeof sponsorSection != "undefined" ) {
                // create a sponsor section
                sponsor += "sponsor: " + sponsorSection.LeadSponsor.LeadSponsorName;
                var investigator = sponsorSection?.ResponsibleParty?.ResponsiblePartyInvestigatorFullName;
                if (typeof investigator != 'undefined') {
                    sponsor += ", " + investigator;
                }
            }
            var collaborators = "";
            var collSection = sponsorSection?.CollaboratorList;
            if (typeof collSection != "undefined") {
                collaborators += "collaborators: ";
                for (var j = 0; j < collSection.Collaborator.length; j++) {
                    collaborators += collSection.Collaborator[j]["CollaboratorName"];
                    if (j < collSection.Collaborator.length-1)
                        collaborators += ", ";
                }
            }
            
            // expected number of participants
            var participants = "";
            var partSection = studies[i]?.Study?.ProtocolSection?.DesignModule?.EnrollmentInfo;
            if (typeof partSection != "undefined") {
                participants += partSection.EnrollmentCount;
            }

            // type of the study
            var StudyType = "";
            var designSection = studies[i]?.Study?.ProtocolSection?.DesignModule;
            if (typeof designSection != "undefined") {
                StudyType += designSection.StudyType;
            }

            // eligibility
            var Eligibility = "";
            var eligSection = studies[i]?.Study?.ProtocolSection?.EligibilityModule;
            if (typeof eligSection != "undefined") {
                Eligibility += eligSection.EligibilityCriteria;
            }

            var idModule = studies[i]["Study"]["ProtocolSection"]["IdentificationModule"];
            txt += "<div class=\"result-row\"><div class=\"results-title\">" + idModule["BriefTitle"] + "</div></br><div class=\"results-organization\">" + idModule["Organization"]["OrgFullName"] + "</div><div class=\"results-reference\">" 
                    + ref + "</div><div class=\"sponsor\">" + sponsor + "</div><div class=\"collaborator\">" 
                    + collaborators + "</div><div class=\"labels\"><div class=\"numPart\" title=\"Number of participants the study accepts.\">" 
                    + participants + "</div><div class=\"studyType\" title=\"Type of the study.\">" 
                    + StudyType + "</div></div><div class=\"eligibility\">" + Eligibility + "</div></div><hr>";
        }
        jQuery('#results').html(txt);
        jQuery('#results').removeClass('hide');
        console.log("result is: " + JSON.stringify(data));
    });
    //ev.preventDefault();
    //return false;
  }

jQuery(document).ready(function() {
    jQuery('#search-button').on('click', search);
    jQuery('#inputSearch').on('keyup', function(e) {
        var key = e.which;
        if(key == 13) {
            search();
        }
    });

    var under = "";
    for (var i = 0; i < places.length; i++)
        under += "&nbsp;&nbsp;<button class='btn btn-sm btn-outline-primary py-0' style='font-size:0.8em;'>" + places[i] + "</button>";
    jQuery('#underneath').html(under);

    jQuery('#underneath').on('click', 'button', function() {
        var name = jQuery(this).text();
        jQuery('#inputSearch').val(name);
        jQuery('#inputSearch').trigger('change');
        sampleClick(name);
        search(name);
    });
});