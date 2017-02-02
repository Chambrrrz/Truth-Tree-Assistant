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


    //TODO: Need to center the root int he svg element.
    var width = "100%",
        height = 600 - margin.top - margin.bottom;

    this.nodeCount = 0;
    this.clickedNode = null;
    this.selectedtext = "";

    this.tree = d3.layout.tree().size([height, width]);

    //Can probably remove some of these parameters we are setting.    
    this.svg = d3.select('#treeContainer').append('svg')
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.root = treeData;
    this.root.x0 = height / 2;
    this.root.y0 = 0;

    this.clickNode = [];
    
    this.clickNode.push((d) => {

      // Onclick event for the nodes in the tree.
      // TODO : Was planning on hooking a bunch of events up to this, but I don't think we need this anymore, so it can be refactored away.
        if (d.clicked) {
          d.clicked = false;
        } else {
          d.clicked = true;
          
          if(this.clickedNode)
            this.clickedNode.clicked = false;
        }

        this.clickedNode = this.clickedNode === d ? null : d;

        this._update(d);
    })

    this._update(this.root);
  }


/*
 * Constructor for a new tree.
 */
TruthTree.prototype.constructor = TruthTree;


/*
 *  Adds a new child node to the provided parent node.
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
 *  Returns all leaf nodes of the truth tree.
 */
TruthTree.prototype.getLeaves = function() {
  var layout = this.getLayout();
  return layout.nodes.filter((n) => { return !n.children || n.children.length === 0; });
}


/*
 *  Apples the provided branching rule to the tree.
 */
TruthTree.prototype.applyRule = function(rule) {
  
    var apply = (doRule) => {
          
          //TODO: Don't think we need to parse selectedText as much as we are.
          var leaves = this.getLeaves(),
              ast = Parse(this.selectedText);

          leaves.filter(n => !n.closed || rule.ruleType === "CLOSE")
                .forEach(n => doRule(n, ast));
        }
  

      // nothing happens when you hit an atom.
  var ATOM = (n, ast) => {},
      
      // p -> q  ==> (~p, q)      |     ~(p -> q) ==>  p, ~q
      IMP = (n, ast) => {
            var p = Write(ast.children[0]),
                q = Write(ast.children[1]);
            
            if (rule.not) {
              //write p, q as a new node.
              this.addChild({
                 props : [ p, Symbol.NOT + q ] 
               }, n);
              
            } else {
              // write p
              this.addChild({
                props : [Symbol.NOT + p]
              }, n);

              // write q
              this.addChild({ 
                props : [q]
              }, n);  
            }
      },
      
      // p <-> q ==> ([p,q],[~p, ~q])    |  ~(p <-> q) ==> ([p, ~q], [~p, q])
      BIIMP = (n, ast) => {
              var p = Write(ast.children[0]),
                  q = Write(ast.children[1]);

              if (rule.not) {

                this.addChild({
                  props : [ p, Symbol.NOT + q]
                }, n);

                this.addChild({
                  props : [ Symbol.NOT + p, q ]
                }, n)

              } else {

                this.addChild({
                  props : [p, q]
                }, n);

                this.addChild({
                  props : [Symbol.NOT + p, Symbol.NOT + q]
                }, n);
              }
      },

      // p & q ==> p, q   |   ~(p & q) ==> (~p, ~q)
      AND = (n, ast) => {
            var p = Write(ast.children[0]),
                q = Write(ast.children[1]);

            if (rule.not) {

                this.addChild({
                  props : [Symbol.NOT + p]
                }, n);

                this.addChild({
                  props : [Symbol.NOT + q]
                }, n);

            } else {

              this.addChild({
                props : [p, q]
              }, n);

            }
      },

      // ~BIIMP
      XOR = (n, ast) => { 
            not = true;
            BIIMP(n, ast);
      },

      // if we hit this, we have a double negation.
      // ~~p ==> p
      NOT = (n, ast) => {
            var p = Write(ast.children[0]);

            this.addChild({
              props : [ p ]
            }, n);
      },

      // p v q ==> (p,q)  |  ~(p v q) ==> ~p, ~q  
      OR = (n, ast) => {
            var p = Write(ast.children[0]),
                q = Write(ast.children[1]);

            if (rule.not) {

              this.addChild({
                props : [Symbol.NOT + p, Symbol.NOT + q]
              }, n);


            } else {

              this.addChild({
                props : [p]
              }, n);

              this.addChild({
                props : [q]
              }, n);
            }
      },
      
      // Closes a branch of the tree.
      CLOSE = (n, ast) => {
        if (n.clicked) {
          if (n.closed) {
            n.closed = false;
          } else {
            n.closed = true;
          }
        }
      }
  

   
    switch(rule.ruleType) {
      case NodeType.ATOM : 
        apply(ATOM);
        break;

      case NodeType.IMP : 
        apply(IMP);
        break;

      case NodeType.ATOM : 
        apply(ATOM);
        break;

      case NodeType.IMP : 
        apply(IMP);
        break;

      case NodeType.BII : 
        apply(BII);
        break;

      case NodeType.AND : 
        apply(AND);
        break;

      case NodeType.XOR : 
        apply(XOR);
        break;

      case NodeType.NOT : 
        apply(NOT);
        break;

      case NodeType.OR : 
        apply(OR);
         break;
                      // Make a new Enum ? RULETYPE
      case "CLOSE" :
        apply(CLOSE);
        break;

      default :
          break;

    }

    //update the view.
    this._update(this.root);
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


/*
 *  Updates the tree diagram.
 */
TruthTree.prototype._update = function(source) {

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
  .on("click", (d, i, g) => {
    if (this.clickNode.length > 0)
      for (var i = 0; i < this.clickNode.length; i++) {
        this.clickNode[i](d);
      }
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
        this.selectedText = d;
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
    .style('fill-opacity', 1);

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

  TruthTree.prototype.delete = function() {
    d3.selectAll('g').remove();
}


module.exports = TruthTree