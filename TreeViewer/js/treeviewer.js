// Copyright (c) Harms Lab
// University of Oregon
// TreeViewer Interactive Edition
// Authors: Zach Sailer
//          Jaclyn Smith

var TreeViewer = function (selector, data) {
    // version 2 of the phylogenetic tree viewer - interactive
    // creates the basic structure for a viewer below load box
    var that = this;
    this.selector = selector;
    this.width = parseInt($(this.selector).css("width"));
    this.height = 700;
    this.charge = -300;
    this.link_distance = 60;
    this.gravity = .1
    this.tree_viewer = null;
    this.representation = "dynamic";
    this.data = data || null;

    // pros and cons of cluster vs tree layouts
    this.cluster = d3.layout.cluster()
        .size([this.height, this.width-200]);

    this.tree = d3.layout.tree()
    	.size([this.height, this.width-200]);

    this.diagonal = d3.svg.diagonal()
        .projection(function(d) { 
            return [d.y, d.x]; });

    this.force = d3.layout.force()
        .charge(this.charge)
        .linkDistance(this.link_distance)
        .gravity(this.gravity)
        .size([this.height, this.width-200]);

    // create SVG canvas for vizualization 
    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform", "translate(40,0)");

    if (this.data != null) {
        console.log(this.data) 
        if (this.representation == "dynamic") {
            this.tree_viewer = this.dynamic_tree(this.data);
        } else {
           this.tree_viewer = this.static_tree(this.data);
        };
    };
}

TreeViewer.prototype.create_links = function(nodes) {
    // use D3 cluster links to create path links and give them unique IDs
    this.links = this.cluster.links(nodes);
    for (i = 0; i < this.links.length; i++) {
        this.links[i].id = this.links[i].source.name+", "+this.links[i].target.name;
    };
    return this.links
};

TreeViewer.prototype.static_tree = function(root) {
    // build new cluster/dendrogram from updated data
    this.nodes = this.cluster.nodes(root),
    this.links = this.create_links(this.nodes);

    this.nodes.forEach(function(node){
    	console.log("static")
    	console.log("X " + node.x + ", Y " + node.y)
    });
      
    // Attach this new data to links and nodes.  
    this.link = this.svg.selectAll(".link")
                .data(this.links, function(d) { return d.id; });
                
    this.node = this.svg.selectAll(".node")
                .data(this.nodes, function(d) { return d.name; });
        
    // Update the links and nodes that still exists    
    this.link.transition()
        .duration(2000)
        .attr("class", "link")
        //.attr("d", this.diagonal);
                                
    this.node.transition()
        .duration(2000)
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
                               
    // Exit all nodes and links that aren't in new data.
    this.link.exit().transition().remove();
                        
    this.node.exit().transition().remove();

    // Enter any node or links that weren't available before
    this.link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", this.diagonal);

    this.node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });


   this.node.append("text")
            .attr("dx", function(d) { return d.children ? 6 : 6; })
            .attr("dy", 0)
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            .text(function(d) { 
                if (d.name.substring(0,5) == "split") {
                    
                } else {
                    return d.name;
                }
            });
            
    this.node_representation(this.node);
};


