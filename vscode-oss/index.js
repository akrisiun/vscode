
const { app, BrowserWindow, ipcMain } = require('electron');
const main = require('./main');

if (main) {
	main();
} else {
	
	let mainWindow;
	
	function createWindow () {
	  mainWindow = new BrowserWindow({
	    width: 800,
	    height: 600,
	    webPreferences: {
	      nodeIntegration: true,
	    },
	  });
	  mainWindow.loadFile('index.html');
	  mainWindow.on('closed', function () {
	    mainWindow = null;
	  });
	}
	
	app.on('ready', () => {
	  createWindow();
	});
	
	app.on('window-all-closed', function () {
	  if (process.platform !== 'darwin') {
	    app.quit();
	  }
	});
	
	app.on('activate', function () {
	  if (mainWindow === null) {
	    createWindow();
	  }
	});
	
	ipcMain.on('app_version', (event) => {
	  event.sender.send('app_version', { version: app.getVersion() });
	});
}
