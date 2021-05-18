const { app, ipcMain } = require('electron');
const { userParams, contentProfiles, readingSpeeds } = require('../params');
const Comics2video = require('../classes/Comics2video');
const message = require('../messages/message');
const log = require('../terminal/basicLog');

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
// Electron may not be able to get version directly from package.json
const appVersion = '2.1.1';

const checkPlatform = () => {
    if (!isWindows && !isMac) {
        // In Linux, some modules used by comics2video don't work properly inside a Electron App
        log('\nWarning: The Electron GUI for comics2video is compatible only with Windows and macOS\n');
        process.exit(0);
    }
}

const setApp = () => {
    userParams.messageLanguage = app.getLocale();
    
    checkPlatform();

    app.setName('comics2video');

    const lineBreak = !isMac ? '\n' : '';

    const version = message('version');
    const projectAuthor = message('project_author');

    app.setAboutPanelOptions({
        applicationName: 'comics2video',
        applicationVersion: `${lineBreak}${!isMac ? `${version} ` : ''}${appVersion}`,
        copyright: `${lineBreak}${projectAuthor} Maurício Antunes Oliveira`,
        version: appVersion,
    })
}

ipcMain.on('startConversion', async (e, source) => {
    try {
        const comicsConversion = new Comics2video(source);

        comicsConversion.on('progressUpdated', (data) => {
            if (e && e.sender) {
                e.sender.send('progressUpdated', data);
            }
        });

        comicsConversion.on('processCompleted', (data) => {
            if (e && e.sender) {
                e.sender.send('processCompleted', data);
            }
        });

        (async () => {
            await comicsConversion.start();
        })();
    } catch { }
});

ipcMain.on('getUserParams', async (e) => {
    e.returnValue = {
        userParams,
        contentProfiles,
        readingSpeeds
    }
});

ipcMain.on('setUserParams', async (e, values) => {
    userParams.generateVideo = values.generateVideo;
    userParams.contentProfile = values.contentProfile;
    userParams.readingSpeed = values.readingSpeed;
});

ipcMain.on('getMessage', async (e, messageId) => {
    e.returnValue = message(messageId);
});

ipcMain.on('getVersion', async (e) => {
    e.returnValue = appVersion;
});

setApp();