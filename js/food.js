/*This software is released under the MIT License

Copyright (C) 2014 Denes Csala http://www.csaladen.es

The following software uses the javascript frameworks below,
all of which are distributed under the MIT or GNU/GPL license:
D3.js http://d3js.org/  data-oriented javascript framework. 
	- Sankey plugin http://bost.ocks.org/mike/sankey/ for D3.js (heavily modified) by Mike Bostock's, 
	  which is based on the initial version http://tamc.github.io/Sankey/ by Thomas Counsell. 
	  I have incorporated the ability to render Sankey cycles, as pioneered by https://github.com/cfergus
	- Dragdealer.js href="http://skidding.github.io/dragdealer/ by Ovidiu Chereches
*/

//<!--DATA INIT-->

var data={"nodes": [], "links": []}

//<!--DATA ENTRY-->

nodesform=d3.select("#nodes-form");
function addnode() {
	nodesform.append("div").append("input").attr("value","New Node");
}
function removenode() {
	nodesform[0][0].children[linksform[0][0].children.length-1].remove("div")
}
linksform=d3.select("#links-form");
function addlink() {
	linksform.append("div").append("input").attr("value","0,1,0.52");
}
function removelink() {
	linksform[0][0].children[linksform[0][0].children.length-1].remove("div")
}
function draw() {
	
	data={"nodes": [], "links": []}
	
	for (i = 0; i < nodesform[0][0].children.length; i++) {
		data.nodes.push({"name": nodesform[0][0].children[i].children[0].value});
	}
	for (i = 0; i < linksform[0][0].children.length; i++) {
		var array = linksform[0][0].children[i].children[0].value.split(',');
		data.links.push({"source":parseInt(array[0]),"target":parseInt(array[1]),"value":parseFloat(array[2])});
	}
	change(data);
}
//<!--SANKEY DIAGRAM-->

var padding = 28;
var paddingmultiplier = 50;
var lowopacity = 0.3;
var highopacity = 0.7;
var format2Number = d3.format(",.2f"),
    formatNumber = d3.format(",.0f"),
    format = function(a) {
        return formatNumber(a)
    },
    format2 = function(a) {
        return format2Number(a)
    },
    color = d3.scale.category20();
d3.select("#chart").style("width", document.getElementById("chart").offsetWidth - sizecorrection)
d3.select("#titlebar").style("width", document.getElementById("titlebar").offsetWidth - sizecorrection)
var margin = {
        top: 70,
        right: 10,
        bottom: 12,
        left: 40
    },
    width = document.getElementById("chart").offsetWidth - margin.left - margin.right,
    height = document.getElementById("chart").offsetHeight - margin.bottom - 90;
var svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
var path = sankey.reversibleLink();
var change = function() {};

change = function(d) {
					
	padding = paddingmultiplier * (1 - densityslider.getValue()[0]) + 3
	svg.selectAll("g").remove();
	sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
	sankey.nodes(d.nodes).links(d.links).layout(500);
	var g = svg.append("g") //link
		.selectAll(".link").data(d.links).enter().append("g").attr("class", "link").sort(function(j, i) {
			return i.dy - j.dy
		});
	var h = g.append("path") //path0
		.attr("d", path(0));
	var f = g.append("path") //path1
		.attr("d", path(1));
	var e = g.append("path") //path2
		.attr("d", path(2));
	g.attr("fill", function(i) {
			return i.source.color = color(i.source.name.replace(/ .*/, ""))
		}).attr("opacity", lowopacity).on("mouseover", function(d) {
			d3.select(this).style('opacity', highopacity);
		}).on("mouseout", function(d) {
			d3.select(this).style('opacity', lowopacity);
		}).append("title") //link
		.text(function(i) {
			return i.source.name + " → " + i.target.name + "\n" + format2(i.value)
		});
	var c = svg.append("g") //node
		.selectAll(".node").data(d.nodes).enter().append("g").attr("class", "node").attr("transform", function(i) {
			return "translate(" + i.x + "," + i.y + ")"
		}).call(d3.behavior.drag().origin(function(i) {
			return i
		}).on("dragstart", function() {
			this.parentNode.appendChild(this)
		}).on("drag", b));
	c.append("rect") //node
		.attr("height", function(i) {
			return i.dy
		}).attr("width", sankey.nodeWidth()).style("fill", function(i) {
			return i.color = color(i.name.replace(/ .*/, ""))
		}).style("stroke", function(i) {
			return d3.rgb(i.color).darker(2)
		}).on("mouseover", function(d) {
			svg.selectAll(".link").filter(function(l) {
				return l.source == d || l.target == d;
			}).transition().style('opacity', highopacity);
		}).on("mouseout", function(d) {
			svg.selectAll(".link").filter(function(l) {
				return l.source == d || l.target == d;
			}).transition().style('opacity', lowopacity);
		}).on("dblclick", function(d) {
			svg.selectAll(".link").filter(function(l) {
				return l.target == d;
			}).attr("display", function() {
				if (d3.select(this).attr("display") == "none") return "inline"
				else return "none"
			});
		}).append("title").text(function(i) {
			return i.name + "\n" + format2(i.value)
			
		});
	c.append("text") //node
		.attr("x", -6).attr("y", function(i) {
			return i.dy / 2
		}).attr("dy", ".35em").attr("text-anchor", "end").attr("transform", null).text(function(i) {
			return i.name
		}).filter(function(i) {
			return i.x < width / 2
		}).attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start")
	c.append("text") //node
		.attr("x", function(i) {return -i.dy / 2})
		.attr("y", function(i) {return i.dx / 2 + 6})
		.attr("transform", "rotate(270)").attr("text-anchor", "middle").text(function(i) {
			if (i.dy>50){
				return format(i.value);
			}
		}).attr("fill","white").attr("stroke","black");
		

	function b(i) { //dragmove
		if (document.getElementById("ymove").checked) {
			if (document.getElementById("xmove").checked) {
				d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
			} else {
				d3.select(this).attr("transform", "translate(" + i.x + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
			}
		} else {
			if (document.getElementById("xmove").checked) {
				d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + i.y + ")")
			}
		}
		sankey.relayout();
		f.attr("d", path(1));
		h.attr("d", path(0));
		e.attr("d", path(2))
	};
};
draw();