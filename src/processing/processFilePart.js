const params = require('../params');
const processPage = require('./processPage');
const videoGenerator = require('../video/videoGenerator');

const processPages = async (processData) => {
    const { filePart } = processData.getCurrentData();

    while (filePart.selectNextPage()) {
        await processPage.process(processData);
    }

    processData.progress({
        status: 'Images generated successfully',
        statusType: 'success',
        percentImage: 100
    });
}

const process = async (processData) => {
    const { file, filePart } = processData.getCurrentData();

    const partText = file.fileParts.length > 1 ? `${filePart.number}/${file.fileParts.length}` : '';
    processData.progress({
        filePart: partText,
        status: `Processing Images`,
        statusType: 'image',
        percentImage: 0
    });

    await processPages(processData);

    if (params.userParams.generateVideo) {
        await videoGenerator.process(processData);
    }
}

module.exports = { process }