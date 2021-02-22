# comics2video
Converts Comic Book files to videos to be watched on TV/Video players.
## Why use videos
The possibility of reading a Comic Book by simply watching a video will allow the user to be **hands-free**, because he or she will not have to hold a phone/tablet or press a button/screen to change the pages.
That will also allow the reading by **people with disabilites**.
### Main process
- Comic Books in digital format are usually formed by a single ZIP file containing one JPG file for each page:
	- Supports extraction from ZIP (.CBR & .CBZ) and .PDF files
- Each page is divided vertically in 3, **but not equal parts**, to avoid Speech Ballons to be cropped:
	- That means the area visible on each part contains a fragment of the next one
	- A line will be draw to indicate that limit
- A video will be generated (using FFmpeg) containing all the parts, like a slideshow:
	- The duration of each part is calculated by the amount of text, by using OCR (via tesserac.js)
## Availability
All the features described are already functional, but the code still needs a lot of refactoring before a first public release.
Soon there will be samples of videos created with comics2video.