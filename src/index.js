/**
 * comics2video - Converts Comic Book files to videos to be watched on TV/Video players
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const ProcessData = require('./classes/ProcessData');
const processFile = require('./processing/processFile');
const dependencies = require('./util/dependencies');
const filedir = require('./util/filedir');
const { log, logTypes } = require('./util/log');
const duration = require('./video/duration');
const params = require('./params');

const initialize = async (processData) => {
    // Must set this folder to prevent Tesseract.js from creating the Trained data file elsewhere    
    filedir.setCurrentWorkingDirectory();
    
    if (dependencies.availableFeatures.ocr) {
        await require('./ocr/ocrTesseract').initializeOCR();
    }

    if (params.userParams.generateVideo) {
        processData.durationDefinition = duration.getDurationDefinition();
    }
}

const showResultSummary = (processData) => {
    processData.endTime = new Date();
    processData.elapsedMinutes = ((processData.endTime - processData.startTime) / 60000).toFixed(1);

    log('\nProcess summary', 1);

    for (const file of processData.files) {
        if (!file.startedOK) {
            log(`File '${file.source}' not processed due to errors`, 2, logTypes.Error);
        } else if (!file.completedOK) {
            log(`File '${file.source}' processed, with errors`, 2, logTypes.Error);
        } else {
            log(`File '${file.source}' processed successfully`, 2, logTypes.Success);
        }
    }

    log(`comics2video process completed in ${processData.elapsedMinutes} minutes\n`, 1);
}

const process = async (source, paramValues = {}) => {
    if (!source) {
        throw new Error('Source parameter must be provided');
    }

    dependencies.checkDependencies();
    params.setParamValues(paramValues);

    try {
        log('\ncomics2video started - analysing input files      ', 1); // Extra spaces to clear Terminal Wizard text
        const processData = new ProcessData(source);
        processData.startTime = new Date();
        filedir.findSourceFiles(processData);

        await initialize(processData);

        if (processData.files.length === 0) {
            return log(`No valid Comic Book files to be processed`, 1, logTypes.Warning);
        }
        log(`Ready to process ${processData.files.length} Comic Book file(s)`, 1);

        while (processData.selectNextFile()) {
            await processFile.process(processData);
        }

        showResultSummary(processData);
    }
    catch (error) {
        throw new Error(`Unexpected Error - ${error}`);
    } finally {
        if (dependencies.availableFeatures.ocr) {
            await require('./ocr/ocrTesseract').tryTerminateOCR();
        }
    }
}

module.exports = { process }