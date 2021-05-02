module.exports = class ProgressData {
    constructor() {
        this.file = '';
        this.filePart = '';
        this.status = '';
        this.statusType = '';
        this.percentImage = 0;
        this.percentVideo = 0;
        this.imageDestinationFolder = '';
        this.videoDestinationFile = '';
    }

    toString() {
        let result = `${this.file}`
        result += this.filePart ? ` | ${this.filePart}` : '';
        result += ` | ${this.statusType}: ${this.status}`;
        result += ` | images=${Math.floor(this.percentImage * 10, 1) / 10}%,`;
        result += ` video=${Math.floor(this.percentVideo * 10, 1) / 10}%`;

        return result;
    }

    update(updatedFields) {
        if (updatedFields.file != undefined) {
            this.file = updatedFields.file;
        }
        if (updatedFields.filePart != undefined) {
            this.filePart = updatedFields.filePart;
        }
        if (updatedFields.status != undefined) {
            this.status = updatedFields.status;
        }
        if (updatedFields.statusType != undefined) {
            this.statusType = updatedFields.statusType;
        }
        if (updatedFields.percentImage != undefined) {
            this.percentImage = updatedFields.percentImage;
        }
        if (updatedFields.percentVideo != undefined) {
            this.percentVideo = updatedFields.percentVideo;
        }
        if (updatedFields.imageDestinationFolder != undefined) {
            this.imageDestinationFolder = updatedFields.imageDestinationFolder;
        }
        if (updatedFields.videoDestinationFile != undefined) {
            this.videoDestinationFile = updatedFields.videoDestinationFile;
        }
    }
}