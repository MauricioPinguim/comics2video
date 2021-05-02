/**
 * comics2video - Converts Comic Book files to videos
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const { app, dialog, BrowserWindow, ipcMain, Menu } = require('electron');
const message = require('../messages/message');

let mainWindow, optionWindow;
let isConversionRunning = false;

function createMainWindow() {
    if (process.platform === 'darwin') {
        // Default application menu for macOS
        const applicationMenu = Menu.buildFromTemplate([{ role: 'appMenu' }]);
        Menu.setApplicationMenu(applicationMenu);
    } else {
        Menu.setApplicationMenu(null);
    }

    mainWindow = new BrowserWindow({
        width: 980, height: 350,
        minWidth: 750, minHeight: 280,
        center: true,
        resizable: true, minimizable: true, maximizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    mainWindow.loadFile(`${__dirname}/renderer/mainWindow.html`);

    mainWindow.on('closed', () => {
        mainWindow = null
    });

    mainWindow.on('close', (e) => {
        if (isConversionRunning) {
            const choiceIndex = dialog.showMessageBoxSync(mainWindow, {
                message: message('warning_running'),
                type: 'warning',
                title: message('warning'),
                detail: message('warning_running_detail'),
                buttons: [message('yes') ,message('no')],
                defaultId: 1,
                cancelId: 1,
                noLink: true
            });
            if (choiceIndex === 1) {
                e.preventDefault();
            }
        }
      });
}

function showOptionWindow() {
    optionWindow = new BrowserWindow({
        width: 600, height: 285,
        center: true,
        resizable: false, minimizable: false, maximizable: false,
        parent: mainWindow, modal: true, show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    optionWindow.loadFile(`${__dirname}/renderer/optionWindow.html`);

    optionWindow.on('closed', () => {
        optionWindow = null;
    });

    optionWindow.show();
}

app.on('ready', () => {
    require('./mainProcess');
    createMainWindow();

    ipcMain.on('showOptions', async (e) => {
        showOptionWindow();
    });

    ipcMain.on('setConversionRunning', async (e, conversionRunning) => {
        isConversionRunning = conversionRunning;
    });
});

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    } else {
        isConversionRunning = false;
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open
    if (mainWindow === null) {
        createMainWindow();
    }
});