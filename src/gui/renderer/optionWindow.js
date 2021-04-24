const { ipcRenderer, remote } = require('electron');
const currentWindow = remote.getCurrentWindow();

const parameters = [
    { name: 'GenerateVideo', options: ['Yes', 'No'], descriptions: ['Generate Images and Video', 'Generate Images only'] },
    { name: 'ContentProfile', options: ['Complex', 'Simple'], descriptions: ['Superhero or Comics with detailed art', 'Comics for kids, art with few details'] },
    { name: 'ReadingSpeed', options: ['Slow', 'Normal', 'Fast'], descriptions: ['For Kids or reading in foreign language', 'Normal reading speed', 'For speed reading'] }
];

const { userParams, contentProfiles, readingSpeeds } = ipcRenderer.sendSync('getUserParams');

const ok = () => {
    userParams.generateVideo = parameters[0].selectedIndex === 0;
    userParams.contentProfile = parameters[1].selectedIndex === 0 ? contentProfiles.complexContent : contentProfiles.simpleContent;
    userParams.readingSpeed = parameters[2].selectedIndex === 0 ? readingSpeeds.slow : parameters[2].selectedIndex === 1 ? readingSpeeds.normal : readingSpeeds.fast;

    ipcRenderer.send('setUserParams', userParams);

    currentWindow.close();
}

const cancel = () => {
    currentWindow.close();
}

const setOption = (parameter, valueIndex) => {
    for (let optionIndex = 0; optionIndex < parameter.options.length; optionIndex++) {
        const button = document.getElementById('btn' + parameter.options[optionIndex]);
        if (optionIndex === valueIndex) {
            button.classList.add('active');
            const label = document.getElementById('lbl' + parameter.name);
            label.textContent =  parameter.descriptions[optionIndex];
        } else {
            button.classList.remove('active');
        }
    }
    parameter.selectedIndex = valueIndex;
}

const showParams = () => {
    setOption(parameters[0], userParams.generateVideo ? 0 : 1);
    setOption(parameters[1], userParams.contentProfile.name === contentProfiles.complexContent.name ? 0 : 1);
    setOption(parameters[2], userParams.readingSpeed.name === readingSpeeds.slow.name ? 0 : userParams.readingSpeed.name === readingSpeeds.normal.name ? 1 : 2);
}

const checkShortcutKeys = (e) => {
    if (e.key === "Escape") {
        cancel();
    }
    if (e.key === "Enter") {
        ok();
    }
}

const setEvents = () => {
    document.getElementById('btnOK').addEventListener('click', () => ok());
    document.getElementById('btnCancel').addEventListener('click', () => cancel());
    document.getElementById('btnYes').addEventListener('click', () => setOption(parameters[0], 0));
    document.getElementById('btnNo').addEventListener('click', () => setOption(parameters[0], 1));
    document.getElementById('btnComplex').addEventListener('click', () => setOption(parameters[1], 0));
    document.getElementById('btnSimple').addEventListener('click', () => setOption(parameters[1], 1));
    document.getElementById('btnSlow').addEventListener('click', () => setOption(parameters[2], 0));
    document.getElementById('btnNormal').addEventListener('click', () => setOption(parameters[2], 1));
    document.getElementById('btnFast').addEventListener('click', () => setOption(parameters[2], 2));
    
    document.onkeydown = (e) => checkShortcutKeys(e);
}

setEvents();
showParams();