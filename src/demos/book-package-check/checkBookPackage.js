// import React from 'react';
// import * as books from '../../core/books/books';
// import checkFileDemo from '../file-check/checkFileContents';
// import { books, checkFileContents, checkTQbook, checkRepo } from '../../core';
// import { getFile, clearCaches, fetchRepositoryZipFile } from '../../core/getApi';
// import Path from 'path';
// import { consoleLogObject } from '../../core/utilities';


// const VALIDATOR_VERSION_STRING = '0.3.1';


// let cachedUnzippedFiles = {};

// /**
//  * adds caching of uncompressed files, calls getFile() if file is not cached
//  * @param {String} username
//  * @param {String} repository
//  * @param {String} path
//  * @param {String} branch
//  * @return {Promise<*>}
//  */
// export async function getFileCached({ username, repository, path, branch }) {
//   const filePath = Path.join(repository, path, branch);
//   // console.log(`getFileCached(${username}, ${repository}, ${path}, ${branch})…`);
//   if (cachedUnzippedFiles[filePath]) {
//     // console.log(`in cache - ${filePath}`);
//     return cachedUnzippedFiles[filePath];
//   }

//   let file = await getFile({ username, repository, path, branch });

//   if (file) {
//     cachedUnzippedFiles[filePath] = file;
//     // console.log(`saving to cache - ${filePath}`);
//   }

//   return file;
// }

// async function checkTQbookDemo(username, repoName, branch, bookID, checkingOptions) {
//     // console.log(`checkTQbook(${username}, ${repoName}, ${branch}, ${bookID}, …)…`);

//     const repoCode = 'TQ';
//     const generalLocation = `in ${username} ${repoName} (${branch})`;

//     const ctqResult = { successList: [], noticeList: [] };

//     function addSuccessMessage(successString) {
//         // console.log(`checkBookPackage success: ${successString}`);
//         ctqResult.successList.push(successString);
//     }

//     function addNotice10({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra}) {
//         // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
//         // console.log(`checkTQbook addNotice10: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
//         console.assert(priority !== undefined, "cTQ addNotice10: 'priority' parameter should be defined");
//         console.assert(typeof priority === 'number', `cTQ addNotice10: 'priority' parameter should be a number not a '${typeof priority}'`);
//         console.assert(message !== undefined, "cTQ addNotice10: 'message' parameter should be defined");
//         console.assert(typeof message === 'string', `cTQ addNotice10: 'message' parameter should be a string not a '${typeof message}'`);
//         console.assert(bookID !== undefined, "cTQ addNotice10: 'bookID' parameter should be defined");
//         console.assert(typeof bookID === 'string', `cTQ addNotice10: 'bookID' parameter should be a string not a '${typeof bookID}'`);
//         console.assert(bookID.length === 3, `cTQ addNotice10: 'bookID' parameter should be three characters long not ${bookID.length}`);
//         console.assert(books.isValidBookID(bookID), `cTQ addNotice10: '${bookID}' is not a valid USFM book identifier`);
//         // console.assert(C !== undefined, "cTQ addNotice10: 'C' parameter should be defined");
//         if (C) console.assert(typeof C === 'string', `cTQ addNotice10: 'C' parameter should be a string not a '${typeof C}'`);
//         // console.assert(V !== undefined, "cTQ addNotice10: 'V' parameter should be defined");
//         if (V) console.assert(typeof V === 'string', `cTQ addNotice10: 'V' parameter should be a string not a '${typeof V}'`);
//         // console.assert(characterIndex !== undefined, "cTQ addNotice10: 'characterIndex' parameter should be defined");
//         if (characterIndex) console.assert(typeof characterIndex === 'number', `cTQ addNotice10: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
//         // console.assert(extract !== undefined, "cTQ addNotice10: 'extract' parameter should be defined");
//         if (extract) console.assert(typeof extract === 'string', `cTQ addNotice10: 'extract' parameter should be a string not a '${typeof extract}'`);
//         console.assert(location !== undefined, "cTQ addNotice10: 'location' parameter should be defined");
//         console.assert(typeof location === 'string', `cTQ addNotice10: 'location' parameter should be a string not a '${typeof location}'`);
//         console.assert(extra !== undefined, "cTQ addNotice10: 'extra' parameter should be defined");
//         console.assert(typeof extra === 'string', `cTQ addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
//         ctqResult.noticeList.push({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra});
//     }


