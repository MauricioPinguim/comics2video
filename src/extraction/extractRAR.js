const { unrar } = require('unrar-promise');

const extract = async (file) => {
    await unrar(file.source, file.tempFolders.pages);
}

module.exports = { extract }