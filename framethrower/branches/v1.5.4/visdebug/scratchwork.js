var objs = [];

var makeInput = function(){
	var obj = makeIded();
	obj.getType = function(){
		return "inputPin";
	};
	return obj;
};

var makeOutput = function(){
	var obj = makeIded();
	obj.getType = function(){
		return "outputPin";
	};
	return obj;
};


var makeBox = function(){
	var obj = makeIded();
	obj.getType = function(){
		return "box";
	};
	return obj;
};


function makeComponent(inputInterfaces, outputInterfaces, instantiateProcessor) {
	var component = makeIded();
	component.getType = function(){
		return "component";
	};
	
	component.inputInterfaces = inputInterfaces;
	component.outputInterfaces = outputInterfaces;
	component.instantiateProcessor = instantiateProcessor;
	
	objs.push(component);
	//var applications = makeOhash(stringifyInputs);
	
	
	component.makeApply = function (inputs) {
		var box = makeBox();
		box.component = component;

		
		var myInputs = {};
		for(input in inputs){
			if(inputs.hasOwnProperty(input)){
				var a = makeInput();
				a.comingIn = inputs[input];
				a.name = input;
				objs.push(a);
				myInputs[input] = a;
				a.getInof = function(){
					return box;
				};
			}
		}
		

		box.getInputs = function(){
			return myInputs;
		};
		
		var outputs = {};
		for(outputInt in outputInterfaces){
			if(outputInterfaces.hasOwnProperty(outputInt)){
				var a = makeOutput();
				a.name = outputInt;
				outputs[outputInt] = a;
				objs.push(a);
				a.getOutof = function(){
					return box;
				};
			}
		}
		
		box.getOutputs = function(){
			return outputs;
		};
		
		return box;
	};
	
	return component;
}


function composeComponents(compList, wiringPairList){
	var order = {};
	var i = 0;
	for(name in compList){
		if(compList.hasOwnProperty(name)){
			order[name] = i;
			i++;
		}
	}
	
	//sort the list of components to satisfy the wiringPairs
	forEach(wiringPairList, function(wiringPair){
		var first = wiringPair.outcomp;
		var second = wiringPair.incomp;
		if(order[first] > order[second]){
			var neworder = order[second];
			for(item in order){
				if(order.hasOwnProperty(item)){
					if(order[item] >= neworder){
						order[item]++;
					}
				}
			}
			order[first] = neworder;
		}
	});
	
	//double check to catch any loopy behavior
	forEach(wiringPairList, function(wiringPair){
		var first = wiringPair.outcomp;
		var second = wiringPair.incomp;
		if(order[first] > order[second]){
			return "error"; //throw error... somehow
		}
	});
	
	//put the names of the components into an array in the right order
	var sortedComps = [];
	for(name in order){
		if(order.hasOwnProperty(name)){
			sortedComps[order[name]] = name;
		}
	}


	//store the wirings by the incomp
	var wiringsByIncomp = {};
	forEach(wiringPairList, function(wiringPair){
		if(!wiringsByIncomp[wiringPair.incomp]){
			wiringsByIncomp[wiringPair.incomp] = [];
		}
		wiringsByIncomp[wiringPair.incomp].push(wiringPair);
	});

	
	//now create the component applications
	var apps = {};
	forEach(sortedComps, function(compName){
		var pinAssigns = {};
		if(wiringsByIncomp[compName]){
			forEach(wiringsByIncomp[compName], function(wiringPair){
				pinAssigns[wiringPair.inname] = apps[wiringPair.outcomp].getOutputs()[wiringPair.outname];
			});
		}
		apps[compName] = compList[compName].makeApply(pinAssigns);
		objs.push(apps[compName]);
	});
}



function scratchTest(){
	
	var a = makeComponent({in1:'set',in2:'unit'},{out1:'set',out2:'set'});
	var b = makeComponent({in1:'set',in2:'unit',in3:'set'},{out1:'set',out2:'unit'});
	var c = makeComponent({in1:'unit'},{out1:'unit',out2:'set'});
	
	
	var app = composeComponents({a:a,b:b,c:c},
		[
			{outcomp:"a",outname:"out2",incomp:"b",inname:"in1"},
			{outcomp:"a",outname:"out1",incomp:"c",inname:"in1"},
			{outcomp:"c",outname:"out1",incomp:"b",inname:"in2"}
		]);
	
	//objs.push(app);
	
	/*
	var app1 = a.makeApply({});
	objs.push(app1);
	var app1outs = app1.getOutputs();
	var app1outArray = [];
	forEach(app1outs, function(out){
		app1outArray.push(out);
	});
	
	var app2 = a.makeApply({in1:app1outArray[0], in2:app1outArray[1]});
	objs.push(app2);
	*/	
	return objs;
}