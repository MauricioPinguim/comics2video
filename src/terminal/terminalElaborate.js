const term = require('terminal-kit').terminal;
const Comics2video = require('../classes/Comics2video');

let previousFile = '';
let previousFilePart = '';

const formatPercent = (percent) => {
    return (Math.floor(percent * 10, 1) / 10)
        .toString() + '%';
}

const progressBar = (value, ticks) => {
    const ticksFilled = Math.floor(value / (100 / ticks));

    const emptyChar = '░';
    const filledChar = '█'
    const bar = filledChar
        .repeat(ticksFilled)
        .padEnd(ticks, emptyChar);

    return `[${bar}]`;
}

const saveCursor = () => {
    // Go down and up again to ensure scroll happens before saving cursor position
    term('\n\n\n');
    term.up(3);

    term.saveCursor();
}

const restoreCursor = () => {
    term.restoreCursor();
}

const showProgressItem = (data) => {
    const isFirst = !previousFile && !previousFilePart;
    const isNewFile = previousFile && previousFile != data.file;
    const isNewFilePart = previousFilePart && data.filePart && previousFilePart != data.filePart;

    if (isFirst) {
        saveCursor();
    } else if (isNewFile || isNewFilePart) {
        term('\n\n\n');
        saveCursor();
    } else {
        restoreCursor();
    }
    term.eraseDisplayBelow();
    term('\n');

    term.cyan(data.file);
    if (data.filePart) {
        term.brightMagenta('  ' + data.filePart);
    }
    term('\n');

    const percent = data.percentVideo > 0 ? data.percentVideo : data.percentImage;
    let statusMessage;
    if (percent !== 0) {
        term.dim(`${progressBar(percent, 50)}`);
        statusMessage = ` ${data.status} ► ${formatPercent(percent)}`;
    } else {
        statusMessage = `► ${data.status}`;
    }

    if (data.statusType === 'error') {
        term.red();
    } else if (data.statusType === 'success') {
        term.green();
    } else {
        term.defaultColor();
    }
    term(statusMessage);
    term.defaultColor();
    term('\n');

    term.up(3); // Prevents scroll if Tesseract.js write any warning log

    previousFile = data.file;
    previousFilePart = data.filePart;
}

const showSummary = (data) => {
    if (data.resultType === 'error') {
        term.red();
    }
    term(`\n\n\n\n${data.resultMessage}\n\n`);
    term.defaultColor();

    term.hideCursor();
}

const start = async (source, userParameters) => {
    term.windowTitle('comics2video - Processing');
    term.up(2);
    term.eraseDisplayBelow();

    const comics2video = new Comics2video(source, userParameters);

    comics2video.on('progressUpdated', (data) => {
        showProgressItem(data);
    });

    comics2video.on('processCompleted', (data) => {
        showSummary(data);
    });

    await comics2video.start();
}

module.exports = { start }