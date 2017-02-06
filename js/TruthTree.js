  var Parse = require("./Parser.js"),
      Write = require("./PrettyPrinter.js"),
      Symbol = require("./Enums.js").Symbol
      NodeType = require("./Enums.js").NodeType;



  /*
   * Provides us with functionality for munipulating, and visualizing a truthtree.
   */
  function TruthTree(margin, treeData) {
    // margin null, set default margin,
    // treeData null, set default? or throw error?


    //TODO: Need to center the root in the svg element.
    var width = "100%", height = 300;//

    this.nodeCount = 0;
    this.clickedNode = null;
    this.selectedtext = "";

    this.tree = d3.layout.tree().size([height, width]);

    //Can probably remove some of these parameters we are setting.    
    this.svg = d3.select('#treeContainer').append('svg')
      .attr("width", width)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.root = treeData;
    this.root.x0 = height / 2;
    this.root.y0 = 0;

    this._update();
  }


/*
 * Constructor for a new TruthTree.
 */
TruthTree.prototype.constructor = TruthTree;


/*
 *  Adds a new child node to the provided parent node, or the selectedNode if no parentNode is provided.
 */
TruthTree.prototype.addChild = function(newNode, parentNode) {

  var p = parentNode || this.clickedNode;  // the node we clicked on.
  
  if(p.children) {
    p.children.push(newNode);
  } else {
    p.children = [newNode];
  }
}


/*
 *  Returns all leaf nodes of the TruthTree.
 */
TruthTree.prototype.getLeaves = function() {

  var layout = this.getLayout();
  return layout.nodes.filter((n) => { return !n.children || n.children.length === 0; });
}


/*
 *  Returns an object containing the nodes and links for the tree.
 */
TruthTree.prototype.getLayout = function() {
  var nodes = this.tree.nodes(this.root).reverse();

  return {
    nodes : nodes,
    links : this.tree.links(nodes)
  }
}



TruthTree.prototype.updatedSelectedtext = function(text) {
    this.selectedText = text;
    console.log(this.selectedText);

}


/*
 *  Updates the subtree 'source' node. If 'source' is empty, updates 'root'.
 */
TruthTree.prototype._update = function(source) {
  
  // if no source is provided update the root.
  source = source ? source : this.root;

// Right now the x and y are swapped when doing some of the calculations since this was adapted from d3 tress that grow horizontally.
// There is probably a way to configure the layout for the tree diagram.

  var layout = this.getLayout();

      function getMaxDepth() {
        var depth = 0;

        layout.nodes.forEach( (n) => {
          
          if (n.depth > depth) {
            depth = n.depth;
          }
        
        });

        return depth;
      }

  var svgHeight = 600;

  //resize  the svg element to cope with more elements;
  var svgUpdate = d3.select("svg").transition()
        .duration(500)
        .attr("height", () => {
            var maxDepth = getMaxDepth();

            return Math.max(svgHeight, maxDepth * 110); //TODO: Get the exact height from the depth. The whole sizing of the svg and Truth tree needs to be normalized and passed in as an argument. 
        });

  // Normalize for fixed-depth.
  layout.nodes.forEach(function(d) { d.y = d.depth * 100; });

   // Declare the nodes.
  var node = this.svg.selectAll("g.node")
   .data(layout.nodes, (d) => { return d.id || (d.id = ++this.nodeCount); });

  // Enter the nodes.
  var nodeEnter = node.enter().append("g")
  .attr("class", "node")
  .attr("transform", function(d) { 
    return "translate(" + source.x0 + "," + (source.y0 + 20) + ")"; })
  .on("click", (d) => {

        if (d.clicked) {
          d.clicked = false;
          this.updatedSelectedtext("");
        } else {
          d.clicked = true;
          
          if(this.clickedNode)
            this.clickedNode.clicked = false;
        }

        this.clickedNode = this.clickedNode === d ? null : d;

        this._update(d);
    })

  // padding for text inside a rect.
  var padding = 20;

  // The tree is aware of the structure of the data. 
  nodeEnter.append("rect")
    .style("fill", "#fff")
    .style("fill-opacity", 0)
    .style("stroke-opacity",0);

  //Adds a text line for each prop.
  nodeEnter.selectAll("text")
      .data(d => d.props)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .text(function(d) { return d})
      .attr("dy", function(d, i) { return (2 * i) + "em"})
      .style("fill-opacity", 0)
      .on("click", (d) =>{
        this.updatedSelectedtext(d);
      });

  // Transitions nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(1000)
      .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")";
      });

  nodeUpdate.select('rect')
    .attr("x", (d)  => {return -1 * ((this._getRectWidth(d.props) + padding) / 2); })
    .attr("y", -15)
    .attr("width", (d) => {return this._getRectWidth(d.props) + padding; })
    .attr("height", function(d) { return (1.5 * d.props.length) + "em"; })
    .style("fill-opacity", 1)
    .style("stroke-opacity", 1)
    .style("stroke", (t) => {
        var color;

        if(!t.closed) {
          color = t.clicked ? "green" : "steelblue";
        } else {
          color  = "red";
        }

        return color;
    });

  nodeUpdate.selectAll('text')
    .style('fill-opacity', 1)
    .style('text-decoration', function(d) {
      var x = 2;
    })

  var nodeExit = node.exit().transition()
    .duration(1000)
    .attr("transform", function(d) { 
        return "translate(" + source.x + "," + (source.y + 20) + ")";
    })
    .remove();

  nodeExit.select('rect')
    .style("fill-opacity", 0)
    .style("stroke-opacity", 0);

  nodeExit.select("text")
    .style("fill-opacity", 0);

  // update the links
  var link = this.svg.selectAll("path.link")
    .data(layout.links, function(d) { return d.target.id; });


      // Generates straight line connections between nodes.
      function straightLines(d) {
          var sx = d.source.x,
              sy = d.source.y,
              tx = d.target.x,
              ty = d.target.y;

          return "M" + sx + " " + sy + "V" + (ty - 40) + "H" + tx + "V" +ty; 
       }


  // Enter the links at parent's previous position.
  link.enter().insert("path", "g")
   .attr("class", "link")
   .style("stroke-opacity", 0)
   .attr("d", function(d) {
      var o = { x : source.x0, y : source.y0 + 20 };
      return straightLines({ source: o, target: o });
   });

   //Transition links
   link.transition()
      .duration(1000)
      .attr("d", straightLines)
      .style("stroke-opacity", 1)

   link.exit().transition()
      .duration(1000)
      .style("stroke-opacity", 0)
      .attr("d", function(d) {
        var o = { x : source.x, y : source.y + 20 };
        return straightLines({ source : o, target : o });
      })
      .remove();

  layout.nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}


/*
 *  Takes an array and outputs the minimal width of the rect to fit all the text.
 */
TruthTree.prototype._getRectWidth = function(textArray) {
      var w = 0,
        font = '12px arial';

      for(var i = 0; i < textArray.length; i++) {
        var obj = $('<span>' + textArray[i] + '</span>')
                .css({'font' : font, 'float': 'left', 'white-space' : 'nowrap'})
                .appendTo($('body'));

        var objWidth = obj.width();
        if (objWidth > w)
          w = objWidth;

        obj.remove();
      }

    return w;
  }



module.exports = TruthTree