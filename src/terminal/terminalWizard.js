const term = require('terminal-kit').terminal;
const { userParams, systemParams } = require('../params');
const dependencies = require('../util/dependencies');
const filedir = require('../util/filedir');
const terminalElaborate = require('./terminalElaborate');
const terminalBasic = require('./terminalBasic');

let source;

const getSource = () => {
    source = process.argv[2];
    if (!source) {
        source = filedir.getDefaultInputFolder();
    }
}

const showSource = () => {
    if (filedir.isFile(source)) {
        term.cyan('Comic Book file to be processed:')
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

        term.up(stepData.menuOptions.length + 3);
        term('\n');

        const selectedIndex = stepData.menuOptions
            .find(menuOption => menuOption.value === stepData.defaultValue)
            .index;

        const options = {
            selectedIndex,
            cancelable: true,
            leftPadding: ' '
        }

        term.singleColumnMenu(items, options, function (error, response) {
            term.up(stepData.menuOptions.length + 2);

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
    term.eraseDisplayBelow();
    term.yellow("\ncomics2video process canceled\n");
    term.hideCursor();
}

const stepReadingSpeed = async () => {
    const stepData = {
        defaultValue: userParams.readingSpeed.name,
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
        userParams.readingSpeed = response.value;
        await startProcess();
    }
}

const stepContentProfile = async () => {
    const stepData = {
        defaultValue: userParams.contentProfile.name,
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
        userParams.contentProfile = response.value;
        await stepReadingSpeed();
    }
}

const stepOCREnabled = async () => {
    const stepData = {
        defaultValue: userParams.ocrEnabled,
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
        userParams.ocrEnabled = response.value;
        await stepContentProfile();
    }
}

const stepGenerateVideo = async () => {
    const stepData = {
        defaultValue: userParams.generateVideo,
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
        userParams.generateVideo = response.value;
        if (response.value) {
            await stepOCREnabled();
        } else {
            await startProcess();
        }
    }
}

const startProcess = async () => {
    await terminalElaborate.start(source, userParams);
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
        await startProcess();
    } else {
        await stepGenerateVideo();
    }
}

const start = async () => {
    if (systemParams.disableTerminalElaborate) {
        await terminalBasic.start(source);
        return;
    }

    getSource();
    term.windowTitle('comics2video');
    term.hideCursor();

    await stepStartDefault();
}

module.exports = { start }