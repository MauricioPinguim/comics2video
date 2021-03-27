const params = require('../params');
const dependencies = require('../util/dependencies');
const filedir = require('../util/filedir');
const duration = require('../video/duration');
const processFile = require('./processFile');

const initialize = async (processData) => {
    // Must set this folder to prevent Tesseract.js from creating the Trained data file elsewhere    
    filedir.setCurrentWorkingDirectory();

    if (dependencies.availableFeatures.ocr) {
        await require('../ocr/ocrTesseract').initializeOCR();
    }

    if (params.userParams.generateVideo) {
        processData.durationDefinition = duration.getDurationDefinition();
    }
}

const finishProcess = async (processData) => {
    if (dependencies.availableFeatures.ocr) {
        await require('../ocr/ocrTesseract').tryTerminateOCR();
    }

    processData.finishProcess();
}

const process = async (processData) => {
    try {
        filedir.findSourceFiles(processData);

        await initialize(processData);

        if (processData.files.length === 0) {
            return processData.error(`No valid Comic Book files to be processed`);
        }

        while (processData.selectNextFile()) {
            await processFile.process(processData);
        }
    }
    catch (error) {
        processData.error(`Unexpected Error - ${error}`);
    } finally {
        await finishProcess(processData);
    }
}

module.exports = { process }