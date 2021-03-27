const { spawn } = require('child_process');
const path = require('path');
const filedir = require('../util/filedir');

/**
 * WARNING
 * The PDF extraction must run in a separated process. The extractor ('pdfjs-dist') uses 'Canvas' to render the PDF pages, which will later conflict with 'Sharp' on the step of adding text to the images
 * 
 * If the line "const Canvas = require('canvas');" is part of the main process, even if the processed file is not PDF, it will still make Sharp crash later, so do not run it in the same process linking with "module.exports ="
 * Instead, run in another process using command line parameters: node external_extractPDF.js file.PDF destinationFolder
 */
const extractFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
        const fullfilePath = path.join(__dirname, 'external_extractPDF.js')
        const process = spawn('node', [fullfilePath, file.source, file.tempFolders.pages]);
        process.on('exit', (code) => {
            if (code === 2) {
                resolve();
            } else {
                reject();
            }
        });
        process.on('error', (error) => {
            reject();
        });
    })
}

const extractFile = async (processData) => {
    const { file } = processData.getCurrentData();
    try {
        processData.progress({ action: `Extracting file` });

        if (filedir.isZIP(file.source)) {
            await require('./extractZIP').extract(file);
        } else if (filedir.isRAR(file.source)) {
            await require('./extractRAR').extract(file);
        } else {
            await extractFromPDF(file);
        }

        file.tempFolders.pages = filedir.tryFindSubFolder(file.tempFolders.pages);

        return true;
    } catch {
        return false;
    }
}

module.exports = { extractFile }