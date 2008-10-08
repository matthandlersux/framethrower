var animation = (function () {
	
	var steps = 18;
	var delay = 4;
	
	var fadeInSteps = 18;
	
	
	function curve(x) {
		//return 1-(x-1)*(x-1);
		return x;
	}
	function curveFadeIn(x) {
		return x;
	}
	
	var curveSteps = [];
	var curveFadeInSteps = [];
	for (var i = 0; i < steps; i++) {
		curveFadeInSteps.push(0);
		curveSteps.push(curve(i / (steps - 1)));
	}
	for (i = 0; i < fadeInSteps; i++) {
		curveFadeInSteps.push(curveFadeIn(i / (fadeInSteps - 1)));
	}
	
	//console.log(curveFadeInSteps);
	//console.log(curveSteps);
	
	var animators = makeOhash(JSON.stringify);
	
	var animationGoing = false;
	function startAnimation() {
		if (!animationGoing) {
			animationGoing = true;
			setTimeout(function () {
				//console.log("starting animation");
				animators.forEach(function (animator, node) {
					//console.log(node);
					//console.dir(animator);
				});
				doAnimation();
			}, 0);
		}
	}
	
	function doAnimation() {
		var removeAnimators = [];
		animators.forEach(function (animator, node) {
			var removeStyleNames = [];
			forEach(animator, function (arr, name) {
				if (arr.length === 0) {
					removeStyleNames.push(name);
				} else {
					var val = arr.shift();
					node.style[name] = val + (name === "opacity" ? "" : "px");
				}
			});
			forEach(removeStyleNames, function (name) {
				delete animator[name];
			});
			if (isEmpty(animator)) {
				removeAnimators.push(node);
			}
		});
		forEach(removeAnimators, function (node) {
			delete node.oldSize;
			animators.remove(node);
		});
		if (!animators.isEmpty()) {
			setTimeout(doAnimation, delay);
		} else {
			animationGoing = false;
		}
	}
	
	
	var attrs = ["width", "height", "left", "top"];
	
	return {
		animateStyle: function (node, name, ov, nv) {
			var animator = animators.getOrMake(node, function () {
				return {};
			});
			animator[name] = map(curveSteps, function (x) {return Math.round(ov + (nv - ov) * x);});
			//console.log("animatoring", name);
			//console.dir(animator);
			startAnimation();
		},
		fadeIn: function (node) {
			var animator = animators.getOrMake(node, function () {
				return {};
			});
			animator.opacity = map(curveFadeInSteps, function (x) {return x;});
			startAnimation();
		},
		removeAnimation: function (node) {
			delete node.oldSize;
			animators.remove(node);
		}
	};
})();