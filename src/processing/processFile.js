const FilePart = require('../classes/FilePart');
const Page = require('../classes/Page');
const cover = require('../image/cover.js');
const extract = require('../extraction/extract');
const params = require('../params');
const filedir = require('../util/filedir');
const processFilePart = require('./processFilePart');
const message = require('../messages/message');

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
    file.isMultiPart = file.sourcePages.length > params.systemParams.pagesPerFilePart;
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

    if (file.tempFolderCreated && !params.systemParams.keepTempFolder) {
        filedir.removeFolder(file.tempFolders.root);
    }
}

const process = async (processData) => {
    const { file } = processData.getCurrentData();
    try {
        processData.progress({
            file: file.sourceFileName,
            filePart: '',
            status: message('creating_folders'),
            statusType: 'folder',
            percentImage: 0,
            percentVideo: 0,
            imageDestinationFolder: '',
            videoDestinationFile: ''
        });

        if (!filedir.setFolderStructure(file)) {
            return processData.progress({
                status: message('path_too_long'),
                statusType: 'error'
            });
        }

        if (!filedir.createFolderStructure(file)) {
            return processData.progress({
                status: message('folder_already_exists'),
                statusType: 'error'
            });
        }

        if (!await extract.extractFile(processData)) {
            return processData.progress({
                status: message('unable_to_extract'),
                statusType: 'error'
            });
        }

        await analyzePages(file);
        if (file.sourcePages.length === 0) {
            return processData.progress({
                status: message('no_valid_page'),
                statusType: 'error'
            });
        }

        await addFileParts(processData);

        await cover.prepareCoverImages(processData);

        while (file.selectNextFilePart()) {
            await processFilePart.process(processData);
        }
    } catch (error) {
        return processData.progress({
            status: `${message('process_failed')} - ${error}`,
            statusType: 'error',
            percentImage: 0,
            percentVideo: 0
        });
    } finally {
        await removeTempFolder(processData);
    }
}

module.exports = { process }