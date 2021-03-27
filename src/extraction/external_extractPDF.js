/**
 * WARNING
 * The PDF extraction must run in a separated process. The extractor ('pdfjs-dist') uses 'Canvas' to render the PDF pages, which will later conflict with 'Sharp' on the step of adding text to the images
 * 
 * If the line "const Canvas = require('canvas');" is part of the main process, even if the processed file is not PDF, it will still make Sharp crash later, so do not run it in the same process linking with "module.exports ="
 * Instead, run in another process using command line parameters: node external_extractPDF.js file.PDF destinationFolder
 */
const assert = require('assert').strict;
const Canvas = require('canvas');
const fs = require('fs');
const path = require('path')
const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js');
const params = require('../params');

const CMAP_URL = './../../../node_modules/pdfjs-dist/cmaps/';
const CMAP_PACKED = true;
function NodeCanvasFactory() { };

NodeCanvasFactory.prototype = {
    create: function NodeCanvasFactory_create(width, height) {
        assert(width > 0 && height > 0, "Invalid canvas size");
        const canvas = Canvas.createCanvas(width, height);
        const context = canvas.getContext("2d");
        return {
            canvas,
            context,
        };
    },

    reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
        assert(canvasAndContext.canvas, "Canvas is not specified");
        assert(width > 0 && height > 0, "Invalid canvas size");
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    },

    destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
        assert(canvasAndContext.canvas, "Canvas is not specified");
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    },
};

const getScaleRatio = (contentWidth, contentHeight) => {
    const targetWidth = (contentWidth < contentHeight) ? params.systemParams.screenWidth : params.systemParams.screenDoublePageWidth;
    const scaleRatio = targetWidth / contentWidth;

    return scaleRatio > 1 ? scaleRatio : 1;
}

const extractPage = async (document, pageNumber, destinationFolder) => {
    return new Promise((resolve, reject) => {
        document.getPage(pageNumber).then(page => {
            if (!page || !page.view[2] || !page.view[3]) {
                reject();
            }

            const scaleRatio = getScaleRatio(page.view[2], page.view[3]);
            const viewport = page.getViewport({ scale: scaleRatio });
            const canvasFactory = new NodeCanvasFactory();

            const canvasAndContext = canvasFactory.create(
                viewport.width,
                viewport.height
            );
            const renderContext = {
                canvasContext: canvasAndContext.context,
                viewport,
                canvasFactory,
            };

            page.render(renderContext).promise.then(() => {
                const imageBuffer = canvasAndContext.canvas.toBuffer();
                const imageFileName = `PAGE_${pageNumber.toString().padStart(3, '0')}.jpg`;

                fs.writeFileSync(path.join(destinationFolder, imageFileName), imageBuffer);
                resolve();
            });
        }).catch(error => {
            reject();
        });
    });
}

const getPDF = async (documentFile) => {
    return new Promise((resolve, reject) => {
        const fileData = new Uint8Array(fs.readFileSync(documentFile));

        pdfjsLib.getDocument({
            data: fileData,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED,
            disableFontFace: false
        }).promise.then(pdfDocument => {
            resolve(pdfDocument);
        }).catch(error => {
            reject();
        });
    });
}

const getPageNumbers = (pageTotal) => Array.from({ length: pageTotal }, (_, index) => index + 1);

const extractFromPDF = async (documentFile, destinationFolder) => {
    const pdfDocument = await getPDF(documentFile);

    for (const pageNumber of getPageNumbers(pdfDocument.numPages)) {
        try {
            await extractPage(pdfDocument, pageNumber, destinationFolder);
        } catch { }
    }
}

const extractParams = (args) => {
    if (args.length < 4) {
        return { isValid: false };
    }
    const pdfFile = args[2];
    const targetFolder = args[3];

    if (!fs.existsSync(pdfFile)) {
        return false;
    }
    if (!fs.existsSync(targetFolder) || !fs.lstatSync(targetFolder).isDirectory()) {
        return false;
    }

    return {
        isValid: true,
        pdfFile,
        targetFolder
    }
}

const main = async () => {
    try {
        var params = extractParams(process.argv);
        if (!params.isValid) {
            return 3;
        }

        await extractFromPDF(params.pdfFile, params.targetFolder);
        return 2;
    } catch {
        return 9;
    }

}

// As explained at the beginning of this file, the entry point must be command line arguments, do not use module.exports here
main().then(exitCode => {
    process.exit(exitCode);
});