//     async function ourCheckFileContents(repoCode, bookID, C, V, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
//         // console.log(`checkBookPackage ourCheckFileContents(${cfFilename})`);

//         // Updates the global list of notices
//         console.assert(repoCode !== undefined, "cTQ ourCheckFileContents: 'repoCode' parameter should be defined");
//         console.assert(typeof repoCode === 'string', `cTQ ourCheckFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
//         console.assert(cfFilename !== undefined, "cTQ ourCheckFileContents: 'cfFilename' parameter should be defined");
//         console.assert(typeof cfFilename === 'string', `cTQ ourCheckFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
//         console.assert(file_content !== undefined, "cTQ ourCheckFileContents: 'file_content' parameter should be defined");
//         console.assert(typeof file_content === 'string', `cTQ ourCheckFileContents: 'file_content' parameter should be a string not a '${typeof file_content}'`);
//         console.assert(fileLocation !== undefined, "cTQ ourCheckFileContents: 'fileLocation' parameter should be defined");
//         console.assert(typeof fileLocation === 'string', `cTQ ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

//         const cfResultObject = await checkFileContents(cfFilename, file_content, fileLocation, optionalCheckingOptions);
//         // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
//         // for (const successEntry of cfResultObject.successList) console.log("  ourCheckFileContents:", successEntry);

//         // Process results line by line,  appending the repoCode as an extra field as we go
//         for (const noticeEntry of cfResultObject.noticeList) {
//             // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
//             // console.assert(Object.keys(noticeEntry).length === 5, `cTQ ourCheckFileContents notice length=${Object.keys(noticeEntry).length}`);
//             // We add the repoCode as an extra value
//             addNotice10({priority:noticeEntry.priority, message:noticeEntry.message,
//                 bookID, C, V,
//                 filename:cfFilename, lineNumber:noticeEntry.lineNumber,
//                 characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
//                 location:noticeEntry.location, extra:repoCode});
//         }
//     }
//     // end of ourCheckFileContents function


//     // Main code for checkTQbook
//     // We need to find an check all the markdown folders/files for this book
//     let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(['md']), totalCheckedSize = 0;
//     const pathList = await getFilelistFromZip({ username, repository: repoName, branch, optionalPrefix: `${bookID.toLowerCase()}/` });
//     // console.log(`  Got ${pathList.length} pathList entries`)
//     const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : getFile;
//     for (const thisPath of pathList) {
//         // console.log("checkTQbook: Try to load", username, repoName, thisPath, branch);

//         console.assert(thisPath.endsWith('.md'), `Expected ${thisPath} to end with .md`);
//         const pathParts = thisPath.slice(0,-3).split('/');
//         const C = pathParts[pathParts.length-2].replace(/^0+(?=\d)/, '');
//         const V = pathParts[pathParts.length-1].replace(/^0+(?=\d)/, '');

//         let tqFileContent;
//         try {
//             tqFileContent = await getFile_({ username, repository: repoName, path: thisPath, branch });
//             // console.log("Fetched file_content for", repoName, thisPath, typeof tqFileContent, tqFileContent.length);
//             checkedFilenames.push(thisPath);
//             totalCheckedSize += tqFileContent.length;
//         } catch (tQerror) {
//             console.log("checkTQbook failed to load", username, repoName, thisPath, branch, tQerror + '');
//             addNotice10({priority:996, message:"Failed to load", bookID, C, V, repoName, filename:thisPath, location:`${generalLocation} ${thisPath}: ${tQerror}`, extra:repoCode});
//             continue;
//         }

//         // We use the generalLocation here (does not include repo name)
//         //  so that we can adjust the returned strings ourselves
//         await ourCheckFileContents(repoCode, bookID, C, V, thisPath, tqFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
//         checkedFileCount += 1;
//         // addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${thisPath}`);
//     }
//     addSuccessMessage(`Checked ${checkedFileCount.toLocaleString()} ${repoCode.toUpperCase()} file${checkedFileCount === 1 ? '' : 's'}`);

