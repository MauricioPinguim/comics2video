const Comics2video = require('../classes/Comics2video');
const filedir = require('../util/filedir');
const { log } = require('./basicLog');

const start = async () => {
    let source = process.argv[2];
    if (!source) {
        source = filedir.getDefaultInputFolder();
    }

    log('\ncomics2video - Converts Comic Book files to videos\n')

    const comicsConversion = new Comics2video(source);

    // Follow-up Events, process can take more than 1 minute per page
    comicsConversion.on('progressUpdated', (data) => {
        const progressMessage = `${data.toString()}`; // toString() formats all fields in a single line

        log(progressMessage); // Too many messages, prefer using the fields in 'data' object instead
    });
    comicsConversion.on('processCompleted', (data) => {
        log('\nProcess summary:');
        for (const item of data.messages) {
            log('- ' + item.message, item.messageType);
        }
        log(`comics2video process completed in ${data.elapsedMinutes} minutes\n`);
    });

    await comicsConversion.start();
}

module.exports = { start }