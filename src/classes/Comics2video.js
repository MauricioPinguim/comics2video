/**
 * comics2video - Converts Comic Book files to videos to be watched on TV/Video players
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const EventEmitter = require('events');
const params = require('../params');
const dependencies = require('../util/dependencies');
const ProgressData = require('./ProgressData');

module.exports = class Comics2video extends EventEmitter {
    constructor(source, paramValues = {}) {
        super();
        this.source = source;
        this.files = [];
        this.currentFileIndex = -1;
        this.progressPercent = 0;
        this.progressData = new ProgressData();
        this.summary = {
            messages: []
        }

        if (!source) {
            throw new Error('Source parameter must be provided');
        }

        params.setParamValues(paramValues);
    }

    async start() {
        this.summary.startTime = new Date();
        if (!dependencies.checkDependencies()) {
            this.error(`comics2video dependencies not installed, run 'npm install' on root directory`);
            this.finishProcess();
        } else {
            await require('../processing/processComics').process(this);
        }
    }

    success(message) {
        this.summary.messages.push({
            message,
            messageType: 'success'
        });
    }

    warning(message) {
        this.summary.messages.push({
            message,
            messageType: 'warning'
        });
    }

    error(message) {
        this.summary.messages.push({
            message,
            messageType: 'error'
        });
    }

    progress(updatedFields) {
        this.progressData.percent = this.progressPercent;
        this.progressData.update(updatedFields);

        this.emit('progressUpdated', this.progressData);
    }

    finishProcess() {
        this.summary.endTime = new Date();
        this.summary.elapsedMinutes = ((this.summary.endTime - this.summary.startTime) / 60000).toFixed(1);
        this.emit('processCompleted', this.summary);
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