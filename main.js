const {
	app,
	BrowserWindow,
	Menu,
	MenuItem
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const menu = new Menu();
let win;

const settingsDir = os.homedir() + "/.crypto-monitor";
const settingsPath = settingsDir + "/window-config.json";
const defaultSettings = {
	title: 'Crypto Monitor',
	backgroundColor: '#222',
	width: 600,
	height: 350,
	minWidth: 520,
	minHeight: 250,
	frame: false,
	webPreferences: {
		nodeIntegrationInWorker: true
	},
	show: false // hide the window until ready
};
var settings = readWindowSettings();


function readWindowSettings() {
	// create the app's home folder if it doesn't exist
	if (!fs.existsSync(settingsDir)) {
		fs.mkdirSync(settingsDir);
	}
	// if the config file exists
	if (fs.existsSync(settingsPath)) {
		// read it into the object
		settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
	}
	// if no config file exists
	else {
		settings = defaultSettings;
		writeWindowSettings(settings);
	}
	return settings;
}


function writeWindowSettings() {
	// write one with default settings
	fs.writeFile(settingsPath, JSON.stringify(settings), {
		encoding: 'utf8'
	}, (err) => {
		// if the file fails to write... oh well it's just a window config
		console.log(err);
	}, () => {});
}

function createWindow() {
	try {
		// Create the browser window.
		win = new BrowserWindow(settings);
	} catch (err) {
		win = new BrowserWindow(defaultSettings);
	}

	// show the window when it's ready
	win.on('ready-to-show', () => {
		win.show();
		win.focus();
	})

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'app/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Open the DevTools.
	// win.webContents.openDevTools();

	win.on('closed', () => {
		writeWindowSettings(settings);
		win = null; // dereference the closed window
	});

	win.on('move', () => {
		var position = win.getPosition();
		settings.x = position[0];
		settings.y = position[1];
	});
	win.on('resize', () => {
		var size = win.getSize();
		settings.width = size[0];
		settings.height = size[1];
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		writeWindowSettings();
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow();
	}
});