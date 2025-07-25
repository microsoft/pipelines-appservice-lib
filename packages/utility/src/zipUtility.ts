import core = require('@actions/core');
import io = require('@actions/io');
import path = require('path');
import Q = require('q');
import fs = require('fs');
import StreamZip = require('node-stream-zip');
var DecompressZip = require('decompress-zip');
var archiver = require('archiver');

import { exist } from "./packageUtility";

export async function unzip(zipLocation, unzipLocation) {
    var defer = Q.defer();
    if(exist(unzipLocation)) {
      await io.rmRF(unzipLocation);
    }
    var unzipper = new DecompressZip(zipLocation);
    console.log('extracting ' + zipLocation + ' to ' + unzipLocation);
    unzipper.on('error', function (error) {
        defer.reject(error);
    });
    unzipper.on('extract', function (log) {
        console.log('extracted ' + zipLocation + ' to ' + unzipLocation + ' Successfully');
        defer.resolve(unzipLocation);
    });
    unzipper.extract({
      path: unzipLocation
    });
    return defer.promise;
}

export async function archiveFolder(folderPath, targetPath, zipName) {
    var defer = Q.defer();
    core.debug('Archiving ' + folderPath + ' to ' + zipName);
    var outputZipPath = path.join(targetPath, zipName);
    var output = fs.createWriteStream(outputZipPath);
    var archive = archiver('zip');
    output.on('close', function () {
        core.debug('Successfully created archive ' + zipName);
        defer.resolve(outputZipPath);
    });

    output.on('error', function(error) {
        defer.reject(error);
    });

    archive.pipe(output);
    archive.directory(folderPath, '/');
    archive.finalize();

    return defer.promise;
}

export async function archiveFolderWithExcludePatterns(folderPath, targetPath, zipName, excludePatterns = []) {
    const defer = Q.defer();
    core.debug('Archiving ' + folderPath + ' to ' + zipName);

    const outputZipPath = path.join(targetPath, zipName);
    const output = fs.createWriteStream(outputZipPath);
    var archive = archiver('zip');

    output.on('close', function () {
        core.debug('Successfully created archive ' + zipName);
        defer.resolve(outputZipPath);
    });

    output.on('error', function (error) {
        defer.reject(error);
    });

    archive.pipe(output);

    // Build glob pattern to include everything except excluded patterns
    archive.glob('**/*', {
        cwd: folderPath,
        ignore: excludePatterns
    });

    archive.finalize();

    return defer.promise;
}

/**
 *  Returns array of files present in archived package
 */
export async function getArchivedEntries(archivedPackage: string)  {
    var deferred = Q.defer();
    var unzipper = new DecompressZip(archivedPackage);
    unzipper.on('error', function (error) {
        deferred.reject(error);
    });
    unzipper.on('list', function (files) {
        var packageComponent = {
            "entries":files
        };
        deferred.resolve(packageComponent); 
    });
    unzipper.list();
    return deferred.promise;
}

export function checkIfFilesExistsInZip(archivedPackage: string, files: string[]) {
    let deferred = Q.defer<boolean>();
    for(let i=0; i < files.length ; i++) {
        files[i] = files[i].toLowerCase();
    }

    const zip = new StreamZip({
        file: archivedPackage,
        storeEntries: true,
        skipEntryNameValidation: true
    });

    zip.on('ready', () => {
        let fileCount: number = 0;
        for (let entry in zip.entries()) {
            if(files.indexOf(entry.toLowerCase()) != -1) {
                fileCount += 1;
            }
        }

        zip.close();
        deferred.resolve(fileCount == files.length);
    });

    zip.on('error', error => {
        deferred.reject(error);
    });

    return deferred.promise;
}