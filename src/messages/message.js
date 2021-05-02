const fs = require('fs');
const path = require('path');
const { userParams, systemParams } = require('../params');

let messages;
let defaultMessages;
let loadFailed = false;

const getLanguage = () => {
    let language = systemParams.defaultMessageLanguage;

    if (userParams.messageLanguage && userParams.messageLanguage.trim().length >= 2) {
        language = userParams.messageLanguage.substring(0, 2).toLowerCase();
    }

    return language;
}

const loadMessages = () => {
    const language = getLanguage();

    const defaultFile = path.join(__dirname, `${systemParams.defaultMessageLanguage}.json`);
    defaultMessages = JSON.parse(fs.readFileSync(defaultFile));

    const file = path.join(__dirname, `${language}.json`);

    if (fs.existsSync(file)) {
        messages = JSON.parse(fs.readFileSync(file));
    } else {
        messages = defaultMessages;
    }

    if (defaultMessages) {
        loadFailed = false;
        return true;
    }
}

const message = (messageId) => {
    try {
        if (!messageId || loadFailed) {
            return messageId;
        }

        if (!messages) {
            if (!loadMessages()) {
                loadFailed = true;
                return messageId;
            }
        }

        let value = messages[messageId.trim().toLowerCase()];
        if (value) {
            return value;
        }

        value = defaultMessages[messageId.trim().toLowerCase()];
        if (value) {
            return value;
        }

        return messageId;

    } catch {
        loadFailed = true;
        return messageId;
    }
}

module.exports = message;