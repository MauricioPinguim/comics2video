/**
 * comics2video - Converts Comic Book files to videos to be watched on TV/Video players
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const dependencies = require('./src/util/dependencies');

if (dependencies.checkDependencies()) {
    const index_CLI = require('./src/index_CLI');
    index_CLI.start().then();
}