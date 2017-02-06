var Operation = require("./js/Enums.js").Operation,
    TruthTreeController = require("./js/TreeController.js"),
    TruthTree = require("./js/TruthTree.js");

var originalLog = window.console.log;
var debug = true;

window.console = {
    log : function (text){
        
        // we are setting a debug flag. So when we are in debug mode, we duplicate the console.log output in the #log div. When debug is false, console.log behaves as normal.
        // this is mainly so we can debug everything without having another global log.
        if (debug)
            log(text);
        
        originalLog(text);
    }
}

function log(text){
    $("#log > p").text(text);
}

var controller = new TruthTreeController(log);


// the truth tree we are going to setup.
function handleTruthTreeCreation() {

    // TODO: generate a new tree in the same svg element.
    if (controller.hasTree()){
        throw "tree already started." 
    }
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