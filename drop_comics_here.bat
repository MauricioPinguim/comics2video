@echo off
rem comics2video - Converts Comic Book files to videos to be watched on TV/Video players
echo.
set "node_installed=0"
if exist "./node.exe" (
    set "node_installed=1"
)
for %%# in (node.exe) do  if not "%%~f$PATH:#" equ "" set "node_installed=1"
if "%node_installed%" equ "0" (
    echo comics2videos requires Node.js, download and install using:
    echo https://nodejs.org/en/download
) else (
    if "%1" equ "" (
        echo No Comic Book was dragged-and-dropped in this batch file, or provided as a parameter
        echo Starting comics2video using the default folder for Comic Book files
        node "%~dp0comics2video.js"
    ) else (
        if "%2" neq "" (
            echo More than 1 file was dragged-and-dropped in this batch file, or provided as a parameter
            echo To process multiple files, drag-and-drop a folder instead
        ) else (
            echo Starting comics2video with file/folder '%1'
            node "%~dp0comics2video.js" %1            
        )
    )
)
echo.
pause