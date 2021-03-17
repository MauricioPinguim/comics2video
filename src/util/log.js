const params = require('../params');

const logTypes = { Normal: {}, Error: {}, Warning: {}, Success: {} };

let formattedLogEnabled = false;
const enableFormattedLog = () => {
    formattedLogEnabled = true;
}

const log = (message, logLevel = 1, logType = logTypes.Normal) => {
    if (logLevel > params.userParams.logLevel) {
        return;
    }

    if (formattedLogEnabled) {
        message = getFormattedLog(message, logType);
    }

    const logPrefix = getLogPrefix(logLevel);

    console.log(logPrefix + message);
}

const getLogPrefix = (logLevel) => {
    switch (logLevel) {
        case 2:
            return '├─ ';
        case 3:
            return '│ ├─ ';
        case 4:
            return '│ │ ├─ ';
        case 5:
            return '│ │ │ ├─ ';
        default:
            return '';
    }
}

const getFormattedLog = (message, logType) => {
    const chalk = require('chalk');

    switch (logType) {
        case logTypes.Error:
            return chalk.red(message);
        case logTypes.Warning:
            return chalk.yellow(message);
        case logTypes.Success:
            return chalk.green(message);
        default:
            return message;
    }
}

module.exports = {
    logTypes,
    log,
    enableFormattedLog
}