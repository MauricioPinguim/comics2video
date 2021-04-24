const Comics2video = require('../classes/Comics2video');
const filedir = require('../util/filedir');
const log = require('./basicLog');

const start = async () => {
    let source = process.argv[2];
    if (!source) {
        source = filedir.getDefaultInputFolder();
    }

    const comicsConversion = new Comics2video(source);

    log('\ncomics2video - Converts Comic Book files to videos\n');

    // Follow-up Events, process can take more than 1 minute per page
    comicsConversion.on('progressUpdated', (data) => {
        // toString() combines all fields in 'data' object in a single string
        log(data.toString());
    });
    comicsConversion.on('processCompleted', (data) => {
        log(`\n(${data.resultType}) ${data.resultMessage}`);
    });

    await comicsConversion.start();
}

module.exports = { start }