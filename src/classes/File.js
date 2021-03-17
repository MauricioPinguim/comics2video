module.exports = class File {
    constructor(source) {
        this.source = source;
        this.fileParts = [];
        this.currentFilePartIndex = -1;
    }

    currentFilePart() {
        return this.fileParts[this.currentFilePartIndex];
    }

    selectNextFilePart() {
        if (this.fileParts.length > 0 && this.currentFilePartIndex < this.fileParts.length - 1) {
            this.currentFilePartIndex++;
            this.currentFilePart().currentPageIndex = -1;
            return true;
        }
        return false;
    }
}