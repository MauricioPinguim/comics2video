const imageUtil = require('../image/imageProcessing');

module.exports = class Page {
    constructor(source) {
        this.source = source;
        this.frames = [];
        this.currentFrameIndex = -1;
    }

    async fillSize() {
        const sizeData = await imageUtil.getSizeData(this.source);
        if (sizeData) {
            this.width = sizeData.width;
            this.height = sizeData.height;
        }
    }

    isValidSize() {
        return this.width && this.height;
    }

    currentFrame() {
        return this.frames[this.currentFrameIndex];
    }

    selectNextFrame() {
        if (this.frames.length > 0 && this.currentFrameIndex < this.frames.length - 1) {
            this.currentFrameIndex++;
            return true;
        }
        return false;
    }
}