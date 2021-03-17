module.exports = class ProcessData {
    constructor(source) {
        this.source = source;
        this.files = [];
        this.currentFileIndex = -1;
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