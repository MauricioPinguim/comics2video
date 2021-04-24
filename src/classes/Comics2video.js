/**
 * comics2video - Converts Comic Book files to videos
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const EventEmitter = require('events');
const ProgressData = require('./ProgressData');
const params = require('../params');
const processComics = require('../processing/processComics');

module.exports = class Comics2video extends EventEmitter {
    constructor(source, paramValues = {}) {
        super();
        this.source = source;
        this.files = [];
        this.currentFileIndex = -1;
        this.progressData = new ProgressData();

        if (!source) {
            throw new Error('Source parameter must be provided');
        }

        params.setParamValues(paramValues);
    }

    async start() {
        await processComics.process(this);
    }

    progress(updatedFields) {
        this.progressData.update(updatedFields);
        this.emit('progressUpdated', this.progressData);
    }

    increasePercentImage(increaseValue) {
        this.progressData.percentImage += increaseValue;
        this.emit('progressUpdated', this.progressData);
    }

    increasePercentVideo(increaseValue) {
        this.progressData.percentVideo += increaseValue;
        if (this.progressData.percentVideo >= 100) {
            // Before show 100%, stay on 99.9% for the step of writing the final video file
            this.progressData.percentVideo = 99.9;
        }
        this.emit('progressUpdated', this.progressData);
    }

    finishProcess(resultMessage, resultType) {
        const resultData = {
            resultMessage,
            resultType
        }
        this.emit('processCompleted', resultData);
    }

    currentFile() {
        return this.files[this.currentFileIndex];
    }

    deselectFile() {
        this.currentFileIndex = -1;
    }

    selectNextFile() {
        if (this.files.length > 0 && this.currentFileIndex < this.files.length - 1) {
            this.currentFileIndex++;
            this.currentFile().currentFilePartIndex = -1;
            return true;
        }
        return false;
    }

    getCurrentData() {
        const file = this.currentFile();
        const filePart = file ? file.currentFilePart() : null;
        const page = filePart ? filePart.currentPage() : null;
        const frame = page ? page.currentFrame() : null;

        return {
            file,
            filePart,
            page,
            frame
        }
    }
}