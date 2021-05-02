const { ipcRenderer, remote } = require('electron');
const currentWindow = remote.getCurrentWindow();

const message = (messageId) => {
    return ipcRenderer.sendSync('getMessage', messageId);
}

const element = (elementId) => {
    return document.getElementById(elementId);
}

const setMessage = (elementId, messageId) => {
    element(elementId).textContent = message(messageId);
}

const parameters = [
    { name: 'GenerateVideo', options: ['Yes', 'No'], descriptions: [message('generate_video_yes'), message('generate_video_no')] },
    { name: 'ContentProfile', options: ['Complex', 'Simple'], descriptions: [message('content_profile_complex'), message('content_profile_simple')] },
    { name: 'ReadingSpeed', options: ['Slow', 'Normal', 'Fast'], descriptions: [message('reading_speed_slow'), message('reading_speed_normal'), message('reading_speed_fast')] }
];

const { userParams, contentProfiles, readingSpeeds } = ipcRenderer.sendSync('getUserParams');

const setUserParams = () => {
    userParams.generateVideo = parameters[0].selectedIndex === 0;
    userParams.contentProfile = parameters[1].selectedIndex === 0 ? contentProfiles.complexContent : contentProfiles.simpleContent;
    userParams.readingSpeed = parameters[2].selectedIndex === 0 ? readingSpeeds.slow : parameters[2].selectedIndex === 1 ? readingSpeeds.normal : readingSpeeds.fast;

    ipcRenderer.send('setUserParams', userParams);
}

const ok = () => {
    setUserParams();

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

const setMessages = () => {
    currentWindow.title = `comics2video - ${message('options')}`;
    setMessage('lblGenerateVideoLabel', 'generate_video');
    setMessage('lblYes', 'yes');
    setMessage('lblNo', 'no');
    setMessage('lblContentProfileLabel', 'content_profile');
    setMessage('lblSimple', 'simple');
    setMessage('lblComplex', 'complex');
    setMessage('lblReadingSpeedLabel', 'reading_speed');
    setMessage('lblSlow', 'slow');
    setMessage('lblNormal', 'normal');
    setMessage('lblFast', 'fast');
    setMessage('lblOK', 'ok');
    setMessage('lblCancel', 'cancel');
}

const prepareWindow = () => {
    setMessages();

    showParams();

    element('btnOK').addEventListener('click', () => ok());
    element('btnCancel').addEventListener('click', () => cancel());
    element('btnYes').addEventListener('click', () => setOption(parameters[0], 0));
    element('btnNo').addEventListener('click', () => setOption(parameters[0], 1));
    element('btnComplex').addEventListener('click', () => setOption(parameters[1], 0));
    element('btnSimple').addEventListener('click', () => setOption(parameters[1], 1));
    element('btnSlow').addEventListener('click', () => setOption(parameters[2], 0));
    element('btnNormal').addEventListener('click', () => setOption(parameters[2], 1));
    element('btnFast').addEventListener('click', () => setOption(parameters[2], 2));
    document.onkeydown = (e) => checkShortcutKeys(e);
}

prepareWindow();