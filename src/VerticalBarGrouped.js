
YOKUL.VerticalBarGrouped = function VerticalBarGrouped(queryData) {
	this._imageData = this._createChartImage(queryData);
};

YOKUL.VerticalBarGrouped.prototype.imageData = function vbg_imageData() {
	return this._imageData;
};

YOKUL.VerticalBarGrouped.prototype._getChartAreaWidth = function vbg_getChartAreaWidth(parser) {
	var chartSpacing = parser.chartSpacing();

	if(chartSpacing.isAutomaticBarWidth()) {
		return parser.size().w;
	}
	
	var areaWidth = 0;

	var data = parser.chartData();

	areaWidth += data[0].length * (chartSpacing.getBarWidth() + chartSpacing.getBetweenBars()) * data.length - chartSpacing.getBetweenBars();
	areaWidth += data[0].length * chartSpacing.getBetweenGroups();

	return areaWidth;
};

YOKUL.VerticalBarGrouped.prototype._measureChartArea = function vbg_measureChartArea(context, parser) {
	var chartAreaWidth = this._getChartAreaWidth(parser);

	var measure = { x: 0, y: 0, w: chartAreaWidth, h: parser.size().h };

	// title
	var titleMeasure = parser.title() ? YOKUL.defaults.titleHeight : 0;
	measure.y += titleMeasure;
	measure.h -= titleMeasure;

	// bottom axis
	var bottomAxisHeight = 6;
	var visibleAxes = parser.visibleAxes();
	for(var i = 0; i < visibleAxes.length; ++i) {
		if(visibleAxes[i] == 'x') {
			bottomAxisHeight += YOKUL.defaults.axisLabelHeight;
		}
	}

	measure.h -= bottomAxisHeight;

	// top axis
	var topAxisHeight = 6;
	for(var i = 0; i < visibleAxes.length; ++i) {
		if(visibleAxes[i] == 't') {
			topAxisHeight += YOKUL.defaults.axisLabelHeight;
		}
	}

	measure.y += topAxisHeight;
	measure.h -= topAxisHeight;

	function getMaxLabelWidth(index) {
		var labels = parser.axisLabels();

		var max = 0;
		if(labels && labels[index]) {
			for(var i = 0; i < labels.length; ++i) {
				var labelWidth = context.measureText(labels[i]).width;
				if(labelWidth > max) {
					max = labelWidth;
				}
			}
		} else {
			var data = parser.chartData();

			if(data && data[index]) {
				var dataMax = YOKUL.utility.max(data[index]);
				max = context.measureText(dataMax.toString()).width;
			}
		}

		return max;
	}

	// left axis
	var leftAxisWidth = 1;
	for(var i = 0; i < visibleAxes.length; ++i) {
		if(visibleAxes[i] == 'y') {
			leftAxisWidth += getMaxLabelWidth(i); //p.axisLabels()[i]);
		}
	}

	measure.x += leftAxisWidth;

	return measure;
};

YOKUL.VerticalBarGrouped.prototype._getSeriesRange = function vbg_getSeriesRange(index, parser) {
	var specifiedRanges = parser.seriesRanges();

	if(specifiedRanges && specifiedRanges[index]) {
		return specifiedRanges[index];
	}

	if(specifiedRanges && specifiedRanges[0]) {
		return specifiedRanges[0];
	}

	//var data = parser.chartData();

	//return { min: YOKUL.utility.min2d(data), max: YOKUL.utility.max2d(data) };
	return { min: 0, max: 100 };
};

YOKUL.VerticalBarGrouped.prototype._getSeriesColor = function vbg_getSeriesColor(index, parser) {
	var seriesColors = parser.seriesColors();

	if(seriesColors && seriesColors[index]) {
		return seriesColors[index];
	}

	if(seriesColors && seriesColors[index % seriesColors.length]) {
		return seriesColors[index % seriesColors.length];
	}

	return YOKUL.defaults.seriesColor;
};

YOKUL.VerticalBarGrouped.prototype._drawChartArea = function vbg_drawChartArea(context, measurement, parser) {
	var chartSpacing = parser.chartSpacing();
	var data = parser.chartData();

	var areaHeight = measurement.h;

	var currentX = measurement.x + chartSpacing.getBetweenGroups() / 2;
	var barWidth = chartSpacing.getBarWidth(data.length * data[0].length, data.length, measurement.w);

	//-0.8,0.8,-0.6|-1.2,1,-0.3|-0.4,1.3,-0.1|-0.1,-0.4,-0.6|-0.3,-0.4,0|0.4,-1.2,0.4|-0.4,-0.4,0.4
	for(var g = 0; g < data[0].length; ++g) {
		for(var i = 0; i < data.length; ++i) {
			var seriesRanges = this._getSeriesRange(i, parser);
			var range = seriesRanges.max - seriesRanges.min;
			var zeroY = measurement.y + areaHeight * (seriesRanges.max / range);

			var value = data[i][g];
			var barValue = areaHeight * (value / range);
			var barHeight = Math.abs(barValue);
			var barY = zeroY;
			if(value > 0) {
				barY = zeroY - barHeight;
			}

			context.save();
			context.fillStyle = this._getSeriesColor(i, parser);//seriesColors[i];
			context.fillRect(currentX, barY, barWidth, barHeight);
			context.restore();
			currentX += barWidth;
			if(i < data.length - 1) {
				currentX += chartSpacing.getBetweenBars();
			}
		}
		currentX += chartSpacing.getBetweenGroups();
	}


};

