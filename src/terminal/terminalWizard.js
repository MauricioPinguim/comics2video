const term = require('terminal-kit').terminal;
const dependencies = require('../util/dependencies');
const filedir = require('../util/filedir');
const { log, logTypes } = require('../util/log');
const main = require('../index');
const params = require('../params');

const wizardParams = {};
let source;

const getSource = () => {
    source = process.argv[2];
    if (!source) {
        source = filedir.getDefaultInputFolder();
    }
}

const showSource = () => {
    if (filedir.isFile(source)) {
        term.brightBlue('Comic Book file to be processed:')    
    } else {
        term.brightMagenta('Folder containing Comic Book files to be processed:')    
    }
    term.styleReset();
    term(` ${source}\n\n`);
}

const showAppTitle = () => {
    const appTitle = 'comics2video';
    const subtitle = 'Converts Comic Book files to videos';
    let title = `${appTitle} - ${subtitle}`;

    if (dependencies.availableFeatures.asciiTitle) {
        title = require('./asciiTitle').getAsciiTitle(appTitle, subtitle, title, term.width);
    }

    term.green(`\n${title}\n\n`);
    term.styleReset();
}

const showKeys = () => {
    term('\nUse keys ');
    term.cyan('↓');
    term(', ');
    term.cyan('↑');
    term(' and ');
    term.cyan('ENTER');
    term(' to select. ');
    term.yellow('ESC');
    term(' to quit.');
    term.styleReset();
}

const step = async (stepData) => {
    return new Promise((resolve, reject) => {
        term.clear();
        showAppTitle();
        showSource();
        term(`${stepData.title}`);
        term.saveCursor()
        term('\n');

        const maxDescriptionLength = Math.max.apply(
            Math,
            stepData.menuOptions.map(item => item.text.length)
        );
        const leftMargin = maxDescriptionLength + 5;
        const items = [];
        for (const menuOption of stepData.menuOptions) {
            items.push(menuOption.text + ' ');
            term.column(leftMargin)(`${menuOption.description}\n`);
        }
        showKeys();

        const selectedIndex = stepData.menuOptions
            .find(menuOption => menuOption.value === stepData.defaultValue)
            .index;

        const options = {
            selectedIndex,
            cancelable: true,
            leftPadding: ' '
        }

        term.restoreCursor()
        term.singleColumnMenu(items, options, function (error, response) {
            if (error || !response || response.canceled) {
                return resolve();
            }
            return resolve({
                value: stepData.menuOptions[response.selectedIndex].value
            })
        });
    });
}

const quit = () => {
    term.yellow("\n\n\ncomics2video process canceled\n\n");
}

const stepLogLevel = async () => {
    let defaultLogLevel = params.userParams.logLevel;
    if (defaultLogLevel === 2) {
        defaultLogLevel = 1;
    } else if (defaultLogLevel === 4) {
        defaultLogLevel = 3;
    }

    const stepData = {
        defaultValue: defaultLogLevel,
        title: 'Log level:',
        menuOptions: [
            {
                index: 0,
                text: '1',
                description: 'Basic info',
                value: 1
            },
            {
                index: 1,
                text: '3',
                description: 'Skip frame info',
                value: 3
            },
            {
                index: 2,
                text: '5',
                description: 'Detailed info',
                value: 5
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else {
        wizardParams.logLevel = response.value;
        await main.process(source, wizardParams);
    }
}

const stepReadingSpeed = async () => {
    const stepData = {
        defaultValue: params.userParams.readingSpeed.name,
        title: 'Reading speed:',
        menuOptions: [
            {
                index: 0,
                text: 'SLOW',
                description: 'For Kids or reading in foreign language',
                value: 'slow'
            },
            {
                index: 1,
                text: 'NORMAL',
                description: 'Normal speed',
                value: 'normal'
            },
            {
                index: 2,
                text: 'FAST',
                description: 'Speed reading',
                value: 'fast'
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else {
        wizardParams.readingSpeed = response.value;
        await stepLogLevel();
    }
}

const stepContentProfile = async () => {
    const stepData = {
        defaultValue: params.userParams.contentProfile.name,
        title: 'Comic Book profile',
        menuOptions: [
            {
                index: 0,
                text: 'SIMPLE',
                description: 'Comics for kids, art with few details',
                value: 'simple'
            },
            {
                index: 1,
                text: 'COMPLEX',
                description: 'Superhero or Comics with detailed art',
                value: 'complex'
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else {
        wizardParams.contentProfile = response.value;
        await stepReadingSpeed();
    }
}

const stepOCREnabled = async () => {
    const stepData = {
        defaultValue: params.userParams.ocrEnabled,
        title: 'Use OCR?',
        menuOptions: [
            {
                index: 0,
                text: 'YES',
                description: 'Frames with more text will last longer',
                value: true
            },
            {
                index: 1,
                text: 'NO',
                description: 'Fixed duration for all frames',
                value: false
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else {
        wizardParams.ocrEnabled = response.value;
        await stepContentProfile();
    }
}

const stepGenerateVideo = async () => {
    const stepData = {
        defaultValue: params.userParams.generateVideo,
        title: 'Generate video?',
        menuOptions: [
            {
                index: 0,
                text: 'YES',
                description: 'Video and images',
                value: true
            },
            {
                index: 1,
                text: 'NO',
                description: 'Images only',
                value: false
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else {
        wizardParams.generateVideo = response.value;
        if (response.value) {
            await stepOCREnabled();
        } else {
            await stepLogLevel();
        }
    }
}

const stepStartDefault = async () => {
    const stepData = {
        defaultValue: true,
        number: 1,
        title: 'Start with default parameters?',
        menuOptions: [
            {
                index: 0,
                text: 'YES',
                description: 'Start',
                value: true
            },
            {
                index: 1,
                text: 'NO',
                description: 'Set parameters',
                value: false
            }]
    }

    const response = await step(stepData);
    if (!response) {
        quit();
    } else if (response.value) {
        term('\n\n');
        await main.process(source);
    } else {
        await stepGenerateVideo();
    }
}

const start = async () => {
    try {
        getSource();
        
        wizardParams.generateVideo = params.userParams.generateVideo;
        
        await stepStartDefault();
    } catch (error) {
        log(`Unable to start comics2video process. ${error}`, 1, logTypes.Error);
    }
}

module.exports = { start }