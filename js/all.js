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
var places = [ "Oslo", "Bergen", "Stavanger", "Trondheim", "Tromsø", "stroke Norway"];


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
  effectLayer.selectAll('path.fylker')
  .data(features1)
  .enter().append('path')
  .attr('class', 'fylker')
  .attr('d', path)
  .attr('stroke-width', 1.5)
  .attr('type', 'fylkes')
  .attr('fylkes-name', function(d) {
    return d.properties.navn;
  })
  //.attr('stroke-opacity', 0.1)
  .attr('vector-effect', 'non-scaling-stroke')
  .attr('pointer-events', 'none')
  //.style('fill', fillFn)
  .style('opacity', 0.6);
  //.on('mouseover', mouseover2)
  //.on('mouseout', mouseout2);
  //.on('click', clicked);
  
  // load the kommuner data after the fylker data  
});

// Load map data
d3.json(fname).then(function (mapData) {
  var features2 = mapData.features;
  
  // Update color scale domain based on data
  color.domain([0, d3.max(features2, nameLength)]);
  
  // Draw each province as a path
  mapLayer.selectAll('path.kommuner')
  .data(features2)
  .enter().append('path')
  .attr('class', 'kommuner')
  .attr('d', path)
  .attr('stroke-width', 1.5)
  .attr('stroke-opacity', 0.8)
  .attr('vector-effect', 'non-scaling-stroke')
  .attr('type', 'kommuner')
  .attr('kommune-name', function(d) {
    return d.properties.navn;
  })
  .style('fill', fillFn)
  .style('opacity', 0.3)
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
      textArt(nameFn(d), numFn(d), "RegionNameHighlighted");
    }
    return d; 
  });
}

function moveMap(lat, lon) {
  k = k_zoomed;
  g.transition()
  .duration(750)
  .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
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

/*function mouseover2(d) {
  d3.select(this).style('fill', 'orange');
}
function mouseout2(d) {
  effectLayer.selectAll('path')
  .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });  
} */

function mouseover(d) {
  // Highlight hovered province
  d3.select(this).style('fill', 'orange');
  var x = d3.event.pageX;
  var y = d3.event.pageY;
  function getAllElementsFromPoint(x, y) { 
    // remove all highlights
    jQuery('svg path.fylker').each(function(b,a) { jQuery(a).removeClass('highlighted'); });
    // disable the map layer and enable the fylker layer
    mapLayer.selectAll('path').style('pointer-events', 'none');
    effectLayer.selectAll('path').style('pointer-events', 'auto');
    var items = document.elementsFromPoint(x, y); // this only works if we have the correct pointer-events setting
    // undo again
    mapLayer.selectAll('path').style('pointer-events', 'auto');
    effectLayer.selectAll('path').style('pointer-events', 'none');
    items.forEach(function (a, b) { 
      if (a.tagName == "path" && jQuery(a).hasClass('fylker')) {
        //console.log("found a path");
        // set the color now
        jQuery(a).addClass('highlighted');
        // we should add the name of the fylke to the .sub-title as well
        var fylke_name = jQuery(a).attr('fylkes-name');
        jQuery('.RegionName div.sub-title').text(fylke_name);
        console.log("add region name: " + fylke_name)
      }
    });
  }
  getAllElementsFromPoint(x, y);
  
  // Draw effects
  textArt(nameFn(d), numFn(d));
}

function mouseout(d) {
  // Reset province color
  mapLayer.selectAll('path')
  .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });
  // remove all highlights
  jQuery('svg path.fylker').each(function(b,a) { jQuery(a).removeClass('highlighted'); });
  
  // Remove effect text
  //  effectLayer.selectAll('path').transition()
  //  .style('opacity', 0)
  //  .remove();
  
  // Clear province name
  bigText.text('');
}

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
function textArt(text, number, region, sub_text) {
  if (typeof region == "undefined") {
    // default to the RegionName
    region = "RegionName";
  }
  if (number == 301)
    number = "0301"; // for Oslo only
  
  // we should do the text in non-SVG
  jQuery('.'+region+' div.title').html(text);
  if (typeof sub_text != "undefined") {
    jQuery('.'+region+' div.sub-title').html(sub_text);
  }
  jQuery('.'+region+' div.description').addClass('hide');
  jQuery('.'+region+' div.source').addClass('hide');
  jQuery('.'+region+' div.sub-title').addClass('hide');
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
      jQuery('.'+region+' div.sub-title').removeClass('hide');
    });
  }, 500);
  
  return;
  
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
  var StdAges = {};
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

    var eligStdAgeList = eligSection?.StdAgeList?.StdAge;
    var stdAgeList_here = {};
    if (typeof eligStdAgeList != "undefined") {
      for (var j = 0; j < eligStdAgeList.length; j++) {
        if (typeof StdAges[eligStdAgeList[j]] == "undefined") {
          StdAges[eligStdAgeList[j]] = 1;
        } else {
          StdAges[eligStdAgeList[j]]++;
        }
        if (typeof stdAgeList_here[eligStdAgeList[j]] == "undefined") {
          stdAgeList_here[eligStdAgeList[j]] = 1;
        } else {
          stdAgeList_here[eligStdAgeList[j]]++;
        }
      }
    }
    
    var idModule = studies[i]["Study"]["ProtocolSection"]["IdentificationModule"];
    var REK = idModule['OrgStudyIdInfo']['OrgStudyId'];
    
    txt += "<div class=\"result-row\" std-ages='" + Object.keys(stdAgeList_here).join(";") + "'><div class=\"results-title\">" + idModule["BriefTitle"] + "</div></br><div class=\"results-organization\">" + idModule["Organization"]["OrgFullName"] + "</div><div class=\"results-reference\">" 
    + ref + "</div><div class=\"sponsor\">" + sponsor + "</div><div class=\"collaborator\">" 
    + collaborators + "</div><div class=\"labels\"><div class=\"numPart\" title=\"Number of participants the study accepts.\">" 
    + participants + "</div><div class=\"studyType\" title=\"Type of the study.\">" + StudyType + "</div><div class=\"NCTId\" title=\"Identifier assigned by the registry.\">" 
    + idModule['NCTId'] + "</div><div class=\"REK\" title=\"Ethics board approval number.\">" + REK + "</div></div><div class=\"eligibility\">" + Eligibility + "</div></div><hr>";
  }
  jQuery('#results').html(txt);
  jQuery('#results').removeClass('hide');
  // update the StdAges list on screen
  var stdages_keys = Object.keys(StdAges);
  jQuery('#results-std-ages').children().remove();
  for (var i = 0; i < stdages_keys.length; i++) {
    jQuery('#results-std-ages').append("<button class='btn btn-primary btn-sm py-0 stdage-button drag-item' draggable='true' data-bs-toggle='button'>" + stdages_keys[i] + "</button>");
  }
  makeButtonListDraggable();
  //console.log("result is: " + JSON.stringify(data));
});
}

