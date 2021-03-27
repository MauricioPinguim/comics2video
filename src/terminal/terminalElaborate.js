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

    if (data.element) {
        term.dim(`${progressBar(data.percent, 50)}`);
        term(` ${data.element} ► ${formatPercent(data.percent)}`);
    } else {
        term(`► ${data.action}`);
    }
    term('\n');

    term.up(3); // Prevents scroll if Tesseract.js write any warning log

    previousFile = data.file;
    previousFilePart = data.filePart;
}

const showSummary = (data) => {
    term.windowTitle('comics2video - Done');
    term('\n\n\n\nProcess summary:');

    for (const msg of data.messages) {
        if (msg.messageType === 'warning') {
            term.yellow();
        } else if (msg.messageType === 'error') {
            term.red();
        } else if (msg.messageType === 'success') {
            term.green();
        }
        term('\n- ' + msg.message);
        term.defaultColor();
    }
    term(`\ncomics2video process completed in ${data.elapsedMinutes} minutes\n`);
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