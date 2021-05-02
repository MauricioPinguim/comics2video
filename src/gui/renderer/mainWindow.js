const { remote, ipcRenderer } = require('electron');
const { app, dialog, clipboard, shell } = remote;
const currentWindow = remote.getCurrentWindow();
const filedir = require('../../util/filedir');

const message = (messageId) => {
    return ipcRenderer.sendSync('getMessage', messageId);
}

const element = (elementId) => {
    return document.getElementById(elementId);
}

const setMessage = (elementId, messageId) => {
    element(elementId).textContent = message(messageId);
}

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const supportedFilesMessage = message('warning_unsupported');

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
    setEnabled(element('btnOpenFile'), enabled);
    setEnabled(element('btnOpenFolder'), enabled);
    setEnabled(element('btnPaste'), enabled);
    setEnabled(element('btnOptions'), enabled);
}

const getFileFolderSelection = (title, dialogStyle) => {
    const filterName = message('comics_books');
    
    let selection = dialog.showOpenDialogSync(currentWindow, {
        title: title,
        properties: [dialogStyle],
        filters: [
            { name: filterName, extensions: ['cbr', 'cbz', 'rar', 'zip'] }
        ]
    })

    if (selection && Array.isArray(selection) && selection.length > 0) {
        selection = selection[0];
    }
    return selection;
}

const setSource = (source) => {
    const lblSource = element('lblSource');
    if (source) {
        lblSource.textContent = source;
        lblSource.className = 'source-selection-value';

        setEnabled(element('btnStart'), true);
        btnStart.focus();
    } else {
        lblSource.textContent = message('none_selected');
        lblSource.className = 'source-selection-value-none';
        setEnabled(element('btnStart'), false);
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

const showWarningInvalidSource = (messageText) => {
    showAlert(messageText, message('warning'), supportedFilesMessage, 'warning');
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
    const title = message('open_file_title');
    const selection = getFileFolderSelection(title, 'openFile');

    if (selection) {
        if (filedir.isSelectedFileValid(selection)) {
            setSource(selection);
            setScrollBarVisible(false);
        }
        else {
            showWarningInvalidSource(message('invalid_file'));
        }
    }
}

const openFolder = () => {
    const title = message('open_folder_title');
    const selection = getFileFolderSelection(title, 'openDirectory');

    if (selection) {
        if (filedir.isSelectedFolderValid(selection)) {
            setSource(selection);
            setScrollBarVisible(true);
        } else {
            showWarningInvalidSource(message('invalid_folder'));
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

    showWarningInvalidSource(message('invalid_clipboard'), supportedFilesMessage);
}

const getLastElement = (className) => {
    const elements = element('tblProgressRows').getElementsByClassName(className);

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
        const templateRow = element('tblProgressRowsTemplate').rows[0];
        const newRow = templateRow.cloneNode(true);
        element('tblProgressRows').appendChild(newRow);
    }

    const progressFile = getLastElement('progress-file');
    const progressFilePart = getLastElement('progress-file-part');
    const progressStatus = getLastElement('progress-status');
    const progressStatusIcon = getLastElement('progress-status-icon');
    const progressImage = getLastElement('progress-image');
    const progressVideo = getLastElement('progress-video');
    const progressImagesLocation = getLastElement('progress-images-location');
    const progressVideoLocation = getLastElement('progress-video-location');

    progressFilePart.textContent = data.filePart;
    progressFile.textContent = data.file;

    progressStatus.textContent = data.status;
    showStatusIcon(progressStatusIcon, data.statusType);

    showProgressBarPercent(progressImage, data.percentImage);
    showProgressBarPercent(progressVideo, data.percentVideo);
    
    progressImagesLocation.textContent = data.imageDestinationFolder || '';
    progressVideoLocation.textContent = data.videoDestinationFile || '';

    previousFile = data.file;
    previousFilePart = data.filePart;
}

const showFileFolder = (location) => {
    try {
        shell.showItemInFolder(location);
    } catch {}
}

const showDestinationButtons = () => {
    const tblProgressRows = element('tblProgressRows');
    const imageLocations = tblProgressRows.getElementsByClassName('progress-images-location');
    const imageButtons = tblProgressRows.getElementsByClassName('progress-show-images');
    const videoLocations = tblProgressRows.getElementsByClassName('progress-video-location');
    const videoButtons = tblProgressRows.getElementsByClassName('progress-show-video');

    for (let i=0; i<imageLocations.length; i++) {
        const imageLocation = imageLocations[i].textContent;
        if (imageLocation) {
            setVisible(imageButtons[i], true)
            imageButtons[i].addEventListener('click', () => showFileFolder(imageLocation));
        }

        const videoLocation = videoLocations[i].textContent;
        if (videoLocation) {
            setVisible(videoButtons[i], true)
            videoButtons[i].addEventListener('click', () => showFileFolder(videoLocation));
        }
    }
}

const showProgressCompleted = (data) => {
    if (data.resultType === 'error') {
        showAlert(data.resultMessage, 'comics2video', '', data.resultType);
    } else {
        showDestinationButtons();
    }

    setButtonsEnabled(true);
    setSource();
}

const start = () => {
    setEnabled(element('btnStart'), false);
    setButtonsEnabled(false);
    element('tblProgressRows').innerHTML = '';
    setVisible(tblProgress, true);

    previousFile = '';
    previousFilePart = '';

    const source = element('lblSource').innerText;
    ipcRenderer.send('startConversion', source);
    ipcRenderer.send('setConversionRunning', true);
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
    ipcRenderer.send('setConversionRunning', false);
    showProgressCompleted(data);
});

const options = () => {
    ipcRenderer.send('showOptions');
}

const checkShortcutKeys = (e) => {
    const ctrlDown = e.ctrlKey || e.metaKey;

    if (ctrlDown && e.keyCode == 86) {
        if (!element('btnPaste').disabled) {
            element('btnPaste').click();
        }
    }
}

const setMessages = () => {
    setMessage('lblFolderLabel', 'file_folder');
    setMessage('lblSource', 'none_selected');
    setMessage('lblOpenFile', 'select_file');
    setMessage('lblOpenFolder', 'select_folder');
    setMessage('lblPasteFile', 'paste_file');
    setMessage('lblStart', 'start_conversion');
    setMessage('lblOptions', 'options');

    setMessage('lblHeaderFile', 'header_file');
    setMessage('lblHeaderStatus', 'header_status');
    setMessage('lblHeaderImages', 'header_images');
    setMessage('lblHeaderVideo', 'header_video');
    setMessage('lblShowImages', 'show');
    setMessage('lblShowVideo', 'show');
    setMessage('lblAboutProject', 'project');
    setMessage('lblAboutAuthor', 'contact');
}

const prepareWindow = () => {
    setMessages();

    element('lblAbout').textContent = 'v' + ipcRenderer.sendSync('getVersion');
    
    element('btnOpenFile').addEventListener('click', () => openFile());
    element('btnOpenFolder').addEventListener('click', () => openFolder());
    element('btnPaste').addEventListener('click', () => paste());
    element('btnStart').addEventListener('click', () => start());
    element('btnOptions').addEventListener('click', () => options());
    element('btnAbout').addEventListener('click', () => about());
    element('btnAboutProject').addEventListener('click', () => aboutProject());
    element('btnAboutAuthor').addEventListener('click', () => aboutAuthor());

    document.onkeydown = (e) => checkShortcutKeys(e);
}

prepareWindow();