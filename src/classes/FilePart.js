module.exports = class FilePart {
    constructor(file, partNumber) {
        this.partNumber = partNumber;
        this.pages = [];
        this.currentPageIndex = -1;
        this.isMultiPart = file.isMultiPart;
        this.title = file.title;
        this.videoSequence = [];

        if (file.isMultiPart) {
            this.partTitle = `Part ${partNumber.toString().padStart(2, '0')}`;
            this.videoFile = `${file.formattedTitle} - ${this.partTitle}`;
        } else {
            this.partTitle = '';
            this.videoFile = file.formattedTitle;
        }
    }

    currentPage() {
        return this.pages[this.currentPageIndex];
    }

    deselectPage() {
        this.currentPageIndex = -1;
    }

    selectNextPage() {
        if (this.pages.length > 0 && this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.currentPage().currentFrameIndex = -1;
            return true;
        }
        return false;
    }
}