const $ = require('jquery');
const remote = require('electron').remote;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
const monitor = new CoinMonitor();

$(document).ready(function () {
	var window = remote.getCurrentWindow().on('resize', function () {
		var size = window.getContentSize();
		monitor.chart.setSize(size[0] - (size[0] * 0.1), size[1] - (size[1] * 0.1), true);
	});;


	// minimize and close buttons
	document.getElementById('minimize-button').addEventListener('click', (e) => {
		window.minimize();
	});
	document.getElementById('close-button').addEventListener('click', (e) => {
		window.close();
	});

	// dropdown currency selectors
	$("#base-currency-options").find("a").on('click', function (e) {
		console.log($(this).text());
		var newCurrency = $(this).text();
		monitor.updateSetting('baseCurrency', newCurrency);
		monitor.getSpotPrice();
	});

	$("#target-currency-options").find("a").on('click', function () {
		console.log($(this).text());
		var newCurrency = $(this).text();
		monitor.updateSetting('targetCurrency', newCurrency);
		monitor.getSpotPrice();
	});


	// chart toggle button
	$("#show-price-chart-btn").on('click', () => {
		if ($("#mid-bar-price-content").is(':visible')) {
			var windowSize = (window.getContentSize());
			monitor.chart.setSize(windowSize[0] - 30, windowSize[1] - 50, true);
			$("#mid-bar-price-content").hide();
			$("#highcharts-outer-container").show();
			$("#mid-bar-highcharts-graph").show();
			$(this).text("Show Spot Price");
		} else {
			$("#mid-bar-price-content").show();
			$("#highcharts-outer-container").hide();
			$("#mid-bar-highcharts-graph").hide();
			$(this).text("Show Price History");
		}
	});
});