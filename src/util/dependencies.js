const fs = require('fs');
const path = require('path');
const { log, enableFormattedLog } = require('../terminal/basicLog');

const availableFeatures = {
    nodeModules: false,
    basicDependencies: false,
    extractionFromZIP: false,
    extractionFromRAR: false,
    extractionFromPDF: false,
    videoGeneration: false,
    ocr: false,
    wizard: false,
    asciiTitle: false
}

const checkFormattedLog = () => {
    try {
        require('chalk');
        // Flag will be set in the log.js file to avoid circular reference when this file generate its own log entries
        enableFormattedLog();
    } catch { }
}

const checkExtractionFromZIP = () => {
    try {
        require('cross-unzip');
        require('win-7zip');
        availableFeatures.extractionFromZIP = true;
    } catch { }
}

const checkExtractionFromRAR = () => {
    try {
        require('unrar-promise');
        availableFeatures.extractionFromRAR = true;
    } catch { }
}

const checkExtractionFromPDF = () => {
    try {
        require('pdfjs-dist');
        availableFeatures.extractionFromPDF = true;
    } catch {}
}

const checkVideoGeneration = () => {
    try {
        require('ffmpeg-static');
        require('spawn-please');
        availableFeatures.videoGeneration = true;
    } catch {}
}

const checkOCR = () => {
    try {
        require('tesseract.js');
        availableFeatures.ocr = true;
    } catch {}
}

const checkWizard= () => {
    try {
        require('terminal-kit');
        availableFeatures.wizard = true;
    } catch { }
}

const checkASCIITitle= () => {
    try {
        require('figlet');
        availableFeatures.asciiTitle = true;
    } catch { }
}

const showInstallMessage = () => {
    log(`To install, run the following command in the comics2video root folder:`);
    log(`npm install\n`, 'warning');
}

const checkBasicDepencencies = () => {
    try {
        require('deltree');
        require('sharp');
        return true;
    } catch {
        return false;
    }
}

const checkDependenciesFolder = () => {
    const folder = path.join(__dirname, '../../node_modules');

    return availableFeatures.nodeModules = fs.existsSync(folder);
}

const showDependenciesMessage = () =>
{
    if (!availableFeatures.nodeModules) {
        log('\nAll the required module dependencies for comics2video are missing');
        showInstallMessage();
    } else if (!availableFeatures.basicDependencies) {
        log('\nThe basic required module dependencies for comics2video are missing', 'warning');
        showInstallMessage();
    }
}

const checkDependencies = () => {
    if (!checkDependenciesFolder()) {
        return false;
    }
    if (!checkBasicDepencencies()) {
        return false;
    }

    checkFormattedLog();
    checkExtractionFromZIP();
    checkExtractionFromRAR();
    checkExtractionFromPDF();
    checkVideoGeneration();
    checkOCR();
    
    checkWizard();
    checkASCIITitle();

    return true;
}

module.exports = {
    checkDependencies,
    showDependenciesMessage,
    availableFeatures
}