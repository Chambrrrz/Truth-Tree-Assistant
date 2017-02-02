var Parser = require("./js/Parser.js"),
    Write = require("./js/PrettyPrinter.js"),
    NodeType = require("./js/Enums.js").NodeType,
    Symbol = require("./js/Enums.js").Symbol,
    TruthTree = require("./js/TruthTree.js");

// TODO (IMPORTANT) : Need to write a markdown file for the github page.


// sets some margins for the tree setup to consider. Not too sure we need this.
var treeSetup = {
      top : 20,
      left : 200,
      right: 0,
      bottom: 0
};

// the truth tree we are going to setup.
var tree = null;

function handleTruthTreeCreation() {

    if (tree) throw "We have already started a truth tree."
    
    var rootNode = { 

      props : $(".propList").text().split(",")

    }

    tree = new TruthTree(treeSetup, rootNode);

}

function handleRuleApplication(currentTarget) {

      var control = $(currentTarget).closest("li"),
      rule = generateRule(control);

      tree.applyRule(rule);
}



function generateRule(clickedControl) {

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