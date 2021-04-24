const { remote, ipcRenderer } = require('electron');
const { app, dialog, clipboard, shell } = remote;
const currentWindow = remote.getCurrentWindow();
const filedir = require('../../util/filedir');

const lblSource = document.getElementById('lblSource');
const btnOpenFile = document.getElementById('btnOpenFile');
const btnOpenFolder = document.getElementById('btnOpenFolder');
const btnPaste = document.getElementById('btnPaste');
const btnOptions = document.getElementById('btnOptions');
const btnStart = document.getElementById('btnStart');
const tblProgressRows = document.getElementById('tblProgressRows');
const tblProgressRowsTemplate = document.getElementById('tblProgressRowsTemplate');
const btnAbout = document.getElementById('btnAbout');
const btnAboutProject = document.getElementById('btnAboutProject');
const btnAboutAuthor = document.getElementById('btnAboutAuthor');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const supportedFilesMessage = 'The supported Comic Book files are:\n• CBR\n• CBZ\n• Page images compressed in .RAR or .ZIP';

let previousFile, previousFilePart;

const setVisible = (element, visible) => {
    if (!visible) {
        element.classList.add('invisible');
    } else {
        element.classList.remove('invisible');
    }
}

const setEnabled = (element, enabled) => {
    let className = 'btn-default';
    if (element.id === 'btnStart') {
        className = 'btn-positive';
    }

    if (enabled) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
    element.disabled = !enabled;
}

const setButtonsEnabled = (enabled) => {
    setEnabled(btnOpenFile, enabled);
    setEnabled(btnOpenFolder, enabled);
    setEnabled(btnPaste, enabled);
    setEnabled(btnOptions, enabled);
}

const getFileFolderSelection = (title, dialogStyle) => {
    let selection = dialog.showOpenDialogSync(currentWindow, {
        title: title,
        properties: [dialogStyle],
        filters: [
            { name: 'Comic Books', extensions: ['cbr', 'cbz', 'rar', 'zip'] }
        ]
    })

    if (selection && Array.isArray(selection) && selection.length > 0) {
        selection = selection[0];
    }
    return selection;
}

const setSource = (source) => {
    if (source) {
        lblSource.textContent = source;
        lblSource.className = 'source-selection-value';

        setEnabled(btnStart, true);
        btnStart.focus();
    } else {
        lblSource.textContent = '(None selected)';
        lblSource.className = 'source-selection-value-none';
        setEnabled(btnStart, false);
    }
}

const showAlert = (message, title, detail, type) => {
    dialog.showMessageBoxSync(currentWindow, {
        message,
        type,
        title,
        detail,
    });
}

const showWarningInvalidSource = (message) => {
    showAlert(message, 'Warning', supportedFilesMessage, 'warning');
}

const setScrollBarVisible = (visible) => {
    if (visible) {
        document.body.classList.add('scroll-vertical');
        setVisible(document.querySelector('footer'), false);
    } else {
        document.body.classList.remove('scroll-vertical');
        setVisible(document.querySelector('footer'), true);
    }
}

const openFile = () => {
    const selection = getFileFolderSelection('Select Comic Book file', 'openFile');

    if (selection) {
        if (filedir.isSelectedFileValid(selection)) {
            setSource(selection);
            setScrollBarVisible(false);
        }
        else {
            showWarningInvalidSource('Invalid file selected');
        }
    }
}

const openFolder = () => {
    const selection = getFileFolderSelection('Select folder containing Comic Book Files', 'openDirectory');

    if (selection) {
        if (filedir.isSelectedFolderValid(selection)) {
            setSource(selection);
            setScrollBarVisible(true);
        } else {
            showWarningInvalidSource('No valid Comic Book was found on selected folder');
        }
    }
}

const getClipboardContent = () => {
    try {
        if (isWindows) {
            value = clipboard.read('FileNameW');
            if (value) {
                return value.replace(new RegExp(String.fromCharCode(0), 'g'), '');
            }
        } else if (isMac) {
            value = decodeURI(clipboard.read('public.file-url'));
            if (value) {
                return value.replace('file://', '');
            }
        }
    }
    catch {
        return null;
    }
}

const paste = () => {
    const value = getClipboardContent();

    if (value && filedir.entryExists(value)) {
        if (filedir.isFile(value)) {
            if (filedir.isSelectedFileValid(value)) {
                setSource(value);
                setScrollBarVisible(false);
                return;
            }
        }
    }

    showWarningInvalidSource('No valid Comic Book File was copied to Clipboard', supportedFilesMessage);
}

