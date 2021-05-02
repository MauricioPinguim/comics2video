const params = require('../params');
const processPage = require('./processPage');
const videoGenerator = require('../video/videoGenerator');
const message = require('../messages/message');

const processPages = async (processData) => {
    const { filePart } = processData.getCurrentData();

    while (filePart.selectNextPage()) {
        await processPage.process(processData);
    }

    processData.progress({
        status: message('images_success'),
        statusType: 'success',
        percentImage: 100,
        imageDestinationFolder: filePart.imageDestinationFolder
    });
}

const process = async (processData) => {
    const { file, filePart } = processData.getCurrentData();

    const partText = file.fileParts.length > 1 ? `${filePart.number}/${file.fileParts.length}` : '';
    processData.progress({
        filePart: partText,
        status: message('processing_images'),
        statusType: 'image',
        percentImage: 0,
        imageDestinationFolder: '',
        videoDestinationFile: ''
    });

    await processPages(processData);

    if (params.userParams.generateVideo) {
        await videoGenerator.process(processData);
    }
}

module.exports = { process }