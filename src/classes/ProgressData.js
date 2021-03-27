module.exports = class ProgressData {
    constructor() {
        this.file = '';
        this.filePart = '';
        this.element = '';
        this.page = '';
        this.frame = '';
        this.action = '';

        this.percent = 0;
    }

    toString(levelSeparator = ' \\ ', actionSeparator = ' ► ') {
        let result = '';

        result += this.file ? this.file : '';
        result += this.filePart ? levelSeparator + this.filePart : '';
        result += this.element ? levelSeparator + this.element : '';
        result += this.page ? levelSeparator + this.page : '';
        result += this.frame ? levelSeparator + this.frame : '';
        result += this.action ? actionSeparator + this.action : '';

        result += `  ${Math.floor(this.percent * 10, 1) / 10}%`;

        return result;
    }

    update(updatedFields) {
        if (updatedFields.file) {
            this.file = updatedFields.file;
            this.clearAfter(1);
        }
        if (updatedFields.filePart) {
            this.filePart = updatedFields.filePart;
            this.clearAfter(2);
        }
        if (updatedFields.element) {
            this.element = updatedFields.element;
            this.clearAfter(3);
        }
        if (updatedFields.page) {
            this.page = updatedFields.page;
            this.clearAfter(4);
        }
        if (updatedFields.frame) {
            this.frame = updatedFields.frame;
            this.clearAfter(5);
        }
        if (updatedFields.action) {
            this.action = updatedFields.action;
        }
        if (updatedFields.percent) {
            this.percent = updatedFields.percent;
        }
    }

    clearAfter(level) {
        if (level <= 1) {
            this.filePart = '';
        }
        if (level <= 2) {
            this.element = '';
        }
        if (level <= 3) {
            this.page = '';
        }
        if (level <= 4) {
            this.frame = '';
        }
        this.action = '';
    }
}