const getLastElement = (className) => {
    const elements = document.getElementsByClassName(className);

    if (elements && elements.length > 0) {
        return elements[elements.length - 1];
    }
}

const showStatusIcon = (element, statusType) => {
    const baseClasses = 'progress-status-icon icon icon-normal';

    let icon, color;
    switch (statusType) {
        case 'error':
            icon = 'icon-cancel';
            color = 'icon-color-error';
            break;
        case 'folder':
            icon = 'icon-folder';
            color = 'icon-color-normal';
            break;
        case 'image':
            icon = 'icon-picture';
            color = 'icon-color-normal';
            break;
        case 'video':
            icon = 'icon-video';
            color = 'icon-color-normal';
            break;
        case 'wait':
            icon = 'icon-hourglass';
            color = 'icon-color-normal';
            break;
        case 'success':
            icon = 'icon-check';
            color = 'icon-color-success';
            break;
    }

    element.className = `${baseClasses} ${icon} ${color}`;
}

const showProgressBarPercent = (element, percent) => {
    if (percent > 0 && percent < 100) {
        setVisible(element, true);
        element.value = percent;
    } else {
        setVisible(element, false);
    }
}

const isNewRow = (data) => {
    if (data.file != previousFile) {
        return true;
    }
    if (previousFilePart && data.filePart != previousFilePart) {
        return true;
    }
}

const showProgress = (data) => {
    if (isNewRow(data)) {
        const templateRow = tblProgressRowsTemplate.rows[0];
        const newRow = templateRow.cloneNode(true);
        tblProgressRows.appendChild(newRow);
    }

    const progressFile = getLastElement('progress-file');
    const progressFilePart = getLastElement('progress-file-part');
    const progressStatus = getLastElement('progress-status');
    const progressStatusIcon = getLastElement('progress-status-icon');
    const progressImage = getLastElement('progress-image');
    const progressVideo = getLastElement('progress-video');

    progressFilePart.textContent = data.filePart;
    progressFile.textContent = data.file;

    progressStatus.textContent = data.status;
    showStatusIcon(progressStatusIcon, data.statusType);

    showProgressBarPercent(progressImage, data.percentImage);
    showProgressBarPercent(progressVideo, data.percentVideo);

    previousFile = data.file;
    previousFilePart = data.filePart;
}

const showProgressCompleted = (data) => {
    if (data.resultType === 'error') {
        showAlert(data.resultMessage, 'comics2video', '', data.resultType);
    }

    setButtonsEnabled(true);
    setSource();
}

const start = () => {
    setEnabled(btnStart, false);
    setButtonsEnabled(false);
    tblProgressRows.innerHTML = '';
    setVisible(tblProgress, true);

    previousFile = '';
    previousFilePart = '';

    const source = lblSource.innerText;
    ipcRenderer.send('startConversion', source);
}

const about = () => {
    app.showAboutPanel();
}

const aboutProject = () => {
    shell.openExternal('https://github.com/MauricioPinguim/comics2video#readme');
}

const aboutAuthor = () => {
    shell.openExternal('https://twitter.com/MauricioPinguim');
}

ipcRenderer.on('progressUpdated', async (e, data) => {
    showProgress(data);
});

ipcRenderer.on('processCompleted', async (e, data) => {
    showProgressCompleted(data);
});

const options = () => {
    ipcRenderer.send('showOptions');
}

const checkShortcutKeys = (e) => {
    const ctrlDown = e.ctrlKey || e.metaKey;

    if (ctrlDown && e.keyCode == 86) {
        if (!btnPaste.disabled) {
            btnPaste.click();
        }
    }
}

const setEvents = () => {
    btnOpenFile.addEventListener('click', () => openFile());
    btnOpenFolder.addEventListener('click', () => openFolder());
    btnPaste.addEventListener('click', () => paste());
    btnStart.addEventListener('click', () => start());
    btnOptions.addEventListener('click', () => options());
    btnAbout.addEventListener('click', () => about());
    btnAboutProject.addEventListener('click', () => aboutProject());
    btnAboutAuthor.addEventListener('click', () => aboutAuthor());

    document.onkeydown = (e) => checkShortcutKeys(e);
}

setEvents();