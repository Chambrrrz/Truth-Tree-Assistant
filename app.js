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


module.exports = {
	NodeType : NODETYPE,
	Symbol : SYMBOL
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
},{"./Enums.js":1,"./Parser.js":2,"./PrettyPrinter.js":3}],5:[function(require,module,exports){
var Parser = require("./js/Parser.js"),
    Write = require("./js/PrettyPrinter.js"),
    NodeType = require("./js/Enums.js").NodeType,
    Symbol = require("./js/Enums.js").Symbol,
    TruthTree = require("./js/TruthTree.js");

// TODO (IMPORTANT) : Need to write a markdown file for the github page.

// TODO: Need to allow for inputting the props to start.

  // - Easy -> Wrap main.js up in a big file and export it. browserify can expose the module to index.html so people can put their own list in here.
  // - Medium -> Divs + JQUERY + some way of specifying lists (comma's arn't used by the prop calculus, so that should be fine.)

var startingNode = {
  props : ["p -> q", "~(p -> q)"]
}

var tree = new TruthTree({top:20, left:200, right: 0, bottom: 20}, startingNode);

function generateRule(clickedControl){

    var newRule = {ruleType : "", not: false }

    if (clickedControl.hasClass("or")) {
        newRule.ruleType = "OR";
    } else if (clickedControl.hasClass("notAnd")) {
        newRule.ruleType = "AND"
        newRule.not = true;
    } else if (clickedControl.hasClass("imp")) {
        newRule.ruleType = "IMP";
    } else if (clickedControl.hasClass("biimp")) {
        newRule.ruleType = "BIIMP";
    } else if (clickedControl.hasClass("notBiimp")) {
        newRule.ruleType = "BIIMP";
        newRule.not = true;
    } else if (clickedControl.hasClass("doubleNegation")) {
        newRule.ruleType = "NOT"
        newRule.not = true;
    } else if (clickedControl.hasClass("and")) {
        newRule.RuleType = "AND";
    } else if (clickedControl.hasClass("notImp")) {
        newRule.RuleType = "IMP"
        newRule.not = true;
    } else if (clickedControl.hasClass("notOr")) {
        newRule.ruleType = "OR"
        newRule.not = true;
    } else{
        throw "Unfamilliar rule type."
    } 

    return newRule;
} 


//TODO : LET US CLOSE BRANCHES!! 

$(".control").on("click",function(e) {
  var control = $(e.currentTarget).closest("li"),
      rule = generateRule(control);

  tree.applyRule(rule);

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
},{"./js/Enums.js":1,"./js/Parser.js":2,"./js/PrettyPrinter.js":3,"./js/TruthTree.js":4}]},{},[5]);
