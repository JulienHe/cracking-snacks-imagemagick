"use strict";
const express = require("express");
const app = express();
const {readdirSync} = require('fs');
const fs = require('fs');
const gm = require('gm');
const log = console.log;
const clc = require("cli-color");

const rootImageFolder = './images/';

function cleanNaming(directory) {
    return directory.replace(/\d{1,}\s/g, '').replaceAll(/-\s/g, '').replaceAll(/\s/g, '-').toLowerCase();
}

function getDirectories (source) {
    return readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

function resizePicture(source, exportName, width, height, type='') {
    source
    .resize(width, height, type)
    .autoOrient()
    .write(exportName, function (err) {
        if(err) console.log(err);
        log(clc.blue("Resize and rename"))
        log(clc.green(exportName))
    })
}

function renameImage(source, exportName) {
    fs.rename(source, exportName, function(err) {
        if ( err ) console.log('ERROR: ' + err);
        log(clc.blue("Rename cover"))
    });
}

function cropSquare(source, imageSize, exportName) {
    source.gravity('Center')
    .crop(imageSize, imageSize, 0, 0)
    .quality(100)
    .resize(1080, 1080)
    .write(exportName, function(err){
        if (err) return console.dir(arguments)
        log(clc.blue("Cropping Instagram"))
        console.log(this.outname + " created  ::  " + arguments[3])
    })
}

function cropWhatsapp(source, smallestSize, exportName) {
    source.gravity('Center')
    .quality(100)
    .crop(smallestSize,smallestSize, 0, 0)
    .resize(1125, 1125)
    .crop(600, 1125, 0, 0)
    .write(exportName, function(err){
        if (err) return console.dir(arguments)
        log(clc.blue("Whatsapp image"))
        console.log(this.outname + " created  ::  " + arguments[3])
    })
}

app.get("/", (req, res) => {
    
    const directories = getDirectories(rootImageFolder);
    
    directories.forEach((directory, index) => {
        const currentImageDirectory = `${rootImageFolder}${directory}`;
        fs.readdir(currentImageDirectory, (err, files) => {
            const folderName = cleanNaming(directory);
            files.forEach((file, index) => {
                // Export name + Export name square
                const exportName = `${currentImageDirectory}/${folderName}-${index}.jpg`
                const exportCover = `${currentImageDirectory}/cover-${folderName}.jpg`
                const exportSquare = `${currentImageDirectory}/instagram-${folderName}-${index}.jpg`
                const exportWhastapp = `${currentImageDirectory}/whatsapp-${folderName}-${index}.jpg`
                const currentFileName = `${currentImageDirectory}/${file}`
                
                // Resize or change name
                gm(currentFileName)
                .size(function (err, size) {
                    if (err){
                        return false;
                    }
                    const width = size.width;
                    if (width > 2000) {
                        resizePicture(this, exportName, 40, 40, '%');
                    } else {
                        // Cover
                        renameImage(currentFileName, exportCover)
                    }
                })

                
                // Crop image
                gm(currentFileName)
                .size(function (err, size) {
                    if (err){
                        return false;
                    }
                    const width = size.width;
                    const height = size.height;
                    const pickSize = width < height ? width : height;
                    if (width > 1080 || height > 1080) {
                        cropSquare(this, pickSize, exportSquare)
                    }
                })

                
                // Whatsapp Image
                gm(currentFileName)
                .size(function (err, size) {
                    if (err){
                        return false;
                    }
                    const width = size.width;
                    const height = size.height;
                    const smallestSize = width < height ? width : height;
                    if (width > 1080 || height > 1080) {
                        cropWhatsapp(this, smallestSize, exportWhastapp)
                    }
                })   
            });
        });
        
    });
    res.send('Finished!');
})

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});