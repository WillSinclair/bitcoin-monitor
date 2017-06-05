const $ = require('jquery');
const remote = require('electron').remote;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
var monitor = new CoinMonitor();

$(document).ready(function () {
	var window = remote.getCurrentWindow();


	// minimize and close buttons
	document.getElementById('minimize-button').addEventListener('click', (e) => {
		window.minimize();
	});
	document.getElementById('close-button').addEventListener('click', (e) => {
		window.close();
	});


	// change chart size on window size change
	window.on('resize', () => {
		var size = window.getContentSize();
		monitor.chart.setSize(size[0] - 20, size[1] - 20, true);
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
		$("#mid-bar-price-content").hide();
		$("#highcharts-outer-container").show();
		$("#mid-bar-highcharts-graph").show() //.css('visibility', 'visible');
		var windowSize = (window.getContentSize());
		monitor.chart.setSize(windowSize[0] - 20, windowSize[1] - 20, true);
	});
});