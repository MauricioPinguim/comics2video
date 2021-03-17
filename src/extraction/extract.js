const { spawn } = require('child_process');
const path = require('path');
const filedir = require('../util/filedir');
const { log, logTypes } = require('../util/log');

/**
 * WARNING
 * The PDF extraction must run in a separated process. The extractor ('pdfjs-dist') uses 'Canvas' to render the PDF pages, wich will later conflict with 'Sharp' at the step of adding text to the images
 * 
 * If the line "const Canvas = require('canvas');" is part of the main process, even if the processed file is not PDF, it will still make Sharp crash later, so don´t run in the same process linking with "module.exports = "
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
                reject(`Unable to extract PDF file '${file.source}'`);
            }
        });
        process.on('error', (error) => {
            reject(`Unable to exctact PDF file '${file.source}'`);
        });
    })
}

const extractFile = async (file) => {
    log(`Extracting file`, 2);

    if (filedir.isZIP(file.source)) {
        await require('./extractZIP').extract(file);
    } else if (filedir.isRAR(file.source)) {
        await require('./extractRAR').extract(file);
    } else {
        await extractFromPDF(file);
    }

    file.tempFolders.pages = filedir.tryFindSubFolder(file.tempFolders.pages);
}

module.exports = { extractFile }