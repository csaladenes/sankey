/*This software is released under the MIT License

MIT License 2014 Denes Csala http://www.csaladen.es

The following software uses the javascript frameworks below,
all of which are distributed under the MIT or GNU/GPL license:
D3.js http://d3js.org/  data-oriented javascript framework. 
	- Sankey plugin http://bost.ocks.org/mike/sankey/ for D3.js (modified) by Mike Bostock, 
	  which is based on the initial version http://tamc.github.io/Sankey/ by Thomas Counsell. 
	  I have incorporated the ability to render Sankey cycles, as pioneered by https://github.com/cfergus
	- Dragdealer.js href="http://skidding.github.io/dragdealer/ by Ovidiu Chereches
*/

//<!--DATA INIT-->

var data={"nodes": [], "links": []}

//<!--DATA ENTRY-->

nodesform=d3.select("#nodes-form");
function addnode() {
	var a=nodesform.append("div");
	a.text(nodesform[0][0].children.length-1+' ');
	a.append("input").attr("value",'{"name":"New Node"}');
}
function removenode() {
	nodesform[0][0].children[nodesform[0][0].children.length-1].remove("div")
}
linksform=d3.select("#links-form");
function addlink() {
	linksform.append("div").append("input").attr("value",'{"source":0,"target":1,"value":0.52}');
}
function removelink() {
	linksform[0][0].children[linksform[0][0].children.length-1].remove("div")
}
function draw() {
	
	data={"nodes": [], "links": []}
	
	for (i = 0; i < nodesform[0][0].children.length; i++) {
		data.nodes.push(JSON.parse(nodesform[0][0].children[i].children[0].value));
	}
	for (i = 0; i < linksform[0][0].children.length; i++) {
		data.links.push(JSON.parse(linksform[0][0].children[i].children[0].value));
	}
	change(data);
}
function save(){
	d3.select('#save').style('z-index',100).transition().style('opacity',0.9);
	st='{"sankey":{"nodes":['
	for (i = 0; i < nodesform[0][0].children.length; i++) {
		st=st+nodesform[0][0].children[i].children[0].value+',';
	}
	st=st.substring(0, st.length - 1)+'],"links":[';
	for (i = 0; i < linksform[0][0].children.length; i++) {
		st=st+linksform[0][0].children[i].children[0].value+',';
	}
	st = st.substring(0, st.length - 1)+']},"params":['+densityslider.value.current[0]+','+opacityslider.value.current[0]+','+labelformat+','+labeltextformat+']';
	if (document.getElementById("fixedlayout").checked){
		var coords=[]
		sankey.nodes().forEach(function(d){
			coords.push([d.x,d.y])
		})
		st=st+',"fixedlayout":'+JSON.stringify(coords);
	} 
	st=st+'}';
	d3.select('#savetext').text(st);
}
function load(){
	d3.select('#load').style('z-index',100).transition().style('opacity',0.9);
}
function loadsubmit(){
	d3.select('#load').transition().style('opacity',0).style('z-index',-1);
	var rawtext=d3.select('#load')[0][0].children[1].value;
	if (rawtext!="") {
		//parse data
		var rawdata=JSON.parse(rawtext);
		if ("sankey" in rawdata) {
			var newdata=rawdata.sankey;
		}
		else {
			var newdata=rawdata;
		}
		var loadtext=JSON.stringify(newdata)
		//remove existing node entry boxes
		var n=nodesform[0][0].children.length;
		for (i = 0; i < n; i++) {
			nodesform[0][0].children[0].remove("div");
		}
		//remove existing link entry boxes
		var n=linksform[0][0].children.length;
		for (i = 0; i < n; i++) {
			linksform[0][0].children[0].remove("div");
		}
		//add new node entry boxes
		var newdata2=JSON.parse(loadtext.substring(loadtext.indexOf('"nodes":[')+8, loadtext.indexOf('"links":[')-1));
		for (i = 0; i < newdata2.length; i++) {
			var a=nodesform.append("div");
			a.text(nodesform[0][0].children.length-1+' ');
			a.append("input").attr("value",JSON.stringify(newdata2[i]));
		}
		//add new link entry boxes
		var newdata2=JSON.parse(loadtext.substring(loadtext.indexOf('"links":[')+8, loadtext.length - 1))
		for (i = 0; i < newdata2.length; i++) {
			linksform.append("div").append("input").attr("value",JSON.stringify(newdata2[i]));
		}
		//set parameters
		if ("fixedlayout" in rawdata) {
			fixedlayout=document.getElementById("ignorelayout").checked?[]:rawdata.fixedlayout;
		} else {
			fixedlayout=[];		
		}
		if ("params" in rawdata) {
			labelformat=rawdata.params[2];
			labeltextformat=rawdata.params[3];
			document.getElementById("vlabel").checked=(labelformat==0)?true:false;
			document.getElementById("tlabel").checked=(labeltextformat==0)?true:false;
			densityslider.setValue(rawdata.params[0]);
			opacityslider.setValue(rawdata.params[1]);
		}
		else { 
			change(newdata);
		}
	}
}

