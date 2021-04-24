/**
 * comics2video - Converts Comic Book files to videos
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

// This is the Terminal Interface for comics2video. For the Graphical User Interface (except Linux), use this command instead:
// npm start

(async () => {
    const terminalWizard = require('./src/terminal/terminalWizard');
    await terminalWizard.start();
    process.exit();
})();