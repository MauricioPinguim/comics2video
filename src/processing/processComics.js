const params = require('../params');
const filedir = require('../util/filedir');
const duration = require('../video/duration');
const processFile = require('./processFile');
const ocrTesseract = require('../ocr/ocrTesseract');
const message = require('../messages/message');

const initialize = async (processData) => {
    // Must set this folder to prevent Tesseract.js from creating the Trained data file elsewhere    
    filedir.setCurrentWorkingDirectory();

    await ocrTesseract.initializeOCR();

    if (params.userParams.generateVideo) {
        processData.durationDefinition = duration.getDurationDefinition();
    }
}

const terminateOCR = async () => {
    await ocrTesseract.tryTerminateOCR();
}

const process = async (processData) => {
    try {
        filedir.findSourceFiles(processData);

        await initialize(processData);

        if (processData.files.length === 0) {
            return processData.finishProcess(message('no_valid_files'), `error`);
        }

        while (processData.selectNextFile()) {
            await processFile.process(processData);
        }

        await processData.finishProcess(message('conversion_finished'), `info`);
    }
    catch (error) {
        await processData.finishProcess(`${message('unexpected_error')} - ${error}`, `error`);
    } finally {
        await terminateOCR();
    }
}

module.exports = { process }