//<!--SANKEY DIAGRAM-->

var parallelrendering=false;
var sourcelinks=false;
var targetlinks=false;
var padding = 28;
var labelformat = 0;
var labeltextformat = 0;
var paddingmultiplier = 100;
var lowopacity = 0.3;
var highopacity = 0.7;
var fixedlayout=[];
var format2Number = d3.format(",.2f"),
    format1Number = d3.format(",.1f"),
	format3Number = d3.format(",.3f"),
	formatNumber = d3.format(",.0f"),
    format = function(a) {
        return formatNumber(a)
    },color = d3.scale.category20();
	linkformat= function(a) {
		if (d3.select("#ldec").node().value==0) return formatNumber(a);
		if (d3.select("#ldec").node().value==1) return format1Number(a);
		if (d3.select("#ldec").node().value==2) return format2Number(a);
		return format3Number(a);
	},
	nodeformat= function(a) {
		if (d3.select("#ndec").node().value==0) return formatNumber(a);
		if (d3.select("#ndec").node().value==1) return format1Number(a);
		if (d3.select("#ndec").node().value==2) return format2Number(a);
		return format3Number(a);
	};
	
d3.select("#ndec")
.on("change",draw);
d3.select("#ldec")
.on("change",draw);

d3.select("#chart").style("width", document.getElementById("chart").offsetWidth - sizecorrection)
d3.select("#titlebar").style("width", document.getElementById("titlebar").offsetWidth - sizecorrection)
var margin = {
        top: 70,
        right: 10,
        bottom: 30,
        left: 40
    },
    width = document.getElementById("chart").offsetWidth - margin.left - margin.right,
    height = document.getElementById("chart").offsetHeight - margin.bottom - 90;
var svg = d3.select("#chart").append("svg")
svg.append("rect").attr("x",0).attr("y",0).attr("width","100%").attr("height","100%").attr("fill","white")
svg=svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//set svg background color via rectangle trick
d3.select("#chart").select("svg")

var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
var path = sankey.reversibleLink();
var change = function() {};

change = function(d) {

	labelformat = document.getElementById("vlabel").checked?0:1;
	labeltextformat = document.getElementById("tlabel").checked?0:1;
		
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
			if (i.source.fill) return i.source.fill;
								else return i.source.color = color(i.source.name.replace(/ .*/, ""))
		}).attr("opacity", lowopacity).on("mouseover", function(d) {
			d3.select(this).style('opacity', highopacity);
		}).on("mouseout", function(d) {
			d3.select(this).style('opacity', lowopacity);
		}).append("title") //link
		.text(function(i) {
			return i.source.name + " → " + i.target.name + "\n" + linkformat(i.value)
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
			if (i.fill) return i.color = i.fill;
								else return i.color = color(i.name.replace(/ .*/, ""))
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
			return i.name + "\n" + nodeformat(i.value)
			
		});
	c.append("text") //node
		.attr("x", -6).attr("y", function(i) {
			return i.dy / 2
		}).attr("dy", ".35em").attr("text-anchor", "end").attr("font-size","16px")
		.text(function(i) {
		if (labeltextformat<1){
				return i.name
			} else {
				return "";
			}
		}).filter(function(i) {
			return i.x < width / 2
		}).attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start")
	c.append("text") //node
		.attr("x", function(i) {return -i.dy / 2})
		.attr("y", function(i) {return i.dx / 2 + 6})
		.attr("transform", "rotate(270)").attr("text-anchor", "middle").attr("font-size","16px").text(function(i) {
			if ((i.dy>50)&&(labelformat<1)){
				var nodelabel=nodeformat(i.value);
				if (targetlinks||sourcelinks) nodelabel=nodelabel+"  "
				if (targetlinks) nodelabel=nodelabel+" → "+(i.targetLinks.length);
				if (sourcelinks) nodelabel=nodelabel+"  "+(i.sourceLinks.length)+" → ";				
				return nodelabel;
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

//<!-- SAVE FUNCTION-->

d3.select("#pngdownloadwrapper")
.on("click",function(){
	seturl();
	setTimeout(function(){d3.select("#pngdownload").node().click();},500);
})

function seturl(){
exportInlineSVG(d3.select("#chart").select("svg").node(), function(data) {
	d3.select("#pngdownload").node().href=data;
});
}
