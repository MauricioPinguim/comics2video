const FilePart = require('../classes/FilePart');
const Page = require('../classes/Page');
const cover = require('../image/cover.js');
const extract = require('../extraction/extract');
const params = require('../params');
const filedir = require('../util/filedir');
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
    filePart.imagePageProgressIncrement = 1 / filePart.pages.length * 100;
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
        processData.warning(`Unable to remove temp folder ${file.tempFolders.root}. Folder must be deleted manually`);
    }
}

const process = async (processData) => {
    const { file } = processData.getCurrentData();
    try {
        processData.progress({
            file: `File '${file.sourceFileName}'`,
            action: `Creating folders`
        });

        filedir.setFolderStructure(file);
        if (!filedir.createFolderStructure(file)) {
            return processData.warning(`Destination folder for '${file.sourceFileName}' already exists`);
        }

        if (!await extract.extractFile(processData)) {
            return processData.error(`Unable to extract file '${file.sourceFileName}'`);
        }

        await analyzePages(file);
        if (file.sourcePages.length === 0) {
            return processData.error(`No valid page file found in file '${file.sourceFileName}'`);
        }

        file.startedOK = true;

        await addFileParts(processData);

        await cover.prepareCoverImages(processData);

        while (file.selectNextFilePart()) {
            await processFilePart.process(processData);
        }

        file.completedOK = file.fileParts.every(part => part.imageOK && part.videoOK);
    } catch (error) {
        processData.error(`'${file.sourceFileName}' file process failed. ${error}`);
    } finally {
        if (!file.startedOK) {
            processData.error(`File '${file.sourceFileName}' not processed due to errors`);
        } else if (!file.completedOK) {
            processData.error(`File '${file.sourceFileName}' processed, with errors`);
        } else {
            processData.success(`File '${file.sourceFileName}' processed successfully`);
        }

        await removeTempFolder(processData);
    }
}

module.exports = { process }