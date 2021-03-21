const figlet = require('figlet');

const getFont = (terminalWidth) => {
    if (terminalWidth >= 105) {
        return 'Colossal';
    } else if (terminalWidth >= 78) {
        return 'Banner';
    }
}

const getAsciiTitle = (title, subtitle, defaultTitle, terminalWidth) => {
    try {
        const font = getFont(terminalWidth);
        if (!font) {
            return defaultTitle;
        }

        const asciiTitle = figlet.textSync(title, { font });
        
        return `${asciiTitle}\n${subtitle}`;
    } catch {
        return defaultTitle;
    }
}

module.exports = { getAsciiTitle }