const FilePart = require('../classes/FilePart');
const Page = require('../classes/Page');
const cover = require('../image/cover.js');
const extract = require('../extraction/extract');
const filedir = require('../util/filedir');
const { log, logTypes } = require('../util/log');
const params = require('../params');
const processFilePart = require('./processFilePart');

const analyzePages = async (file) => {
    const sourcePages = filedir.getImagesFiles(file.tempFolders.pages)
        .map(file => new Page(file))

    for (const page of sourcePages) {
        await page.fillSize();
    }

    file.sourcePages = sourcePages.filter(page => page.isValidSize());
}

const addPages = (processData, filePart) => {
    const { file } = processData.getCurrentData();
    filePart.firstPage = ((filePart.number - 1) * params.systemParams.pagesPerFilePart) + 1;
    filePart.lastPage = filePart.isLastPart ? file.sourcePages.length : filePart.number * params.systemParams.pagesPerFilePart;

    filePart.pages = file.sourcePages.slice(filePart.firstPage - 1, filePart.lastPage);

    let pageNumber = filePart.firstPage;
    for (const page of filePart.pages) {
        page.number = pageNumber;
        page.name = pageNumber.toString().padStart(3, '0');
        page.title = pageNumber + '/' + file.sourcePages.length;
        pageNumber++;
    }

    cover.addCoverPages(filePart);
}

const addFileParts = async (processData) => {
    const { file } = processData.getCurrentData();
    file.isMultiPart = file.sourcePages.length > params.systemParams.maximumPagesWithoutSplit;
    file.filePartsTotal = file.isMultiPart ? Math.ceil(file.sourcePages.length / params.systemParams.pagesPerFilePart) : 1;

    for (let filePartNumber = 1; filePartNumber <= file.filePartsTotal; filePartNumber++) {
        const filePart = new FilePart(file, filePartNumber);

        filePart.number = filePartNumber;
        filePart.imageDestinationFolder = filedir.prepareImageDestinationFolder(file, filePart);
        filePart.isLastPart = (filePartNumber === file.filePartsTotal);

        addPages(processData, filePart);

        file.fileParts.push(filePart);
    }
}

const removeTempFolder = (processData) => {
    const { file } = processData.getCurrentData();
    try {
        if (file.tempFolderCreated && !params.systemParams.keepTempFolder) {
            filedir.removeFolder(file.tempFolders.root);
        }
    } catch (error) {
        log(`Unable to remove temp folder ${file.tempFolders.root}. Folder must be deleted manually`, 2, logTypes.Warning);
    }
}

const process = async (processData) => {
    try {
        const { file } = processData.getCurrentData();
        log(`\nProcessing file '${file.source}'`, 1);

        filedir.setFolderStructure(file);
        if (!filedir.createFolderStructure(file)) {
            return log(`Destination folder '${file.destinationFolder}' already exists. File will not be processed`, 1, logTypes.Error);
        }

        await extract.extractFile(file);

        await analyzePages(file);
        if (file.sourcePages.length === 0) {
            return log(`No valid page file found in extracted file`, 1, logTypes.Error);
        }

        file.startedOK = true;

        await addFileParts(processData);
        if (file.fileParts.length > 1) {
            log(`File has more than ${params.systemParams.maximumPagesWithoutSplit} pages and will splitted into parts of ${params.systemParams.pagesPerFilePart} pages`, 2);
        }

        await cover.prepareCoverImages(file);

        while (file.selectNextFilePart()) {
            await processFilePart.process(processData);
        }

        file.completedOK = file.fileParts.every(part => part.imageOK && part.videoOK);

        log(`File '${file.source}' processed`, 1);
    } catch (error) {
        log(`File process failed. ${error}`, 1, logTypes.Error);
    } finally {
        await removeTempFolder(processData);
    }
}

module.exports = { process }