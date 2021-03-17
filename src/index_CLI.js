const filedir = require('./util/filedir');
const { log, logTypes } = require('./util/log');
const main = require('./index');

const start = async () => {
    try {
        let source = process.argv[2];
        if (!source) {
            source = filedir.getDefaultInputFolder();
        }

        await main.process(source);
    } catch (error) {
        log(`Unable to start comics2video process. ${error}`, 1, logTypes.Error);
    }
}

module.exports = { start }