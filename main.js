var Parser = require("./js/Parser.js"),
    Write = require("./js/PrettyPrinter.js"),
    NodeType = require("./js/Enums.js").NodeType,
    Symbol = require("./js/Enums.js").Symbol,
    TruthTree = require("./js/Tree.js");


var tree = new TruthTree({top:20, left:200, right: 0, bottom: 20}, {props : ["p -> q", "~(p -> q)"]});

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



$(".control").on("click",function(e) {
  var control = $(e.currentTarget).closest("li"),
      rule = generateRule(control);

  tree.applyRule(rule);

});