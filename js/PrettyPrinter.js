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