var map = null;
//var mtLayer = null;
function setupMap(location, zoom) {
  // return;
  if (typeof location === "string") {
    // do a geocoding lookup
    jQuery.getJSON("https://nominatim.openstreetmap.org/search", { q: location, format: "json"}, function(data) {
    if (data.length == 0) {
      // make map invisible again
      jQuery('#leaf-map').fadeOut();
      return;    
    }
    jQuery('#leaf-map').fadeIn();
    setupMap([ data[0].lat, data[0].lon ], zoom);
    //moveMap(data[0].lat, data[0].lon);
  });
  return;
}

if (map == null) {
  // style = L.MaptilerStyle.DATAVIZ.LIGHT;
  map = L.map('leaf-map', { zoomControl: false, attributionControl: false}).setView([location[0], location[1]], zoom);
  //mtLayer = L.maptilerLayer({
  //  apiKey: key,
  //  style: L.MaptilerStyle.STREETS, // optional
  //}).addTo(map);
  //mtLayer.setStyle(style);
  // more styles from: http://leaflet-extras.github.io/leaflet-providers/preview/
  //var styledMap = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
  //var styledMap = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var styledMap = "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png";
  L.tileLayer(styledMap, {
    maxZoom: 19,
    attribution: ''
  }).addTo(map);
} else {
  map.setView([location[0], location[1]], zoom);
}
}

  // we should make the button list dragabble so the order of elements can be changed
