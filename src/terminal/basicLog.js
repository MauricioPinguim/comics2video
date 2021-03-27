const params = require('../params');

let formattedLogEnabled = false;
const enableFormattedLog = () => {
    formattedLogEnabled = true;
}

const log = (message, messageType) => {
    if (formattedLogEnabled) {
        message = getFormattedLog(message, messageType);
    }

    console.log(message);
}

const getFormattedLog = (message, messageType) => {
    const chalk = require('chalk');

    switch (messageType) {
        case 'error':
            return chalk.red(message);
        case 'warning':
            return chalk.yellow(message);
        case 'success':
            return chalk.green(message);
        default:
            return message;
    }
}

module.exports = {
    log,
    enableFormattedLog
}