//     ctqResult.checkedFileCount = checkedFileCount;
//     ctqResult.checkedFilenames = checkedFilenames;
//     ctqResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
//     ctqResult.checkedFilesizes = totalCheckedSize;
//     // console.log(`  checkTQbook returning ${JSON.stringify(ctqResult)}`);
//     return ctqResult;
// }
// // end of checkTQbook function


// function getRepoName(languageCode, repoCode) {
//   let repo_languageCode = languageCode;
//   if (repoCode === 'UHB') repo_languageCode = 'hbo';
//   else if (repoCode === 'UGNT') repo_languageCode = 'el-x-koine';
//   const repoName = `${repo_languageCode}_${repoCode.toLowerCase()}`;
//   return repoName;
// }

// async function checkBookPackageDemo(username, languageCode, bookID, setResultValue, checkingOptions) {
//     // Note that bookID here can also be the 'OBS' pseudo bookID.

//     //     console.log(`I'm here in checkBookPackage v${VALIDATOR_VERSION_STRING}
//     //   with ${username}, ${languageCode}, ${bookID}, ${JSON.stringify(checkingOptions)}`);
//     const startTime = new Date();

//     let checkBookPackageResult = { successList: [], noticeList: [] };
//     const newCheckingOptions = checkingOptions ? { ...checkingOptions } : { }; // clone before modify

//     let getFile_ = newCheckingOptions.getFile ? newCheckingOptions.getFile : getFileCached; // default to using caching of files
//     newCheckingOptions.getFile = getFile_; // use same getFile_ when we call core functions

//     function addSuccessMessage(successString) {
//         // console.log(`checkBookPackage success: ${successString}`);
//         checkBookPackageResult.successList.push(successString);
//     }

//     function addNotice10({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra}) {
//         // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
//         // console.log(`checkBookPackage addNotice10: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
//         console.assert(priority !== undefined, "cBP addNotice10: 'priority' parameter should be defined");
//         console.assert(typeof priority === 'number', `cBP addNotice10: 'priority' parameter should be a number not a '${typeof priority}'`);
//         console.assert(message !== undefined, "cBP addNotice10: 'message' parameter should be defined");
//         console.assert(typeof message === 'string', `cBP addNotice10: 'message' parameter should be a string not a '${typeof message}'`);
//         // console.assert(bookID !== undefined, "cBP addNotice10: 'bookID' parameter should be defined");
//         if (bookID) {
//             console.assert(typeof bookID === 'string', `cBP addNotice10: 'bookID' parameter should be a string not a '${typeof bookID}'`);
//             console.assert(bookID.length === 3, `cBP addNotice10: 'bookID' parameter should be three characters long not ${bookID.length}`);
//             console.assert(books.isValidBookID(bookID), `cBP addNotice10: '${bookID}' is not a valid USFM book identifier`);
//         }
//         // console.assert(C !== undefined, "cBP addNotice10: 'C' parameter should be defined");
//         if (C) console.assert(typeof C === 'string', `cBP addNotice10: 'C' parameter should be a string not a '${typeof C}'`);
//         // console.assert(V !== undefined, "cBP addNotice10: 'V' parameter should be defined");
//         if (V) console.assert(typeof V === 'string', `cBP addNotice10: 'V' parameter should be a string not a '${typeof V}'`);
//         // console.assert(characterIndex !== undefined, "cBP addNotice10: 'characterIndex' parameter should be defined");
//         if (characterIndex) console.assert(typeof characterIndex === 'number', `cBP addNotice10: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
//         // console.assert(extract !== undefined, "cBP addNotice10: 'extract' parameter should be defined");
//         if (extract) console.assert(typeof extract === 'string', `cBP addNotice10: 'extract' parameter should be a string not a '${typeof extract}'`);
//         console.assert(location !== undefined, "cBP addNotice10: 'location' parameter should be defined");
//         console.assert(typeof location === 'string', `cBP addNotice10: 'location' parameter should be a string not a '${typeof location}'`);
//         console.assert(extra !== undefined, "cBP addNotice10: 'extra' parameter should be defined");
//         console.assert(typeof extra === 'string', `cBP addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
//         checkBookPackageResult.noticeList.push({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra});
//     }


