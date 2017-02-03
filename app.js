(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * 'Enums' used throughout the project.
 *
 */

/*
 * Different Types of Nodes in the AST.
 */
const NODETYPE  = {
	ATOM		  	: "ATOM",
	IMP				: "IMP",
	BIIMP			: "BIIMP",
	AND				: "AND",
	XOR				: "XOR",
	NOT				: "NOT",
 	OR				: "OR"
};


/*
 *  The symbols for the logic operations.
 */
const SYMBOL = {
	OR  : " v ",
	NOT : "~",
	AND : " & ",
	XOR : " # ",
	IMP : " -> ",
	BIIMP : " <-> "
};


/*
 * The Types of operations that can be applied to a TruthTree.
 */
const OPERATION = NODETYPE;
OPERATION.CLOSE = "CLOSE";


module.exports = {
	NodeType : NODETYPE,
	Symbol	: SYMBOL,
	Operation : OPERATION
}

},{}],2:[function(require,module,exports){
var NODETYPE = require('./Enums.js').NodeType;


/*
 *	Parses the given sentence and returns the root node of the AST.
 *
 */
function Parse(text) {
	if (text === String.empty)
		throw "No input provided to parse";

	// Case doesn't matter.
	text = text.toLowerCase();

	var textIter = text[Symbol.iterator]();
	var next = textIter.next();

	//prevCh is used when we hit symbols which don't mean anything by themselves. Ex: '-' in <-> and ->
	var prevCh = "",
		result = {
			nodeType : "",
			children : []
		};

	// left is a flag that keeps track of which side of the operator we are on.
	var left = true;

	while(!next.done) {
		switch (next.value) {
			case " ":
				// If we hit a space, move on.
				break;

			case "(":
				// TODO: this could be handled a bit better by moving the iterator up in the scope.

				// When we hit a left parenthesis, get and parse the subexpression.
				next = textIter.next();
				
				var subexpression = ""; 
				var stack = ["("];

				while (stack.length > 0) {

					if (next.value === "(") {
						stack.push(next.value);
					}
					else if (next.value === ")") {
						stack.pop();
						
						if (stack.length === 0)
							continue;
					}

					subexpression += next.value;
					next = textIter.next();

				}

				//Add the AST of the subexpression to the children of the result;
				var newChild = Parse(subexpression);
				result.children.push(newChild);

				break;				

			case ")": 
				throw "Unbalanced parenthesis";
			
			case "v":
				result.nodeType = NODETYPE.OR;
				break;

			case "&":
				result.nodeType = NODETYPE.AND;
				break;

			case "#":
				result.nodeType = NODETYPE.XOR;
				break;

			case "-":

				// prevCH is either the empty string or "<" at this point, so we add '-' to it's value;		
				prevCh += next.value;
				break;

			case "<":

				// prevCh should be empty here.
				prevCh = next.value;
				break;

			case ">":

				if(prevCh === "-") {
					result.nodeType = NODETYPE.IMP;
				} else if (prevCh === "<-") {
					result.nodeType = NODETYPE.BIIMP;
				} else {
					throw "Invalid synmbol :" + prevCH;
				}

				prevCh = "";

				break;
			case "~":
				result.nodeType = NODETYPE.NOT;
				break;

			// Default case is when we hit an "atom" which is any lowercase letter except 'v'.
			default :

				var atom = {
					nodeType : NODETYPE.ATOM,
					label : next.value
				};

				result.children.push(atom);
		}
		
		next = textIter.next();
	}


	return OptimizeRoot(result);
}


/*
 *  Returns the first child node of the root which has a NodeType set.
 */
function OptimizeRoot(root) {

	while (root.nodeType === '') {
		root = root.children[0];
	}

	return root;
}



module.exports = Parse

/*

	TODO: We are not handling anyerrors here.
			- Mismatched '(' ')'
			- using v as a parameter
			- too many '-' for (BI)IMP
			- etc

*/


///// TESTING
/*
	TODO : Actually do some unit tests?

	var result = Parse("((p v q) & t)");
	console.log(result.children.length);
	var json = JSON.stringify(result);

	console.log(json);



var T = (text) => { return JSON.stringify(Parse(text)); };
var P = (testNum, text) => {
	console.log("Test " + testNum);
	console.log(text);
	console.log("");
};

var tests = [];
var addTest = (t) => { tests.push(T(t)); }

addTest("a v b");
addTest("~(a v b)");
addTest("a & b");
addTest("~(a & b)");
addTest("a -> b");
addTest("~(a -> b)");
addTest("a <-> b");
addTest("~(a <-> b)");
addTest("a # b");
addTest("~(a # b)")
addTest("~a");
addTest("~(a v b)");

for(var i = 1; i <= tests.length; i++) {
	P(i, tests[i - 1]);
}
*/
},{"./Enums.js":1}],3:[function(require,module,exports){
var Enums = require("./Enums.js");

var SYMBOL = Enums.Symbol;
var NodeType = Enums.NodeType;


/*
 *	Takes an ast and writes it as a string.
 */
function PrettyPrinter(ast) {
	var result = writeString(ast);

	// remove the outer parenthesis.
	result = result.substring(1, result.length - 1);

	return result;
}


/*
 *	Produces a propositional formula from an AST.
 */
function writeString(ast) {
	var result = "",
		nodeType = ast.nodeType;
		
		

	if (nodeType === NodeType.ATOM) {
		result += ast.label;
	} else {
		var logicSymbol = getSymbol(nodeType),
			left = ast.children[0],
			right = ast.children[1];
			
		result += "(" + writeString(left) + logicSymbol + writeString(right) + ")";
	}

	return result;
}

/*
 *  Gets the symbol associated to the given node type.
 */
function getSymbol(nodeType) {
	return eval("SYMBOL." + nodeType);
}


module.exports = PrettyPrinter;



},{"./Enums.js":1}],4:[function(require,module,exports){
var TruthTree = require("./TruthTree.js"),
	Operation = require("./Enums.js").Operation,
	Parse = require("./Parser.js"),
	Write = require("./PrettyPrinter.js");


/*
 *  Constructor for a TreeController.
 */
function TreeController() {

	this.truthTree = null
}
TreeController.prototype.constructor = TreeController;


/*
 * Generates a new TruthTree from the provided display options and tree data.
 */
TreeController.prototype.newTree = function(options, treeData) {
	
	this.truthTree = new TruthTree(options, treeData);
}


/*
 *  Applies the operation to the current TruthTree.
 */
TreeController.prototype.apply = function(operation, isNot) {
	
	if (!this.truthTree) throw "No tree created.";

	var ast = Parse(this.truthTree.selectedText),
		leave = this.truthTree.getLeaves(),
		op = null;


	switch (operation){
		case Operation.ATOM:
			op = this._atomOp;
			break;

		case Operation.IMP:
			op = this._implicationOP;
			break;

		case Operation.BIIMP:
			op = this._biImplicationOP;
			break;

		case Operation.AND:
			op = this._andOP;
			break;

		case Operation.XOR:
			op = this._xOrOP;
			break;

		case Operation.NOT:
			op = this._notOP;
			break;

		case Operation.OR:
			op = this._orOP;
			break;

		case Operation.CLOSE:
			op = this._closeBranchOP;
			break;

		default:
			throw "Unrecognized operation.";
	}

	/*  NOTE: 	
	 *  when applying a function like this, we need to pass in the reference for the truthTree.
	 * 	This is due to how js deals with "this" in anonymous functions.
	 * 	if instead we have 'this.truthTree' in all the operation functions, when op is called in the 
	 * 	anonymous function 'this' is pointing to the windows object, and not the object which owns the function.
	 */

	this.truthTree.getLeaves().forEach(n => op(isNot, n, ast, this.truthTree));
	this.truthTree._update();
}



/*
 *  Atom operation.
 */
TreeController.prototype._atomOP = function(isNot, node, ast, truthTree) {
	
	// Do nothing when we hit an atom node.
}


/*
 * Implication Operation.
 */
TreeController.prototype._implicationOP = function(isNot, node, ast, truthTree) {
	
    var p = Write(ast.children[0]),
        q = Write(ast.children[1]);
    
    if (isNot) {
      	//write p, q as a new node.
      	truthTree.addChild({
        	props : [ p, Symbol.NOT + q ] 
		}, node);
      
    } else {
      	// write p
    	truthTree.addChild({
			props : [Symbol.NOT + p]
		}, node);

      	// write q
    	truthTree.addChild({ 
			props : [q]
      	}, node);  
    }
      
}


/*
 * BiImplication Operation.
 */
TreeController.prototype._biImplicationOP = function(isNot, node, ast, truthTree) {
	
	var p = Write(ast.children[0]),
	    q = Write(ast.children[1]);

	if (isNot) {

	    truthTree.addChild({
			props : [ p, Symbol.NOT + q]
	    }, node);

	    truthTree.addChild({
			props : [ Symbol.NOT + p, q ]
	    }, node)

	} else {

		truthTree.addChild({
	    	props : [p, q]
	    }, node);

	    truthTree.addChild({
	    	props : [Symbol.NOT + p, Symbol.NOT + q]
	    }, node);
	  }
}


/*
 * And Operation.
 */
TreeController.prototype._andOP = function(isNot, node, ast, truthTree) {

	var p = Write(ast.children[0]),
        q = Write(ast.children[1]);

    if (isNot) {

        truthTree.addChild({
         	props : [Symbol.NOT + p]
        }, node);

        truthTree.addChild({
          	props : [Symbol.NOT + q]
        }, node);

    } else {

    	truthTree.addChild({
        	props : [p, q]
      	}, node);

    }	
}


/*
 * XOR Operation.
 */
TreeController.prototype._xOrOP = function(isNot, node, ast, truthTree) {
	// We don't really need this rule.
	BIIMP(!isNot, node, ast, truthTree);
}


/*
 * Double Negation Operation.
 */
TreeController.prototype._notOP = function(isNot, node, ast, truthTree) {
	
	 var p = Write(ast.children[0]);

    truthTree.addChild({
    	props : [ p ]
    }, node);
}


/*
 * Or Operation.
 */
TreeController.prototype._orOP = function(isNot, node, ast, truthTree) {
	
	var p = Write(ast.children[0]),
    	q = Write(ast.children[1]);

    if (isNot) {

     	truthTree.addChild({
        	props : [Symbol.NOT + p, Symbol.NOT + q]
      	}, node);

    } else {

		truthTree.addChild({
	    	props : [p]
	   	}, node);

	    truthTree.addChild({
			props : [q]
	    }, node);
	}
}


/*
 * Branch Closing / Opening operation.
 */
TreeController.prototype._closeBranchOP = function(isNot, node, ast, truthTree) {
	if (node.clicked) {
		if (node.closed) {
			node.closed = false;
		} else {
			node.closed = true;
		}
	}
}


module.exports = TreeController;
},{"./Enums.js":1,"./Parser.js":2,"./PrettyPrinter.js":3,"./TruthTree.js":5}],5:[function(require,module,exports){
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
 *  Apples the provided branching rule to the tree.
 */
 /*
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
*/

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



module.exports = TruthTree
},{"./Enums.js":1,"./Parser.js":2,"./PrettyPrinter.js":3}],6:[function(require,module,exports){
var //Parser = require("./js/Parser.js"),
    //Write = require("./js/PrettyPrinter.js"),
    Operation = require("./js/Enums.js").Operation,
    TruthTreeController = require("./js/TreeController.js"),
    TruthTree = require("./js/TruthTree.js");



var controller = new TruthTreeController();



// the truth tree we are going to setup.
function handleTruthTreeCreation() {

    // sets some margins for the tree setup to consider. Not too sure we need this.
    var treeSetup = {
        top : 20,
        left : 200,
        right: 0,
        bottom: 0
    },
        
        rootNode = { 

        props : $(".propList").text().split(",")
    };

    controller.newTree(treeSetup, rootNode);

}




function handleRuleApplication(clickedControl) {

    var jqueryControl = $(clickedControl);
    var isNot = jqueryControl.hasClass("not"),
        operation = null;


    if (jqueryControl.hasClass("or")) {
        operation = Operation.OR
    } else if (jqueryControl.hasClass("and")) {
        operation = Operation.AND;
    } else if (jqueryControl.hasClass("imp")) {
        operation = Operation.IMP;
    } else if (jqueryControl.hasClass("biimp")) {
        operation = Operation.BIIMP;
    } else if (jqueryControl.hasClass("negation")) {
        operation = Operation.NOT;
    } else if (jqueryControl.hasClass("close")) {
        operation = Operation.CLOSE;
    } else {
        throw "Unable to determine type of requested operation";
    }

    controller.apply(operation, isNot);
} 



//TODO : LET US CLOSE BRANCHES!! 

$(".control").on("click",function(e) {

  // if we clicked the "Start Tree" button.
  if ($(e.currentTarget).closest(".treeStart").length > 0) {
    handleTruthTreeCreation();
  } else {
    handleRuleApplication(e.currentTarget);          
  }

});

/*

  TODO : Visual stuff

  We select text, but there is no indicator that it is selected right now.
    - Easy change -> throw a div in somewhere and populate it with the selctedText when it is clicked.
    - Hard change -> Come up with a reasonable visual that indicates the text has been selected. (coloring it looked like shit, and wasn't noticable. Maybe make the font bigger?
                     but then we would have to resize the rect element... TODO : see if we can also get the height of text when we get the width.)

  TODO : Strike through when the correct rule is applied. (css style on success)

  TODO : Need to build something that keeps track of the attempts to apply the wrong rules.
      - Easy change -> some divs (of course) for counters 
      - hard change? -> actually use a database.
            - See if back.io is up and running again. Free! 
                  - would need a data model for keep scores { Name, propList, FakeNews }



  Ambitious TODO : Write something completes the treef for you. (shouldn't be too hard if we seperate some functionality from TruthTree).

  Project TODO : Right now we have to run browserify on main.js to create app.js. We will eventually want to run a minimizer before (or after) browserify to reduce the size of app.js so it is a self contained project.
                  We might even be able to just put it all in a single html file which can be served. (index.html + app.js).

*/
},{"./js/Enums.js":1,"./js/TreeController.js":4,"./js/TruthTree.js":5}]},{},[6]);
