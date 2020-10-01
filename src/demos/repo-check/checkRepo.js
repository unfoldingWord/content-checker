import React from 'react';
import * as books from '../../core/books/books';
import { repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetRepositoryZipFile } from '../../core';
import { checkFileContents } from '../file-check/checkFileContents';


/*
    checkRepo
*/
export async function checkRepo(username, repoName, branch, givenLocation, setResultValue, checkingOptions) {
  /*
  It returns an object containing:
      successList: an array of strings to tell the use exactly what has been checked
      noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
  */
  // console.log(`checkRepo(${username}, ${repoName}, ${branch}, ${givenLocation}, (fn), ${JSON.stringify(checkingOptions)})…`);
  const startTime = new Date();

  const languageCode = repoName.split('_')[0];
  // console.log("checkRepo languageCode", languageCode);

  if (branch === undefined) branch = 'master'; // Ideally we should ask what the default branch is

  let checkRepoResult = {
    successList: [], noticeList: [],
    checkedFileCount: 0, checkedFilenames: [], checkedFilenameExtensions: []
  };

  function addSuccessMessage(successString) {
    // Adds the message to the result that we will later return
    // console.log(`checkRepo success: ${successString}`);
    checkRepoResult.successList.push(successString);
  }
  function addNoticePartial(noticeObject) {
    // Adds the notices to the result that we will later return
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // Note that bookID,C,V might all be empty strings (as some repos don't have BCV)
    // console.log(`checkRepo addNoticePartial: ${noticeObject.priority}:${noticeObject.message} ${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.filename}:${noticeObject.lineNumber} ${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
    console.assert(noticeObject.priority !== undefined, "cR addNoticePartial: 'priority' parameter should be defined");
    console.assert(typeof noticeObject.priority === 'number', `cR addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
    console.assert(noticeObject.message !== undefined, "cR addNoticePartial: 'message' parameter should be defined");
    console.assert(typeof noticeObject.message === 'string', `cR addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
    // console.assert(bookID !== undefined, "cR addNoticePartial: 'bookID' parameter should be defined");
    if (noticeObject.bookID) {
      console.assert(typeof noticeObject.bookID === 'string', `cR addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
      console.assert(noticeObject.bookID.length === 3, `cR addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
      console.assert(books.isOptionalValidBookID(noticeObject.bookID), `cR addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // console.assert(C !== undefined, "cR addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `cR addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
    // console.assert(V !== undefined, "cR addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `cR addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
    // console.assert(characterIndex !== undefined, "cR addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cR addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
    // console.assert(extract !== undefined, "cR addNoticePartial: 'extract' parameter should be defined");
    if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cR addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}'`);
    console.assert(noticeObject.location !== undefined, "cR addNoticePartial: 'location' parameter should be defined");
    console.assert(typeof noticeObject.location === 'string', `cR addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
    console.assert(noticeObject.extra !== undefined, "cR addNoticePartial: 'extra' parameter should be defined");
    console.assert(typeof noticeObject.extra === 'string', `cR addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}'`);
    // Add in the repoName from the outer scope
    checkRepoResult.noticeList.push({ ...noticeObject, repoName });
  }


  async function ourCheckRepoFileContents(bookOrFileCode, cfBookID, filename, fileContent, fileLocation, optionalCheckingOptions) {
    // We assume that checking for compulsory fields is done elsewhere
    // console.log(`checkRepo ourCheckRepoFileContents(${filename})…`);

    // Updates the global list of notices
    console.assert(bookOrFileCode !== undefined, "ourCheckRepoFileContents: 'bookOrFileCode' parameter should be defined");
    console.assert(typeof bookOrFileCode === 'string', `ourCheckRepoFileContents: 'bookOrFileCode' parameter should be a string not a '${typeof bookOrFileCode}'`);
    console.assert(cfBookID !== undefined, "ourCheckRepoFileContents: 'cfBookID' parameter should be defined");
    console.assert(typeof cfBookID === 'string', `ourCheckRepoFileContents: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
    console.assert(filename !== undefined, "ourCheckRepoFileContents: 'filename' parameter should be defined");
    console.assert(typeof filename === 'string', `ourCheckRepoFileContents: 'filename' parameter should be a string not a '${typeof filename}'`);
    console.assert(fileContent !== undefined, "ourCheckRepoFileContents: 'fileContent' parameter should be defined");
    console.assert(typeof fileContent === 'string', `ourCheckRepoFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    console.assert(fileLocation !== undefined, "ourCheckRepoFileContents: 'fileLocation' parameter should be defined");
    console.assert(typeof fileLocation === 'string', `ourCheckRepoFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

    const cfcResultObject = await checkFileContents(languageCode, filename, fileContent, fileLocation, optionalCheckingOptions);
    // console.log("checkFileContents() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
    // for (const successEntry of resultObject.successList)
    //     console.log("  ", successEntry);

    // Process results line by line,  appending the bookOrFileCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList)
      // We add the bookOrFileCode as an extra value
      addNoticePartial({ ...cfcNoticeEntry, bookID: cfBookID, extra: bookOrFileCode });
  }
  // end of ourCheckRepoFileContents function


  // Main code for checkRepo()
  if (! await repositoryExistsOnDoor43({ username, repository: repoName })) {
    setResultValue(<p style={{ color: 'red' }}>No such <b>{username}/{repoName}</b> repository!</p>);
    console.error(`checkRepo ${username}/${repoName} doesn't seem to exist`);
    addNoticePartial({ priority: 986, message: "Failed to fetch repo", details: `username=${username}`, location: givenLocation, extra: repoName });
  } else {

    // Put all this in a try/catch block coz otherwise it's difficult to debug/view errors
    try {
      let ourLocation = givenLocation;
      if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
      // if (ourLocation.indexOf(username) < 0)
      // ourLocation = ` in ${username} ${repoName} ${givenLocation}`

      // Update our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Fetching zipped files from <b>{username}/{repoName}</b> repository…</p>);

      // Let's fetch the zipped repo since it should be much more efficient than individual fetches
      // console.log(`checkRepo: fetch zip file for ${repoName}…`);
      const fetchRepositoryZipFile_ = (checkingOptions && checkingOptions.fetchRepositoryZipFile) ? checkingOptions.fetchRepositoryZipFile : cachedGetRepositoryZipFile;
      const zipFetchSucceeded = await fetchRepositoryZipFile_({ username, repository: repoName, branch });
      if (!zipFetchSucceeded) {
        console.error(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
        setResultValue(<p style={{ color: 'red' }}>Failed to fetching zipped files from <b>{username}/{repoName}</b> repository</p>);
        addNoticePartial({ priority: 989, message: "Failed to find/load repository", location: ourLocation });
        return checkRepoResult;
      }

      // Now we need to fetch the list of files from the repo
      setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
      // const pathList = await getFileListFromFetchedTreemaps(username, repoName, branch);
      const getFileListFromZip_ = checkingOptions && checkingOptions.getFileListFromZip ? checkingOptions.getFileListFromZip : getFileListFromZip;
      const pathList = await getFileListFromZip_({ username, repository: repoName, branch });
      // console.log(`Got pathlist (${pathList.length}) = ${pathList}`);

      // So now we want to work through checking all the files in this repo
      const countString = `${pathList.length.toLocaleString()} file${pathList.length === 1 ? '' : 's'}`;
      let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
      for (const thisFilepath of pathList) {
        // console.log(`At top of loop: thisFilepath='${thisFilepath}'`);

        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Checking <b>{username}/{repoName}</b> repo: checked {checkedFileCount.toLocaleString()}/{countString}…</p>);

        const thisFilename = thisFilepath.split('/').pop();
        // console.log(`thisFilename=${thisFilename}`);
        const thisFilenameExtension = thisFilename.split('.').pop();
        // console.log(`thisFilenameExtension=${thisFilenameExtension}`);

        // Default to the main filename without the extensions
        let bookOrFileCode = thisFilename.substring(0, thisFilename.length - thisFilenameExtension.length - 1);
        let ourBookID = "";
        if (thisFilenameExtension === 'usfm') {
          // const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
          // console.log(`Have USFM filenameMain=${bookOrFileCode}`);
          const bookID = bookOrFileCode.substring(bookOrFileCode.length - 3);
          // console.log(`Have USFM bookcode=${bookID}`);
          console.assert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier`);
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }
        else if (thisFilenameExtension === 'tsv') {
          // const filenameMain = thisFilename.substring(0, thisFilename.length - 4); // drop .tsv
          // console.log(`Have TSV filenameMain=${bookOrFileCode}`);
          const bookID = bookOrFileCode.substring(bookOrFileCode.length - 3);
          // console.log(`Have TSV bookcode=${bookID}`);
          console.assert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier`);
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }

        // console.log("checkRepo: Try to load", username, repoName, thisFilepath, branch);
        const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : cachedGetFile;
        let repoFileContent;
        try {
          repoFileContent = await getFile_({ username, repository: repoName, path: thisFilepath, branch });
          // console.log("Fetched fileContent for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
        } catch (cRgfError) {
          console.error(`checkRepo(${username}, ${repoName}, ${branch}, ${givenLocation}, (fn), ${JSON.stringify(checkingOptions)})) failed to load`, thisFilepath, branch, `${cRgfError}`);
          addNoticePartial({ priority: 996, message: "Failed to load", details: `username=${username}`, bookID: ourBookID, filename: thisFilename, location: `${givenLocation} ${thisFilepath}: ${cRgfError}`, extra: repoName });
          return;
        }
        if (repoFileContent) {
          // console.log(`checkRepo for ${repoName} checking ${thisFilename}`);
          await ourCheckRepoFileContents(bookOrFileCode, ourBookID,
            // OBS has many files with the same name, so we have to give some of the path as well
            repoName.endsWith('_obs') ? thisFilepath.replace('content/', '') : thisFilename,
            repoFileContent, ourLocation, checkingOptions);
          checkedFileCount += 1;
          checkedFilenames.push(thisFilename);
          checkedFilenameExtensions.add(thisFilenameExtension);
          totalCheckedSize += repoFileContent.length;
          // console.log(`checkRepo checked ${thisFilename}`);
          if (thisFilenameExtension !== 'md') // There's often far, far too many of these
            addSuccessMessage(`Checked ${bookOrFileCode.toUpperCase()} file: ${thisFilename}`);
        }
      }

      // Check that we processed a license and a manifest
      if (checkedFilenames.indexOf('LICENSE.md') < 0)
        addNoticePartial({ priority: 946, message: "Missing LICENSE.md", location: ourLocation, extra: 'LICENSE' });
      if (checkedFilenames.indexOf('manifest.yaml') < 0)
        addNoticePartial({ priority: 947, message: "Missing manifest.yaml", location: ourLocation, extra: 'MANIFEST' });

      // Add some extra fields to our checkRepoResult object
      //  in case we need this information again later
      checkRepoResult.checkedFileCount = checkedFileCount;
      checkRepoResult.checkedFilenames = checkedFilenames;
      checkRepoResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
      checkRepoResult.checkedFilesizes = totalCheckedSize;
      checkRepoResult.checkedRepoNames = [`${username}/${repoName}`];
      // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

      addSuccessMessage(`Checked ${username} repo: ${repoName}`);
      // console.log(`checkRepo() is returning ${checkRepoResult.successList.length.toLocaleString()} success message(s) and ${checkRepoResult.noticeList.length.toLocaleString()} notice(s)`);
    } catch (cRerror) {
      console.error(`checkRepo main code block got error: ${cRerror.message}`);
      setResultValue(<>
        <p style={{ color: 'red' }}>checkRepo main code block got error: <b>{cRerror.message}</b></p>
      </>);

    }
  }
  checkRepoResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // console.log(`checkRepo() returning ${JSON.stringify(checkRepoResult)}`);
  return checkRepoResult;
};
// end of checkRepo()