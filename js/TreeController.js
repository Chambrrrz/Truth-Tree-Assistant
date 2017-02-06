var TruthTree = require("./TruthTree.js"),
	Operation = require("./Enums.js").Operation,
	Parse = require("./Parser.js"),
	Write = require("./PrettyPrinter.js");


/*
 *  Constructor for a TreeController.
 */
function TreeController(log) {

	this.log = log;
	this.truthTree = null;
}
TreeController.prototype.constructor = TreeController;


TreeController.prototype.hasTree = function(){
	return this.truthTree !== null;
}


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

	// if the operation doesn't match the node type, inform the user they are applying an incorrect operation.
	if (operation !== Operation.CLOSE && operation !== ast.nodeType) {

		this.log("Incorrect (non-)branching rule.");
	} else {

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
	}

	/*  NOTE: 	
	 *  when applying a function like this, we need to pass in the reference for the truthTree.
	 * 	This is due to how js deals with "this" in anonymous functions.
	 * 	if instead we have 'this.truthTree' in all the operation functions, when op is called in the 
	 * 	anonymous function 'this' is pointing to the windows object, and not the object which owns the function.
	 */

	this.truthTree.getLeaves().forEach(n => {
		if (!n.closed){
			op(isNot, n, ast, this.truthTree);
		} else {
			if (operation === Operation.CLOSE)
				op(isNot, n, ast, this.truthTree);	
		}
	});
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