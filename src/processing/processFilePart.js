const params = require('../params');
const dependencies = require('../util/dependencies');
const processPage = require('./processPage');

const processPages = async (processData) => {
    const { filePart } = processData.getCurrentData();

    while (filePart.selectNextPage()) {
        await processPage.process(processData);
    }

    processData.progress({
        element: 'Images',
        action: 'Images generated',
        percent: 100
    });
    filePart.imageOK = true;
}

const process = async (processData) => {
    const { file, filePart } = processData.getCurrentData();
    try {
        const partText = file.fileParts.length > 1 ? `Part ${filePart.number}/${file.fileParts.length}` : '';
        processData.progressPercent = 0;
        processData.progress({
            filePart: partText,
            element: `Images`,
            action: `Processing Pages`
        });

        await processPages(processData);

        if (!params.userParams.generateVideo) {
            filePart.videoOK = true;
        } else if (!dependencies.availableFeatures.videoGeneration) {
            processData.error(`'${filePart.outputFile}' video generation skipped due to missing dependencies`);
        } else {
            await require('../video/videoGenerator').process(processData);
        }
    } catch (error) {
        processData.error(`'${filePart.outputFile}' process failed. ${error}`);
    }
}

module.exports = { process }