YOKUL.VerticalBarGrouped.prototype._drawAxes = function vbg_drawAxes(context, measurement, parser) {
	context.strokeStyle = "gray";
	context.beginPath();
	context.moveTo(measurement.x + .5, measurement.y + .5);
	context.lineTo(measurement.x + .5, measurement.y + measurement.h + .5);
	context.lineTo(measurement.x + measurement.w + .5, measurement.y + measurement.h + .5);
	context.moveTo(measurement.x + .5, measurement.y + .5);
	context.closePath();
	context.stroke();
};

YOKUL.VerticalBarGrouped.prototype._drawAxisLabels = function vbg_drawAxisLabels(context, measurement, parser, axis) {
	var visibleAxes = parser.visibleAxes();
	var axisLabels = parser.axisLabels();

	var curAxisIndex = 0;

	function drawLabel(index, labels) {
		var labelHeight = YOKUL.defaults.axisLabelHeight;
		var widthPerLabel = measurement.w / labels.length;
		var curX = widthPerLabel / 2;
		var curY = measurement.y + measurement.h + (labelHeight * (index + 1));

		context.strokeStyle = "Gray";
		context.fillStyle = YOKUL.defaults.axisLabelColor;
		context.font = YOKUL.defaults.axisLabelFont;

		for(var l = 0; l < labels.length; ++l) {
			if(index === 0) {
				context.beginPath();
				context.moveTo(curX, curY - (labelHeight - 4));
				context.lineTo(curX, curY - (labelHeight + 1));
				context.closePath();
				context.stroke();
			}

			var labelWidth = context.measureText(labels[l]).width;
			context.fillText(labels[l], curX - labelWidth / 2, curY);
			curX += widthPerLabel;
		}
	}

	for(var i = 0; i < visibleAxes.length; ++i) {
		if(visibleAxes[i] === axis && axisLabels['axis' + i]) {
			drawLabel(curAxisIndex, axisLabels['axis' + i]);
		}
	}
};

YOKUL.VerticalBarGrouped.prototype._drawTitle = function vbg_drawTitle(context, measurement, parser) {
	var title = parser.title();

	if(title) {
		context.font = YOKUL.defaults.titleFont;
		context.fillStyle = YOKUL.defaults.titleColor;
		var center = measurement.x + measurement.w / 2;
		var measured = context.measureText(title);
		context.fillText(title, center - measured.width / 2, (2 * YOKUL.defaults.titleHeight) / 3 );
	}
};

YOKUL.VerticalBarGrouped.prototype._drawLegend = function vbg_drawLegend(context, measurement, parser) {
	var spacing = 6;
	var entryHeight = 12;
	var legendLabels = parser.legendLabels();
	var seriesColors = parser.seriesColors();
	var legendHeight = (entryHeight+spacing) * legendLabels.length - spacing;

	var startY = context.canvas.height / 2 - legendHeight / 2 + entryHeight;
	var startX = measurement.x + measurement.w + 5;

	for(var i = 0; i < legendLabels.length; ++i) {
		context.save();
		context.fillStyle = this._getSeriesColor(i, parser);
		context.fillRect(startX, startY, entryHeight, entryHeight);
		context.fillStyle = "gray";
		context.fillText(legendLabels[i], startX + entryHeight + spacing, startY + ((entryHeight + spacing) / 2));
		context.restore();
		startY += entryHeight + spacing;
	}
};

YOKUL.VerticalBarGrouped.prototype._createChartImage = function VerticalBarGrouped_createChartImage(query) {
	var parser = new YOKUL.Parser(query);

	var canvas = document.createElement('canvas');
	canvas.width = parser.size().w;
	canvas.height = parser.size().h;
	var context = canvas.getContext('2d');

	YOKUL.useContext(context, function(context) {
		context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, canvas.width, canvas.height);
	});

	var chartAreaMeasure = this._measureChartArea(context, parser);

	var that = this;
	YOKUL.useContext(context, function(context) {
		that._drawChartArea(context, chartAreaMeasure, parser);
	});

	YOKUL.useContext(context, function(context) {
		that._drawAxes(context, chartAreaMeasure, parser);
	});

	YOKUL.useContext(context, function(context) {
		that._drawAxisLabels(context, chartAreaMeasure, parser, 'x');
	});

	YOKUL.useContext(context, function(context) {
		that._drawTitle(context, chartAreaMeasure, parser);
	});

	if(parser.legendSpecified()) {
		YOKUL.useContext(context, function(context) {
			that._drawLegend(context, chartAreaMeasure, parser);
		});
	}

	return canvas.toDataURL('image/png');
};




