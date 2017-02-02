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