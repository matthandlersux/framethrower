template () {
	
	chapters = function ()::List (Tuple2 Number Number) {
		timestamps = [
			0,
			76.504,
			330.36,
			645.027,
			782.953,
			849.25,
			1259.26,
			1504.747,
			1652.425,
			1881.022,
			2142.717,
			2403.444,
			2668.112,
			2922.136,
			3206.031,
			3303.444,
			3459.073,
			3571.328,
			3680.688,
			3937.237,
			4075.511,
			4358.248,
			4682.244,
			5126.301,
			5222.668,
			5383.006,
			5515.278,
			5689.8,
			5773.141,
			5922.633,
			6136.257,
			6457.204,
			6684.822,
			6792.397,
			7112.384,
			7213.751
		];
		
		
		// timestamps = [
		// 0,
		// 258.22,
		// 258.26,
		// 258.30,
		// 258.34,
		// 258.47,
		// 259.59,
		// 318.43,
		// 319.27,
		// 337.57,
		// 338.12,
		// 338.99,
		// 339.82,
		// 340.41,
		// 357.46,
		// 375.56,
		// 389.49,
		// 389.95,
		// 414.60,
		// 415.93,
		// 417.01,
		// 419.27,
		// 419.31,
		// 419.39,
		// 421.60,
		// 422.39,
		// 422.44,
		// 422.69,
		// 432.03,
		// 434.24,
		// 437.49,
		// 439.12,
		// 441.03,
		// 444.20,
		// 445.00,
		// 446.58,
		// 448.54,
		// 449.79,
		// 450.25,
		// 453.88,
		// 454.63,
		// 507.76,
		// 513.26,
		// 513.89,
		// 516.72,
		// 518.60,
		// 519.43,
		// 520.35,
		// 521.68,
		// 522.39,
		// 522.89,
		// 523.60,
		// 524.85,
		// 541.78,
		// 544.25,
		// 555.30,
		// 555.84,
		// 560.55,
		// 561.22,
		// 562.18,
		// 562.39,
		// 562.59,
		// 568.22,
		// 568.93,
		// 571.10,
		// 594.45,
		// 595.33,
		// 608.80,
		// 609.30,
		// 609.63,
		// 611.22,
		// 611.76,
		// 612.59,
		// 614.76,
		// 621.35,
		// 624.52,
		// 641.37,
		// 643.04,
		// 650.71,
		// 651.46,
		// 652.71,
		// 653.79,
		// 654.55,
		// 656.21,
		// 656.51,
		// 656.55,
		// 656.59,
		// 656.63,
		// 656.67,
		// 656.71,
		// 686.20,
		// 694.12,
		// 713.26,
		// 733.94,
		// 746.83,
		// 769.31,
		// 791.83,
		// 791.95,
		// 792.08,
		// 792.41,
		// 792.62,
		// 805.80,
		// 806.63,
		// 807.05,
		// 813.14,
		// 819.89,
		// 820.35,
		// 830.90,
		// 833.24,
		// 840.66,
		// 847.25,
		// 849.08,
		// 904.80,
		// 916.26,
		// 918.81,
		// 919.56,
		// 927.02,
		// 927.77,
		// 928.82,
		// 932.15,
		// 933.90,
		// 934.86,
		// 936.28,
		// 936.91,
		// 937.91,
		// 940.03,
		// 941.03,
		// 941.83,
		// 942.95,
		// 943.45,
		// 943.91,
		// 945.16,
		// 945.91,
		// 947.66,
		// 948.92,
		// 949.46,
		// 950.08,
		// 950.75,
		// 953.04,
		// 953.59,
		// 956.51,
		// 964.85,
		// 966.51,
		// 967.93,
		// 968.27,
		// 968.85,
		// 979.11,
		// 981.44,
		// 983.78,
		// 984.24,
		// 984.74,
		// 985.40,
		// 987.16,
		// 994.00,
		// 994.66,
		// 1007.30,
		// 1009.38,
		// 1010.05,
		// 1016.35,
		// 1018.93,
		// 1022.23,
		// 1022.89,
		// 1024.02,
		// 1024.81,
		// 1025.65,
		// 1028.65,
		// 1030.98,
		// 1032.28,
		// 1034.49,
		// 1035.28,
		// 1038.99,
		// 1039.87,
		// 1040.62,
		// 1043.41,
		// 1044.50,
		// 1045.83,
		// 1047.25,
		// 1048.42,
		// 1050.42,
		// 1051.83,
		// 1055.00,
		// 1058.30,
		// 1060.47,
		// 1069.06,
		// 1070.89,
		// 1072.89,
		// 1076.69,
		// 1081.28,
		// 1092.12,
		// 1107.76,
		// 1110.26,
		// 1110.88,
		// 1112.30,
		// 1113.26,
		// 1115.85,
		// 1116.68,
		// 1122.48,
		// 1122.85,
		// 1123.56,
		// 1124.40,
		// 1128.94,
		// 1132.99,
		// 1134.45,
		// 1150.04,
		// 1152.21,
		// 1153.96,
		// 1156.13,
		// 1156.63,
		// 1157.09,
		// 1157.97,
		// 1158.67,
		// 1159.72,
		// 1161.63,
		// 1162.05,
		// 1168.97,
		// 1170.02,
		// 1189.41,
		// 1205.75,
		// 1251.83,
		// 1254.96,
		// 1265.47,
		// 1267.22,
		// 1297.79,
		// 1298.83,
		// 1309.38,
		// 1330.94,
		// 1331.73,
		// 1332.53,
		// 1334.99,
		// 1335.82,
		// 1337.20,
		// 1338.07,
		// 1339.16,
		// 1340.08,
		// 1340.99,
		// 1341.66,
		// 1366.43,
		// 1367.31,
		// 1368.31,
		// 1370.31,
		// 1371.10,
		// 1372.10,
		// 1373.60,
		// 1375.35,
		// 1376.77,
		// 1381.03,
		// 1382.40,
		// 1390.08,
		// 1430.78,
		// 1432.49,
		// 1433.99,
		// 1442.79,
		// 1446.29,
		// 1447.37,
		// 1448.92,
		// 1449.46,
		// 1520.98,
		// 1522.06,
		// 1522.85,
		// 1523.73,
		// 1532.44,
		// 1619.43,
		// 1656.88,
		// 1664.89,
		// 1666.22,
		// 1667.47,
		// 1668.64,
		// 1669.60,
		// 1671.06,
		// 1671.89,
		// 1673.23,
		// 1674.48,
		// 1675.69,
		// 1742.74,
		// 1825.44,
		// 1825.60,
		// 1825.77,
		// 1932.94,
		// 1933.40,
		// 1954.00,
		// 1954.42,
		// 1972.81,
		// 1981.19,
		// 2022.19,
		// 2023.06,
		// 2025.90,
		// 2039.95,
		// 2097.21,
		// 2102.04,
		// 2108.05,
		// 2111.68,
		// 2112.39,
		// 2113.59,
		// 2116.81,
		// 2379.61,
		// 2383.28,
		// 2404.84,
		// 2405.55,
		// 2459.72,
		// 2461.63,
		// 2462.01,
		// 2495.58,
		// 2507.42,
		// 2508.05,
		// 2522.19,
		// 2528.94,
		// 2531.65,
		// 2533.03,
		// 2533.95,
		// 2578.19,
		// 3240.03,
		// 3244.45,
		// 3245.79,
		// 3246.91,
		// 3247.41,
		// 3248.04,
		// 3287.45,
		// 3298.87,
		// 3300.42,
		// 3321.52,
		// 3322.27,
		// 3326.31,
		// 3406.96,
		// 3407.92,
		// 3455.05,
		// 3780.73,
		// 3782.11,
		// 3782.24,
		// 3782.28,
		// 3782.32,
		// 3782.44,
		// 3782.49,
		// 3782.53,
		// 3782.57,
		// 3782.69,
		// 3784.40,
		// 3785.40,
		// 3786.91,
		// 3788.45,
		// 3789.53,
		// 3790.12,
		// 3790.87,
		// 3793.24,
		// 3797.62,
		// 3801.38,
		// 3810.93,
		// 3820.68,
		// 3821.23,
		// 3821.64,
		// 3822.48,
		// 3823.27,
		// 3824.02,
		// 3825.48,
		// 3826.27,
		// 3826.86,
		// 3842.29,
		// 3843.66,
		// 3844.41,
		// 3845.20,
		// 3845.75,
		// 3847.08,
		// 3883.78,
		// 3894.00,
		// 3898.25,
		// 3899.08,
		// 3902.21,
		// 3902.84,
		// 3909.47,
		// 3911.89,
		// 3912.97,
		// 3923.73,
		// 3925.44,
		// 3939.41,
		// 3939.83,
		// 4083.49,
		// 4085.49,
		// 4088.66,
		// 4108.84,
		// 4110.97,
		// 4113.30,
		// 4167.31,
		// 4208.76,
		// 4210.97,
		// 4214.26,
		// 4233.07,
		// 4238.53,
		// 4262.01,
		// 4331.57,
		// 4332.65,
		// 4347.50,
		// 4359.01,
		// 4363.30,
		// 4364.18,
		// 4367.35,
		// 4372.64,
		// 4373.60,
		// 4387.57,
		// 4391.28,
		// 4392.20,
		// 4395.45,
		// 4399.17,
		// 4404.50,
		// 4405.67,
		// 4407.13,
		// 4408.72,
		// 4427.11,
		// 4427.94,
		// 4429.90,
		// 4431.15,
		// 4433.78,
		// 4435.99,
		// 4437.82,
		// 4439.95,
		// 4442.54,
		// 4443.62,
		// 4467.39,
		// 4472.02,
		// 4473.98,
		// 4477.27,
		// 4489.82,
		// 4494.87,
		// 4496.12,
		// 4498.54,
		// 4499.96,
		// 4774.60,
		// 4878.98,
		// 4879.40,
		// 4880.78,
		// 4892.20,
		// 4892.79,
		// 4894.54,
		// 4920.31,
		// 4921.85,
		// 4966.06,
		// 4966.97,
		// 5050.50,
		// 5051.63,
		// 5052.34,
		// 5059.55,
		// 5069.89,
		// 5070.73,
		// 5071.60,
		// 5072.60,
		// 5073.73,
		// 5089.03,
		// 5089.66,
		// 5090.08,
		// 5091.24,
		// 5091.66,
		// 5099.92,
		// 5100.25,
		// 5102.04,
		// 5268.56,
		// 5602.17,
		// 5603.34,
		// 5645.91,
		// 5648.17,
		// 5661.01,
		// 5661.93,
		// 5662.51,
		// 5664.01,
		// 5665.10,
		// 5671.02,
		// 5672.89,
		// 5677.15,
		// 5677.69,
		// 5678.19,
		// 5678.61,
		// 5679.11,
		// 5792.54,
		// 5792.74,
		// 5793.04,
		// 5793.08,
		// 5793.20,
		// 5793.33,
		// 5793.58,
		// 5794.33,
		// 5796.00,
		// 5796.04,
		// 5796.16,
		// 5796.21,
		// 5796.25,
		// 5797.37,
		// 5797.41,
		// 5797.46,
		// 5797.58,
		// 5797.67,
		// 5798.37,
		// 5798.46,
		// 5798.50,
		// 5798.62,
		// 5798.67,
		// 5799.21,
		// 5799.25,
		// 5800.08,
		// 5800.13,
		// 5800.21,
		// 5800.71,
		// 5800.75,
		// 5800.88,
		// 5800.96,
		// 5801.00,
		// 5801.04,
		// 5806.76,
		// 5943.54,
		// 5943.70,
		// 5943.75,
		// 5945.20,
		// 5959.26,
		// 5960.22,
		// 5961.34,
		// 5962.51,
		// 5964.22,
		// 5965.30,
		// 5967.14,
		// 5968.60,
		// 5973.94,
		// 5986.78,
		// 5993.12,
		// 6011.84,
		// 6012.76,
		// 6013.72,
		// 6019.56,
		// 6021.73,
		// 6058.38,
		// 6062.89,
		// 6079.94,
		// 6156.76,
		// 6158.13,
		// 6177.90,
		// 6193.83,
		// 6195.20,
		// 6204.25,
		// 6205.21,
		// 6240.03,
		// 6262.09,
		// 6262.68,
		// 6276.61,
		// 6278.36,
		// 6284.28,
		// 6284.78,
		// 6289.78,
		// 6294.20,
		// 6294.25,
		// 6294.70,
		// 6297.04,
		// 6297.71,
		// 6298.46,
		// 6298.96,
		// 6299.42,
		// 6300.17,
		// 6300.63,
		// 6301.33,
		// 6302.21,
		// 6304.05,
		// 6305.13,
		// 6311.01,
		// 6311.93,
		// 6319.35,
		// 6320.23,
		// 6334.24,
		// 6335.53,
		// 6344.58,
		// 6345.75,
		// 6346.87,
		// 6354.17,
		// 6355.38,
		// 6356.80,
		// 6358.47,
		// 6360.63,
		// 6362.05,
		// 6365.60,
		// 6368.52,
		// 6377.90,
		// 6379.94,
		// 6382.90,
		// 6390.49,
		// 6391.33,
		// 6392.41,
		// 6395.41,
		// 6396.87,
		// 6406.55,
		// 6407.47,
		// 6408.47,
		// 6416.64,
		// 6417.89,
		// 6421.18,
		// 6422.94,
		// 6425.10,
		// 6429.36,
		// 6431.32,
		// 6432.78,
		// 6433.90,
		// 6437.32,
		// 6437.95,
		// 6443.08,
		// 6447.16,
		// 6454.42,
		// 6455.09,
		// 6455.84,
		// 6462.97,
		// 6477.82,
		// 6482.11,
		// 6486.99,
		// 6504.92,
		// 6507.51,
		// 6517.14,
		// 6519.81,
		// 6526.27,
		// 6527.65,
		// 6530.03,
		// 6542.49,
		// 6545.75,
		// 6552.46,
		// 6555.67,
		// 6558.09,
		// 6559.76,
		// 6562.30,
		// 6564.51,
		// 6567.68,
		// 6570.23,
		// 6604.63,
		// 6616.56,
		// 6618.81,
		// 6620.68,
		// 6641.49,
		// 6643.66,
		// 6645.08,
		// 6646.46,
		// 6647.58,
		// 6651.17,
		// 6651.96,
		// 6653.34,
		// 6654.34,
		// 6657.84,
		// 6659.38,
		// 6659.88,
		// 6663.51,
		// 6664.14,
		// 6665.22,
		// 6666.18,
		// 6667.77,
		// 6669.60,
		// 6670.68,
		// 6671.56,
		// 6672.31,
		// 6672.81,
		// 6673.44,
		// 6673.81,
		// 6674.23,
		// 6676.11,
		// 6676.40,
		// 6676.44,
		// 6676.81,
		// 6677.06,
		// 6677.73,
		// 6679.02,
		// 6679.27,
		// 6679.57,
		// 6679.65,
		// 6680.57,
		// 6681.69,
		// 6682.94,
		// 6684.32,
		// 6684.90,
		// 6685.53,
		// 6686.03,
		// 6686.61,
		// 6688.41,
		// 6689.57,
		// 6692.16,
		// 6692.66,
		// 6694.50,
		// 6701.46,
		// 6702.04,
		// 6703.13,
		// 6703.96,
		// 6706.51,
		// 6716.01,
		// 6727.94,
		// 6730.03,
		// 6738.07,
		// 6742.70,
		// 6743.24,
		// 6743.41,
		// 6744.41,
		// 6744.66,
		// 6746.33,
		// 6747.92,
		// 6748.75,
		// 6749.79,
		// 6753.67,
		// 6756.30,
		// 6757.38,
		// 6758.47,
		// 6770.27,
		// 6771.52,
		// 6772.56,
		// 6774.98,
		// 6775.94,
		// 6776.40,
		// 6776.73,
		// 6778.57,
		// 6779.23,
		// 6788.03,
		// 7296.16
		// 
		// 
		// ];
		
		
		// var threshold = 0.8;
		// 
		// var newtimestamps = [];
		// var last=-threshold;
		// forEach(timestamps, function (timestamp) {
		// 	if (timestamp >= last+threshold) {
		// 		newtimestamps.push(timestamp);
		// 		last = timestamp;
		// 	}
		// });
		
		// var threshold = 4;
		// var newtimestamps = [];
		// forEach(timestamps, function (timestamp, i) {
		// 	if (i > 0 && i < timestamps.length - 1) {
		// 		if ((timestamps[i-1] + threshold <= timestamp) || (timestamps[i+1] - threshold >= timestamp)) {
		// 			newtimestamps.push(timestamp);
		// 		}
		// 	} else {
		// 		newtimestamps.push(timestamp);
		// 	}
		// });
		// 
		// console.log("filtered", timestamps.length, newtimestamps.length);
		// 
		// timestamps = newtimestamps;
		
		
		
		
		var endTime = 7668.189;
		
		var chapters = [];
		forEach(timestamps, function (timestamp, i) {
			var next = (i === timestamps.length - 1) ? endTime : timestamps[i+1];
			var chapter = makeTuple2(timestamp, next);
			chapters.push(chapter);
		});
		
		return arrayToList(chapters);
	},
	
	timelineWidth = fetch (UI.ui:screenWidth ui.ui),
	movieDuration = 7668.189,
	
	// width = time * zoomFactor
	zoomFactorS = state(Unit Number, 1),
	zoomFactor = fetch zoomFactorS,

	
	// units: pixels
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,


	setZoomFactor = action (newZoom::Number, mouse::Number) {
		extract zoomFactorS as oldZoom {
			extract scrollAmountS as oldScroll {
				clampedZoom = clampMin newZoom (divide timelineWidth movieDuration),
				getNewScroll = function (oldZoom::Number, newZoom::Number, oldScroll::Number, mouse::Number)::Number {
					return (newZoom/oldZoom)*(oldScroll+mouse) - mouse;
				},
				newScroll = getNewScroll oldZoom clampedZoom oldScroll mouse,
				set zoomFactorS clampedZoom,
				setScrollAmount newScroll
			}
		}
	},

	setScrollAmount = action (amount::Number) {
		min = 0,
		max = (subtract (multiply movieDuration zoomFactor) timelineWidth),
		set scrollAmountS (clamp amount min max)
	},
	
	
	modifyZoom = function (oldZoom::Number, delta::Number)::Number {
		var factor = 1.25;
		if (delta > 0) {
			return oldZoom * factor;
		} else {
			return oldZoom / factor;
		}
	},
	


	
	
	getFrame = function (time::Number)::String {
		return "url(http:/"+"/media.eversplosion.com/mrtesting/frame.php?time="+time+")";
	},
	formatTime = function (time::Number)::String {
		var seconds = time % 60;
		var minutes = ((time - seconds)/60) % 60;
		var hours = ((time - seconds - minutes*60)/3600);
		
		function pad(n) {
			if (n < 10) return "0" + n;
			else return "" + n;
		}
		
		var s = pad(Math.round(seconds));
		var m = pad(minutes);
		
		return hours + ":" + m + ":" + s;
	},
	

	
	zoomIn = action () {
		set zoomFactorS (plus zoomFactor 0.1)
	},
	zoomOut = action () {
		set zoomFactorS (subtract zoomFactor 0.1)
	},
	
	
	
	previewTimeS = state(Unit Number),
	
	
	
	isDisplayed = function (scrollAmount::Number, zoomFactor::Number, timelineWidth::Number, start::Number, duration::Number)::Bool {
		var pixelStart = start*zoomFactor;
		var pixelEnd = (start+duration)*zoomFactor;
		return (pixelStart >= scrollAmount && pixelStart <= scrollAmount+timelineWidth) || (pixelEnd >= scrollAmount && pixelEnd <= scrollAmount+timelineWidth);
	},
	checkDisplayed = start -> duration -> unitDone (bindUnit boolToUnit (unfetch (isDisplayed scrollAmount zoomFactor timelineWidth start duration))),
	
	
	
	makePercent = function (fraction::Number)::String {
		return (100*fraction)+"%";
	},
	
	
	
	<div>
		<div style-width="{timelineWidth}" style-height="200" style-left="0" style-top="144" style-overflow="hidden" style-position="absolute" style-background-color="#eee">
			<f:call>
				dragStart = state(Unit Number),
				scrollAmountStart = state(Unit Number),
				<f:wrapper>
					<f:on mousedown>
						set dragStart event.mouseX,
						set scrollAmountStart scrollAmount
					</f:on>
					<f:each dragStart as from>
						start = fetch scrollAmountStart,
						<f:wrapper>
							<f:on globalmouseup>
								unset dragStart
							</f:on>
							<f:on globalmousemove>
								setScrollAmount (subtract start (subtract event.mouseX from))
							</f:on>
						</f:wrapper>
					</f:each>
					<f:on mousescroll>
						//setZoomFactor (plus zoomFactor (multiply 0.1 (sign event.wheelDelta))) event.mouseX
						setZoomFactor (modifyZoom zoomFactor event.wheelDelta) event.mouseX
					</f:on>
					
					
				</f:wrapper>
			</f:call>
			<div style-position="absolute" style-left="{subtract 0 scrollAmount}" style-top="0" style-width="{multiply movieDuration zoomFactor}">
				<f:on mousemove>
					set previewTimeS (divide (plus event.mouseX scrollAmount) zoomFactor)
				</f:on>
				<f:each chapters as chapter>
					start = fst chapter,
					end = snd chapter,
					//<f:each checkDisplayed start (subtract end start) as _>
						//<div style-left="{multiply start zoomFactor}" style-width="{multiply (subtract end start) zoomFactor}" style-position="absolute" style-height="200" style-overflow="hidden">
						<div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide (subtract end start) movieDuration)}" style-position="absolute" style-height="200" style-overflow="hidden">
							<div style-padding="4" style-border-right="1px solid #ccc">
								<div style-height="100" style-background-color="#ccc" style-background-image="{getFrame start}" style-background-repeat="no-repeat" style-background-position="center center" />
							</div>
							// <div style-position="absolute" style-left="4" style-top="110">
							// 	{formatTime (fst chapter)}
							// </div>
							//{fst chapter}, {snd chapter}
							// <f:each checkDisplayed start (subtract end start) as _>
							// 	<span>blah</span>
							// </f:each>
						</div>
					//</f:each>
				</f:each>
			</div>
		</div>
		<div style-position="absolute" style-top="300">
			// <div>
			// 	<f:on click>zoomIn</f:on>
			// 	In
			// </div>
			// <div>
			// 	<f:on click>zoomOut</f:on>
			// 	Out
			// </div>
			// <div>scrollAmount: {scrollAmount}</div>
			// <div>zoomFactor: {zoomFactor}</div>
			// <f:each checkDisplayed 0 300 as _>
			// 	// console = function ()::Number {
			// 	// 	console.log("console called");
			// 	// 	return 3;
			// 	// },
			// 	<span>displayed</span>
			// </f:each>
			//{checkDisplayed 0 300}
		</div>
		
		// <div style-position="absolute" style-top="0" style-right="0" style-width="320" style-height="144">
		// 		<f:call>
		// 			videoURL = function ()::String {
		// 				return "http:/"+"/media.eversplosion.com/tmp/mr-scrub.mp4";
		// 			},
		// 			
		// 			loadedDurationS = state(Unit Number),
		// 			quicktime 320 144 videoURL previewTimeS loadedDurationS
		// 		</f:call>
		// </div>
	</div>
}