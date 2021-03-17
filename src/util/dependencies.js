const fs = require('fs');
const path = require('path');
const { log, logTypes, enableFormattedLog } = require('./log');

const availableFeatures = {
    extractionFromZIP: false,
    extractionFromRAR: false,
    extractionFromPDF: false,
    videoGeneration: false,
    ocr: false
}

const disabledFeatureMessages = [];

const checkFormattedLog = () => {
    try {
        require('chalk');
        // Flag will be set in the log.js file to avoid circular reference when this file generate its own log entries
        enableFormattedLog();
    } catch {
        // No alert, log entries will still be generated without format
    }
}

const checkExtractionFromZIP = () => {
    try {
        require('cross-unzip');
        require('win-7zip');
        availableFeatures.extractionFromZIP = true;
    } catch {
        disabledFeatureMessages.push('Extraction from CBZ/ZIP files');
    }
}

const checkExtractionFromRAR = () => {
    try {
        require('unrar-promise');
        availableFeatures.extractionFromRAR = true;
    } catch {
        disabledFeatureMessages.push('Extraction from CBR/RAR files');
    }
}

const checkExtractionFromPDF = () => {
    try {
        require('pdfjs-dist');
        availableFeatures.extractionFromPDF = true;
    } catch {
        disabledFeatureMessages.push('Extraction from PDF files');
    }
}

const checkVideoGeneration = () => {
    try {
        require('ffmpeg-static');
        require('spawn-please');
        availableFeatures.videoGeneration = true;
    } catch {
        disabledFeatureMessages.push('Video generation');
    }
}

const checkOCR = () => {
    try {
        require('tesseract.js');
        availableFeatures.ocr = true;
    } catch {
        disabledFeatureMessages.push('OCR (a fixed default duration will be applied to all frames)');
    }
}

const showInstallMessage = () => {
    log(`To install, run the following command in the comics2video root folder:`, 1);
    log(`npm install\n`, 1, logTypes.Warning)
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

    return fs.existsSync(folder);
}

const checkDependencies = () => {
    if (!checkDependenciesFolder()) {
        log('\nAll the required module dependencies for comics2video are missing');
        showInstallMessage();
        return false;
    }

    checkFormattedLog();

    if (!checkBasicDepencencies()) {
        log('\nThe basic required module dependencies for comics2video are missing', 1, logTypes.Warning);
        showInstallMessage();
        return false;
    }

    checkExtractionFromZIP();
    checkExtractionFromRAR();
    checkExtractionFromPDF();
    checkVideoGeneration();
    checkOCR();

    if (disabledFeatureMessages.length > 0) {
        log('\nSome required module dependencies for comics2video are missing and the following features will be disabled:', 1);
        for (const message of disabledFeatureMessages) {
            log(message, 2, logTypes.Warning);
        }
        showInstallMessage();
    }
    return true;
}

module.exports = {
    checkDependencies,
    availableFeatures
}