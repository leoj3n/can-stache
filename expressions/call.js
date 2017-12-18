var Scope = require('can-view-scope');
var Hashes = require('./hashes');
var SetIdentifier = require("../src/set-identifier");
var Observation = require('can-observation');
var canSymbol = require("can-symbol");
var sourceTextSymbol = canSymbol.for("can-stache.sourceText");
var SetterObservable = require("can-simple-observable/setter/setter");
var expressionHelpers = require("../src/expression-helpers");
var canReflect = require("can-reflect");
var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
var assign = require('can-assign');

// ### Call
// `new Call( new Lookup("method"), [new ScopeExpr("name")], {})`
// A call expression like `method(arg1, arg2)` that, by default,
// calls `method` with non compute values.
var Call = function(methodExpression, argExpressions){
	this.methodExpr = methodExpression;
	this.argExprs = argExpressions.map(expressionHelpers.convertToArgExpression);
};
Call.prototype.args = function(scope){
	var hashExprs = {};
	var args = [];
	for(var i = 0, len = this.argExprs.length; i < len; i++) {
		var arg = this.argExprs[i];
		if(arg.expr instanceof Hashes){
			assign(hashExprs, arg.expr.hashExprs);
		}
		var value = arg.value.apply(arg, arguments);
		args.push({
			// always do getValue unless compute is false
			call: !arg.modifiers || !arg.modifiers.compute,
			value: value
		});
	}
	return function(doNotWrapArguments){
		var finalArgs = [];
		if(!isEmptyObject(hashExprs)){
			finalArgs.hashExprs = hashExprs;
		}
		for(var i = 0, len = args.length; i < len; i++) {
			if (doNotWrapArguments) {
				finalArgs[i] = args[i].value;
			} else {
				finalArgs[i] = args[i].call ?
					canReflect.getValue( args[i].value ) :
					expressionHelpers.toCompute( args[i].value );
			}
		}
		return finalArgs;
	};
};

Call.prototype.value = function(scope, helperOptions){
	var method = this.methodExpr.value(scope, { proxyMethods: false });
	var initialValue = method && method.initialValue;
	var isHelper = initialValue && initialValue.isHelper;

	// if this was a helper function, mark it as a helper so that
	// mustache_core knows that it rendered something that should be displayed
	// this will skip the logic for handling things like {{#foo()}}...{{/foo}}
	this.isHelper = isHelper;

	var getArgs = this.args(scope);

	var computeFn = function(newVal){
		var func = canReflect.getValue( method );

		if(typeof func === "function") {
			var args = getArgs(func.isLiveBound);

			if (func.requiresOptionsArgument) {
				if(args.hashExprs && helperOptions.exprData){
					helperOptions.exprData.hashExprs = args.hashExprs;
				}
				args.push(helperOptions);
			}
			if(arguments.length) {
				args.unshift(new SetIdentifier(newVal));
			}

			return func.apply(method.root || scope.peek("this"), args);
		}
	};
	//!steal-remove-start
	Object.defineProperty(computeFn, "name", {
		value: "{{" + this.sourceText() + "}}"
	});
	//!steal-remove-end

	if (helperOptions && helperOptions.doNotWrapInObservation) {
		return computeFn();
	} else {
		var computeValue = new SetterObservable(computeFn, computeFn);
		Observation.temporarilyBind(computeValue);
		return computeValue;
	}
};
//!steal-remove-start
Call.prototype.sourceText = function(){
	var args = this.argExprs.map(function(arg){
		return arg.sourceText();
	});
	return this.methodExpr.sourceText()+"("+args.join(",")+")";
}
//!steal-remove-end
Call.prototype.closingTag = function() {
	//!steal-remove-start
	if(this.methodExpr[sourceTextSymbol]) {
		return this.methodExpr[sourceTextSymbol];
	}
	//!steal-remove-end
	return this.methodExpr.key;
};

module.exports = Call;