function makeButtonListDraggable() {
  const dragList = document.getElementById('results-std-ages');
    let draggedItem = null;

    // Add event listeners for drag and drop events
    dragList.addEventListener('dragstart', handleDragStart);
    dragList.addEventListener('dragover', handleDragOver);
    dragList.addEventListener('drop', handleDrop);

    // Drag start event handler
    function handleDragStart(event) {
      draggedItem = event.target;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', draggedItem.innerHTML);
      event.target.style.opacity = '0.5';
    }

    // Drag over event handler
    function handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const targetItem = event.target;
      if (targetItem !== draggedItem && targetItem.classList.contains('drag-item')) {
        const boundingRect = targetItem.getBoundingClientRect();
        const offset = boundingRect.x + (boundingRect.width / 2);
        if (event.clientX - offset > 0) {
          targetItem.style.borderRight = 'solid 2px #000';
          targetItem.style.borderLeft = '';
        } else {
          targetItem.style.borderRight = 'solid 2px #000';
          targetItem.style.borderLeft = '';
        }
      }
    }

    // Drop event handler
    function handleDrop(event) {
      event.preventDefault();
      const targetItem = event.target;
      if (targetItem !== draggedItem && targetItem.classList.contains('drag-item')) {
        if (event.clientX > targetItem.getBoundingClientRect().left + (targetItem.offsetWidth / 2)) {
          targetItem.parentNode.insertBefore(draggedItem, targetItem.nextSibling);
        } else {
          targetItem.parentNode.insertBefore(draggedItem, targetItem);
        }
      }
      targetItem.style.borderRight = '';
      targetItem.style.borderLeft = '';
      draggedItem.style.opacity = '';
      draggedItem = null;
    }
}


jQuery(document).ready(function() {
  jQuery('#search-button').on('click', function() {
    var name = jQuery('#inputSearch').val();
    jQuery('#inputSearch').val(name);
    jQuery('#inputSearch').trigger('change');
    sampleClick(name);
    search(name);
    setupMap(name, 14);
  });
  jQuery('#inputSearch').on('keyup', function(e) {
    var key = e.which;
    if(key == 13) {
      var name = jQuery('#inputSearch').val();
      jQuery('#inputSearch').val(name);
      jQuery('#inputSearch').trigger('change');
      sampleClick(name);
      search(name);
      setupMap(name, 14);
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
    setupMap(name, 14);
  });
  
  jQuery('#results').on('click', 'div.results-organization', function() {
    var txt = jQuery(this).text();
    jQuery('#inputSearch').val(txt);
    jQuery('#inputSearch').trigger('change');
    sampleClick(txt);
    search(txt);
    setupMap(txt, 14);
  });
  
  jQuery('#actions a').on('click', function(ev) {
    // download current query as csv
    var csvContent = "NCT-Id,title,sponsor,REK\n";
    jQuery('#results div.result-row').each(function(i, a) {
      var title = jQuery(a).find('div.results-title').text();
      var sponsor = jQuery(a).find('div.sponsor').text();
      var REK = jQuery(a).find('div.REK').text();
      var NCTId = jQuery(a).find('div.NCTId').text();
      csvContent += NCTId.replaceAll(",","") + "," +
      title.replaceAll(",", ";").replaceAll("\n","") + "," +
      sponsor.replace("sponsor: ", "").replaceAll(",", ";").replaceAll("\n","") + "," +
      REK.replaceAll(",","") + "\n";
    }); 
    // var encodedUri = encodeURI(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv' }); 
    // Creating an object for downloading url 
    const url = window.URL.createObjectURL(blob) 
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "map-of-norway-search-results.csv");
    document.body.appendChild(link); // Required for FF
    
    link.click();
    document.body.removeChild(link);
    ev.preventDefault();
  });
  
  // do something at the beginning
  jQuery('#inputSearch').val("");
  setTimeout(function() {
    "Oslo".split("").forEach(function(a, i, ar) { 
      setTimeout(function() { 
        jQuery('#inputSearch').val(jQuery('#inputSearch').val() + a);
        if (i == ar.length-1)
        jQuery('#search-button').click();
      }, i*100); 
    });
    
    //jQuery('#inputSearch').val("Bergen");
    //jQuery('#search-button').click();
  }, 1000);



  jQuery('#actions').on('click', 'button.stdage-button', function() {
    // what are the active standard ages?
    active_ages_list = jQuery('#actions button.stdage-button.active').map(function(i, a) { return jQuery(a).text(); });
    // if we have no active button, show all
    if (active_ages_list.length == 0) {
      jQuery('div.result-row').each(function(i, row) {
        jQuery(this).removeClass('disabled-entry');
      });
      return;
    }

    // we can go through the list of active buttons to compute the logic we need
    jQuery('div.result-row').each(function(i, row) {
      var ages_elig = jQuery(this).attr('std-ages').split(";");
      var matches = ages_elig.map(function(a) { 
        if (active_ages_list.toArray().indexOf(a) > -1) 
          return true; 
        return false; 
      }).reduce(function(a, b) { return a || b; }, false);
      if (matches) {
        jQuery(this).removeClass('disabled-entry');
      } else {
        jQuery(this).addClass('disabled-entry');
      }
    });
  });
});
