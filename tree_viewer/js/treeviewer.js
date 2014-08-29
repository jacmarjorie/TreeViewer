// Copyright (c) Harms Lab
// University of Oregon

// Authors: Zach Sailer

var TreeViewer = function (selector, data) {
    // TreeViewer class creates a phylogenetic tree viewer 
    var that = this;
    this.selector = selector
    this.data = data
    this.width = parseInt($("#main_page").css("width"));
    this.height = 700;
    this.cluster = d3.layout.cluster()
                                .size([this.height, this.width-200]);
                                
    this.diagonal = d3.svg.diagonal()
        .projection(function(d) { 
            return [d.y, d.x]; });

    // Create an SVG canvas for vizualization
    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
            .attr("transform", "translate(40,0)");

    if (data == null) {
    } else {
        this.data = data
    };
    
};


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


TreeViewer.prototype.create_nodes = function(nodes) { 
    this.nodes 

};


TreeViewer.prototype.create_links = function(nodes) {
    // use D3 cluster links to create path links and give them unique IDs
    this.links = this.cluster.links(nodes);
    for (i = 0; i < this.links.length; i++) {
        this.links[i].id = this.links[i].source.name+", "+this.links[i].target.name;
    };
    return this.links
};


TreeViewer.prototype.init_tree = function(root) {
    // Initializes a d3 tree.
    console.log(root)
    this.nodes = this.cluster.nodes(root);
    this.links = this.create_links(this.nodes);
    
    
    this.link = this.svg.selectAll(".link")
                    .data(this.links, function(d) { return d.id; })
                    .enter().append("path")
                        .attr("class", "link")
                        .attr("d", this.diagonal);


    this.node = this.svg.selectAll(".node")
                    .data(this.nodes, function(d) { return d.name; })
                    .enter().append("g")
                            .attr("class", "node")
                            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

    
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


TreeViewer.prototype.update_tree = function(root) {
    // build new cluster/dendrogram from updated data
    this.nodes = this.cluster.nodes(root),
    this.links = this.create_links(this.nodes);
      
    // Attach this new data to links and nodes.  
    this.link = this.svg.selectAll(".link")
                .data(this.links, function(d) { return d.id; });
                
    this.node = this.svg.selectAll(".node")
                .data(this.nodes, function(d) { return d.name; });
        
    // Update the links and nodes that still exists    
    this.link.transition()
        .duration(2000)
        .attr("class", "link")
        .attr("d", this.diagonal);
                                
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

    this.node_representation(this.node);
};

/*
var tree_viewer = new TreeViewer(".zach", null);
var test = new Data();

var zach = this.Newick.parse(
    "(Edentata:55, (((Orycteropus:12, Trichechus:43):1, (Procavia:29, (Elephas:18, Loxodonta:5):55):10):15, (((Chiroptera:27, (Tupaia:43, ((Talpa:24, (Suncus:24, Erinaceus:58):6):4, (Manis:5, ((Felis:13, Leo:7):32, ((Canis:37, Ursidae:12):4, ((Phocidae:19, Zalophus:17):7, (Procyonidae:12, Mustelidae:22):9):5):17):13):3):10):6):8, (((Lemuridae:46, (Galago:16, Nycticebus:27):10):8, (Tarsius:15, ((Cebus:10, (Atelinae:5, (Aotus:6, Callithrix:9):3):3):18, ((Hylobates:6, (Pongo:1, (Gorilla:2, (Homo:22, Pan:1):2):6):2):5, (Presbytis:1, (Cercopithecus:1, (Erythrocebus:0, ('Macaca fascicularis':2, ('Macaca mulatta':5, 'Macaca fuscata':0):1, (Theropithecus:2, Papio:4):15):2):1):8):6):9):22):10):13, ((Ochotona:7, Oryctolagus:54):4, (Caviomorpha:107, (Spermophilus:29, (Spalax:23, ((Rattus:71, Mus:19):15, (Ondatra:27, Mesocricetus:32):27):20):8):12):15):11):9):12, ((Sus:50, ((Lama:10, Camelus:24):31, (Hippopotamus:31, (((Ovis:9, Capra:8):19, ((Antilocapra:13, Giraffa:14):7, (Cervus:8, Alces:9):11):2):9, (Tragelaphinae:6, ('Bos grunniens':6, (Bison:5, 'Bos taurus':15):7):11):6):47):10):19):18, ((('Equus (Asinus)':6, 'Equus caballus':31):24, (Tapirus:19, Rhinocerotidae:23):11):22, ((Phocoena:4, Tursiops:17):5, (Balaenoptera:36, Eschrichtius:2):8):29):12):12):16):55);"
)
tree_viewer.init_tree(zach);
//tree_viewer.update_tree(test.data2);
//tree_viewer.update_tree(test.data3);

*/