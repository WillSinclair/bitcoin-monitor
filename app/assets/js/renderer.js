const $ = require('jquery');
const remote = require('electron').remote;
const clipboard = require('electron').clipboard;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
const monitor = new CoinMonitor();

$(document).ready(function () {
	var window = remote.getCurrentWindow();
	window.on('resize', function () {
		var size = window.getContentSize();
		monitor.chart.setSize(size[0] - 30, size[1] - 60, true);
	});


	// minimize and close buttons
	document.getElementById('minimize-button').addEventListener('click', (e) => {
		window.minimize();
	});
	document.getElementById('close-button').addEventListener('click', (e) => {
		window.close();
	});

	// copy the price to clipboard when the user click on it
	$("#current-price-display").on('click', function () {
		clipboard.writeText($(this).text());
	});

	// dropdown currency selectors
	$("#base-currency-options").find("a").on('click', function () {
		$("#current-price-display").hide();
		$("#current-price-loader").show();
		var newCurrency = $(this).text();
		monitor.updateSetting('baseCurrency', newCurrency);
		monitor.getSpotPrice();
	});

	$("#target-currency-options").find("a").on('click', function () {
		$("#current-price-display").hide();
		$("#current-price-loader").show();
		var newCurrency = $(this).text();
		monitor.updateSetting('targetCurrency', newCurrency);
		monitor.getSpotPrice();
	});

	// chart toggle button
	$("#show-price-chart-btn").on('click', function () {
		if ($("#mid-bar-price-content").is(':visible')) {
			var windowSize = (window.getContentSize());
			monitor.chart.setSize(windowSize[0] - 30, windowSize[1] - 50, true);
			$("#mid-bar-price-content").hide();
			$("#highcharts-outer-container").show();
			$("#mid-bar-highcharts-graph").show();
			$("#show-price-chart-btn").text("Spot Price");
			console.log($(this).text());
		} else {
			$("#mid-bar-price-content").show();
			$("#highcharts-outer-container").hide();
			$("#mid-bar-highcharts-graph").hide();
			$("#show-price-chart-btn").text("Price Graph");
		}
	});
});