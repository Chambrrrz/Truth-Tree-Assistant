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