//     async function ourCheckFileContents(repoCode, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
//         // console.log(`checkBookPackage ourCheckFileContents(${cfFilename})`);

//         // Updates the global list of notices
//         console.assert(repoCode !== undefined, "cBP ourCheckFileContents: 'repoCode' parameter should be defined");
//         console.assert(typeof repoCode === 'string', `cBP ourCheckFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
//         console.assert(cfFilename !== undefined, "cBP ourCheckFileContents: 'cfFilename' parameter should be defined");
//         console.assert(typeof cfFilename === 'string', `cBP ourCheckFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
//         console.assert(file_content !== undefined, "cBP ourCheckFileContents: 'file_content' parameter should be defined");
//         console.assert(typeof file_content === 'string', `cBP ourCheckFileContents: 'file_content' parameter should be a string not a '${typeof file_content}'`);
//         console.assert(fileLocation !== undefined, "cBP ourCheckFileContents: 'fileLocation' parameter should be defined");
//         console.assert(typeof fileLocation === 'string', `cBP ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

//         const cfResultObject = await checkFileContents(cfFilename, file_content, fileLocation, optionalCheckingOptions);
//         // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
//         // for (const successEntry of cfResultObject.successList) console.log("  ourCheckFileContents:", successEntry);

//         // Process results line by line,  appending the repoCode as an extra field as we go
//         for (const noticeEntry of cfResultObject.noticeList)
//             // noticeEntry is an object
//             // We add the repoCode as an extra value
//             addNotice10({priority:noticeEntry.priority, message:noticeEntry.message,
//                 bookID:noticeEntry.bookID, C:noticeEntry.C, V:noticeEntry.V, lineNumber:noticeEntry.lineNumber,
//                 characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
//                 location:noticeEntry.location, extra:repoCode});
//     }
//     // end of ourCheckFileContents function


//     // Main code for checkBookPackage()
//     clearCaches(); // make sure caches cleared to make sure no stale data
//     cachedUnzippedFiles = {}; // make sure caches cleared

//     const generalLocation = ` ${languageCode} ${bookID} book package from ${username}`;

//     // No point in passing the branch through as a parameter
//     //  coz if it's not 'master', it's unlikely to be common for all the repos
//     const branch = 'master'

//     if (bookID === 'OBS') {
//         // We use the generalLocation here (does not include repo name)
//         //  so that we can adjust the returned strings ourselves
//         // console.log("Calling OBS checkRepo()…");
//         checkBookPackageResult = await checkRepo(username, `${languageCode}_obs`, branch, generalLocation, setResultValue, newCheckingOptions); // Adds the notices to checkBookPackageResult
//         // console.log(`checkRepo() returned ${checkBookPackageResult.successList.length} success message(s) and ${checkBookPackageResult.noticeList.length} notice(s)`);
//         // console.log("crResultObject keys", JSON.stringify(Object.keys(checkBookPackageResult)));

//         // Concat is faster if we don't need to process each notice individually
//         // checkBookPackageResult.successList = checkBookPackageResult.successList.concat(crResultObject.successList);
//         // checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(crResultObject.noticeList);
//         // checkedFileCount += crResultObject.fileCount;
//         addSuccessMessage(`Checked ${languageCode} OBS repo from ${username}`);
//     } else {
//         // We also need to know the number for USFM books
//         let bookNumberAndName, whichTestament;
//         try {
//             bookNumberAndName = books.usfmNumberName(bookID);
//             whichTestament = books.testament(bookID); // returns 'old' or 'new'
//         } catch (bNNerror) {
//             if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
//                 whichTestament = 'other'
//             else {
//                 addNotice10({priority:901, message:"Bad function call: should be given a valid book abbreviation",
//                                 extract:bookID, location:` (not '${bookID}')${generalLocation}`});
//                 return checkBookPackageResult;
//             }
//         }
//         // console.log(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);

