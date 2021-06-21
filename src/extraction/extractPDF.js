const { Poppler } = require("node-poppler");
const path = require('path');

const extract = async (file) => {
    const output = path.join(file.tempFolders.pages, 'page');
    const poppler = new Poppler();
    const options = {
        jpegFile: true,
    };

    await poppler.pdfToCairo(file.source, output, options);
}

module.exports = { extract }