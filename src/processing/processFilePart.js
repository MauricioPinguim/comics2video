const dependencies = require('../util/dependencies');
const { log, logTypes } = require('../util/log');
const params = require('../params');
const processPage = require('./processPage');

const processPages = async (processData) => {
    const { filePart } = processData.getCurrentData();

    while (filePart.selectNextPage()) {
        await processPage.process(processData);
    }

    filePart.imageOK = true;
}

const process = async (processData) => {
    try {
        const { filePart } = processData.getCurrentData();

        log(`Processing file part '${filePart.videoFile}'`, 2);

        await processPages(processData);

        if (!params.userParams.generateVideo) {
            filePart.videoOK = true;
        } else if (!dependencies.availableFeatures.videoGeneration) {
            log(`Video generation skipped due to missing dependencies`, 3, logTypes.Warning);
        } else {
            await require('../video/videoGenerator').process(processData);
        }

        log(`File part '${filePart.videoFile}' processed`, 2);

    } catch (error) {
        log(`File part process failed. ${error}`, 2, logTypes.Error);
    }
}

module.exports = { process }