TreeViewer.prototype.initial_positions = function(nodes, y_pos, scale_factor){

	function get_branch_len(branch_len, y_cor){
		var hyp = Math.pow(branch_len, 2)
		var y = Math.pow(y_cor, 2)
		var x_cor = Math.sqrt(Math.abs(hyp - y))
		return x_cor;
	}

	function positioning(node, x_pos, y_pos, orientation){
		//orientation:
		// +1 down
		// -1 up
		// 0 horizontal (right)
		node.px = node.parent.px + x_pos;
	    node.x = node.parent.x + x_pos;
	    node.py = node.parent.py + (orientation)*y_pos;
	  	node.y = node.parent.y + (orientation)*y_pos;
	}

    nodes.forEach(function(node){
    	//add checks here for branch length scaling
    	if (node.depth != 0){

    		// calc branch length with scale factor and fixed y movement
	    	var x_pos = get_branch_len(node.size*scale_factor, y_pos)

	    	if (node.parent.children.length != 3){

		    	if (node.parent.children.indexOf(node) == 0){
		  			positioning(node, x_pos, y_pos, 1);
		    	}else{
		  			positioning(node, x_pos, y_pos, -1)
		    	}
		   	// only handle polytomies of size 3
	    	}else if (node.parent.children.length == 3){

	    		if (node.parent.children.indexOf(node) == 0){
					positioning(node, x_pos, y_pos, 1);
		  		}else if (node.parent.children.indexOf(node) == 1){
		  			positioning(node, node.size*scale_factor, y_pos, 0)
		    	}else{
					positioning(node, x_pos, y_pos, -1)
		    	}
		    }
	    }
    	node.fixed =true;
    });

}

TreeViewer.prototype.dynamic_tree = function(root) {
    
    // root contains data

    var nodes = this.cluster.nodes(root);
    var links = this.create_links(nodes);

    // initial root position

	root.px = root.x = 0;
	root.py = root.y = 280;
	
	// nodes, y pos increment, and scale factor
	// make adjustable depending on tree size
	this.initial_positions(nodes, 100, 100);

    this.force
        .nodes(nodes)
        .links(links)
        .start();

    var force = this.force;

    var drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    var link = this.svg.selectAll(".link")
        .data(this.force.links())
        .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("d", this.diagonal);

    var node = this.svg.selectAll(".node")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 6)
        .style("fill", function(d){ if (d.depth == 0) return '#990033'})
        .attr("fixed", function(d) { if (d.name.substring(0,5) == "split") return d.fixed = true; else return false; })
        .attr("class", function(d) { return "node " + d.type; })
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
        .call(drag);

    var text = this.svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("dx", 8)
        .attr("dy", ".31em")
        .text(function(d) { 
          if (d.name.substring(0,5) == "split") {
          } else {
              return d.name;
          }
      });

    force.on("tick", tick);

    // in scope functions for drag functionality

    function tick() {
        link.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
        });

        node.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
        tick(); 
    }

    function dragend(d, i) {
        d.fixed = true; 
        tick();
        force.resume();
    }

    function get_child_l(parent_node){
    	return this.parent_node.children[0];
    }

    function get_child_r(parent_node){
    	return this.parent_node.children[1];
    }

    this.force = force;
    this.drag = drag;
    this.nodes = nodes;
    this.links = links;
    this.link = link;
    this.node = node;
    this.text = text;

}

// unused functions to use

TreeViewer.prototype.create_clade = function(node) {
    // Build a polygon triangle that represents a clade
    var clade = new Object();
    
    clade.area = node.size;//node.size
    clade.x = 0;//node.x;
    clade.y = 0;//node.y;
    clade.width = 100;
    clade.height = clade.area/(clade.width);
    clade.v1 = String([clade.x,clade.y]);
    clade.v2 = String([clade.x+clade.width, clade.y + clade.height/2]);
    clade.v3 = String([clade.x+clade.width, clade.y - clade.height/2]);
    clade.points = clade.v1 + " " + clade.v2 + " " + clade.v3
    
    return clade;
};

TreeViewer.prototype.node_representation = function(node_selector) {
    // Node representations
    
    // Dots represent nodes
    node_selector.append("circle")
        .attr("r", 3.5);
    
    // If the node has a size associated with it, a clade will appear
    node_selector.append("polygon").attr("points", function(d) {
        if ('size' in d) {
            
            var area = d.size;//node.size
            var width = 50;
            var height = area/(width);
            var v1 = "0,0";
            var v2 = String([width, height/2]);
            var v3 = String([width, -height/2]);
            var points = v1 + " " + v2 + " " + v3;
            return points;
        } else {
            return "0,0 0,0 0,0";
        };
    });
};

