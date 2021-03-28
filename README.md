# comics2video
Converts Comic Book files to videos to be watched on TV/Video players.

The possibility of reading a Comic Book by watching a video allows the user to be **hands-free** (no need to hold a phone or press a button/screen to change the pages) and also allow the reading by **people with disabilities**.

## How it works
> Example using Whiz Comics #34 (1942) - Fawcett Publications (Public Domain)

![How comics2video works](./docs/images/comics2video.jpg)
Video generated by comics2video:
![Sample - Video generated by comics2video](./docs/images/comics2video.gif)


## Installation
1. Git Clone or Download comics2video files from this repository [![Download comics2video](./docs/images/code.png)](https://github.com/MauricioPinguim/comics2video/archive/master.zip)
2. Install the latest version of [Node.js](https://nodejs.org/en/download)
3. Install comics2video dependencies with the following command in comics2video root folder:

```sh
npm install
```

## Usage

### Option A: Drag-and-drop comic book files
(Windows only) Select the Comic Book file and drag-and-drop it on the batch file located in the root folder of comics2video:

> 🗋 drop_comics_here.bat
![Drag-and-drop file to start](./docs/images/drag_drop_process.gif)

To process multiple Comic Book files, put them in a folder and drag-and-drop the folder.

### Option B: As a standalone app
Place the Comic Book files in the **comics_files** folder and run:
```sh
node comics2video
```

Or provide the path+file as a parameter:
```sh
node comics2video ./path/myComicBook.cbr
```

If the parameter is a folder, all files will be processed.

### Option C: As a Node.js module
Find the path to the comics2video local folder and add it to you own Node.js project using:
```sh
npm install ./full-path-to-comics2video-folder
```
Then use:
```javascript
const Comics2video = require('comics2video'); // Local installation, not available in npmjs.com yet

const source = './path/myComicBook.cbr'; // File or Folder

// Optional, see default values in next section
const userParameters = { };

const comicsConversion = new Comics2video(source, userParameters);

// Follow-up Events, process can take more than 1 minute per page
comicsConversion.on('progressUpdated', (data) => {
	//console.log(data.toString()); // Commented out, prefer to use fields in 'data' object
});
comicsConversion.on('processCompleted', (data) => {
	for (const item of data.messages) {
		console.log(`${item.messageType} ► ${item.message}`); // Only important result messages
	}
});

( async () => {
	await comicsConversion.start();
})();
```

### User Parameters
| Name | How to set | Default | Description |
| --- | --- | --- | --- |
| generateVideo | boolean | true | If false, only the image frames will be generated |
| ocrEnabled | boolean | true | If false, disables OCR and uses a fixed duration in all frames
| contentProfile | string:<br/>'simple', 'complex' | 'complex' | Changes how OCR calculates each frame duration:<br/>• 'simple' : Ideal for Comics for kids, art with few details<br />• 'complex' : For Superhero or Comics with detailed art
| readingSpeed | string:<br/> 'slow', 'normal', 'fast' | 'normal' | Also changes how OCR calculates duration:<br/>• 'slow' : Ideal for Kids or reading in foreign language<br />• 'normal' : Normal reading speed<br />• 'fast' : For speed reading

### Using the generated files
For each comic book processed, a folder with the same name will be created, containing:
- The video file in .MP4 format
	- Just open it in the TV/Video player of your choice, like a regular video
- A subfolder named 'Images' with all the frames in .JPG format
	- That can also be opened in modern TVs, advance each frame/page manually using the remote control

## Project comics2video

### Dependencies
Extraction from CBR/RAR files: [unrar-promise](https://www.npmjs.com/package/unrar-promise), CBZ/ZIP files: [win-7zip](https://www.npmjs.com/package/win-7zip)+[cross-zip](https://www.npmjs.com/package/cross-unzip), PDF files: [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist), Image processing: [sharp](https://www.npmjs.com/package/sharp), OCR: [tesseract.js](https://www.npmjs.com/package/tesseract.js), Video generation: [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static)

### Next steps
- Make it available as a module at [npmjs.com](https://www.npmjs.com)
- Graphical User Interface to select files and set User Parameters (for non-developers users) 

### Contact
:penguin: Maurício Antunes Oliveira: [mauricio_pinguim@hotmail.com](mailto:mauricio_pinguim@hotmail.com?subject=comics2video)