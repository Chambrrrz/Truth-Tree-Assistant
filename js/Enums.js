/*
 * 'Enums' used by the parser and pretty printer.
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