//         // So now we want to work through checking this one specified Bible book in various repos:
//         //  UHB/UGNT, ULT, UST, TN, TQ
//         let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = [];
//         const origLang = whichTestament === 'old' ? 'UHB' : 'UGNT';
//         for (const repoCode of [origLang, 'TA', 'TW']) {
//           const repoName = getRepoName(languageCode, repoCode);
//           console.log(`Preloading zip file for ${repoName})`);
//           const zipFetchSucceeded = await fetchRepositoryZipFile({ username, repository: repoName, branch });
//           if (!zipFetchSucceeded)
//             console.log(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
//         }
//         for (const repoCode of [origLang, 'ULT', 'UST', 'TN', 'TQ']) {
//             console.log(`Let's try ${repoCode} (${languageCode} ${bookID} from ${username})`);
//             // const repoLocation = ` in ${repoCode.toUpperCase()}${generalLocation}`;
//             const repoName = getRepoName(languageCode, repoCode);

//             // const fullRepoName = username + '/' + repoName;
//             // console.log("Let's try1", bookID, "from", fullRepoName);

//             let filename;
//             if (repoCode === 'UHB' || repoCode === 'UGNT' || repoCode === 'ULT' || repoCode === 'UST') {
//                 filename = `${bookNumberAndName}.usfm`;
//                 checkedFilenameExtensions.add('usfm');
//             }
//             else if (repoCode === 'TN') {
//                 filename = `${languageCode}_tn_${bookNumberAndName}.tsv`;
//                 checkedFilenameExtensions.add('tsv');
//             }

//             if (repoCode === 'TQ') {
//                 // This resource might eventually be converted to TSV tables
//                 const tqResultObject = await checkTQbook(username, repoName, branch, bookID, newCheckingOptions);
//                 checkBookPackageResult.successList = checkBookPackageResult.successList.concat(tqResultObject.successList);
//                 checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(tqResultObject.noticeList);
//                 checkedFilenames = checkedFilenames.concat(tqResultObject.checkedFilenames);
//                 checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...tqResultObject.checkedFilenameExtensions]);
//                 checkedFileCount += tqResultObject.checkedFileCount;
//                 totalCheckedSize += tqResultObject.totalCheckedSize;
//                 checkedRepoNames.push(repoCode);
//             } else { // For repos other than TQ, we only have one file to check
//                 // console.log("Try to load", username, repoName, filename, branch);
//                 let repoFileContent;
//                 try {
//                     repoFileContent = await getFile_({ username, repository: repoName, path: filename, branch });
//                     // console.log("Fetched file_content for", repoName, filename, typeof repoFileContent, repoFileContent.length);
//                     checkedFilenames.push(filename);
//                     totalCheckedSize += repoFileContent.length;
//                     checkedRepoNames.push(repoCode);
//                 } catch (cBPgfError) {
//                     console.log("ERROR: Failed to load", username, repoName, filename, branch, cBPgfError + '');
//                     addNotice10({priority:996, message:"Failed to load", bookID, repoName, filename, location:`${generalLocation} ${filename}: ${cBPgfError}`, extra:repoCode});
//                     continue;
//                 }

//                 // We use the generalLocation here (does not include repo name)
//                 //  so that we can adjust the returned strings ourselves
//                 await ourCheckFileContents(repoCode, filename, repoFileContent, generalLocation, newCheckingOptions); // Adds the notices to checkBookPackageResult
//                 checkedFileCount += 1;
//                 addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${filename}`);
//             }

//             // Update our "waiting" message
//             setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {languageCode} <b>{bookID}</b> book package: checked <b>{checkedRepoNames.length.toLocaleString()}</b>/5 repos…</p>);
//         }

//         // Add some extra fields to our checkFileResult object
//         //  in case we need this information again later
//         checkBookPackageResult.checkedFileCount = checkedFileCount;
//         checkBookPackageResult.checkedFilenames = checkedFilenames;
//         checkBookPackageResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
//         checkBookPackageResult.checkedFilesizes = totalCheckedSize;
//         checkBookPackageResult.checkedRepoNames = checkedRepoNames;
//         // checkBookPackageResult.checkedOptions = checkingOptions; // This is done at the caller level
//     }

//     // console.log("checkBookPackage() is returning", checkBookPackageResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackageResult.noticeList.length.toLocaleString(), "notice(s)");
//     checkBookPackageResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
//     return checkBookPackageResult;
// };
// // end of checkBookPackage()

// export default checkBookPackageDemo;
