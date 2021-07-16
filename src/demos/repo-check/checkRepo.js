import React from 'react';
import { REPO_CODES_LIST } from '../../core/defaults';
// eslint-disable-next-line no-unused-vars
import * as books from '../../core/books/books';
import { checkFileContents } from '../file-check/checkFileContents';
import { repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetRepositoryZipFile } from '../../core/getApi';
// eslint-disable-next-line no-unused-vars
import { functionLog, debugLog, logicAssert, parameterAssert } from '../../core/utilities';


// const REPO_VALIDATOR_VERSION_STRING = '0.4.11';


/**
 *
 * @param {string} username
 * @param {string} repoName
 * @param {string} repoBranch
 * @param {string} givenLocation
 * @param {Function} setResultValue
 * @param {Object} checkingOptions
 */
export async function checkRepo(username, repoName, repoBranch, givenLocation, setResultValue, checkingOptions) {
  /*
  It returns an object containing:
      successList: an array of strings to tell the use exactly what has been checked
      noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
  */
  // functionLog(`checkRepo(un='${username}', rN='${repoName}', rBr='${repoBranch}', ${givenLocation}, (fn), ${JSON.stringify(checkingOptions)})…`);
  //parameterAssert(username !== undefined, "checkRepo: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkRepo: 'username' parameter should be a string not a '${typeof username}'`);
  //parameterAssert(repoName !== undefined, "checkRepo: 'repoName' parameter should be defined");
  //parameterAssert(typeof repoName === 'string', `checkRepo: 'repoName' parameter should be a string not a '${typeof repoName}'`);
  //parameterAssert(repoBranch !== undefined, "checkRepo: 'repoBranch' parameter should be defined");
  //parameterAssert(typeof repoBranch === 'string', `checkRepo: 'repoBranch' parameter should be a string not a '${typeof repoBranch}'`);
  //parameterAssert(givenLocation !== undefined, "checkRepo: 'givenRowLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkRepo: 'givenRowLocation' parameter should be a string not a '${typeof givenLocation}'`);

  let abortFlag = false;
  const startTime = new Date();

  let [languageCode, repoCode] = repoName.split('_');
  repoCode = repoCode.toUpperCase();
  // debugLog(`checkRepo got languageCode='${languageCode}' repoCode='${repoCode}' repoBranch='${repoBranch}'`);
  if (repoCode === 'TN2') {
    repoCode = 'TN';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'TQ2') {
    repoCode = 'TQ';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'SN2') {
    repoCode = 'SN';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'SQ2') {
    repoCode = 'SQ';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode.endsWith('LT')) repoCode = 'LT';
  else if (repoCode.endsWith('ST')) repoCode = 'ST';
  // debugLog(`checkRepo now has languageCode='${languageCode}' repoCode='${repoCode}' repoBranch='${repoBranch}'`);
  logicAssert(REPO_CODES_LIST.includes(repoCode), `checkRepo: 'repoCode' parameter should not be '${repoCode}'`);

  if (repoBranch === undefined) repoBranch = 'master'; // Ideally we should ask what the default branch is

  let checkRepoResult = {
    successList: [], noticeList: [],
    checkedFileCount: 0, checkedFileSizes: 0,
    checkedFilenames: [], checkedFilenameExtensions: [], checkedRepoNames: [],
  };

  function addSuccessMessage(successString) {
    // Adds the message to the result that we will later return
    // functionLog(`checkRepo success: ${successString}`);
    checkRepoResult.successList.push(successString);
  }
  function addNoticePartial(noticeObject) {
    // Adds the notices to the result that we will later return
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // Note that bookID,C,V might all be empty strings (as some repos don’t have BCV)
    // functionLog(`checkRepo addNoticePartial: ${noticeObject.priority}:${noticeObject.message} bookID=${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.filename}:${noticeObject.lineNumber} ${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
    //parameterAssert(noticeObject.priority !== undefined, "cR addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof noticeObject.priority === 'number', `cR addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
    //parameterAssert(noticeObject.message !== undefined, "cR addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof noticeObject.message === 'string', `cR addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
    // //parameterAssert(bookID !== undefined, "cR addNoticePartial: 'bookID' parameter should be defined");
    if (noticeObject.bookID) {
      //parameterAssert(typeof noticeObject.bookID === 'string', `cR addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
      //parameterAssert(noticeObject.bookID.length === 3, `cR addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
      //parameterAssert(noticeObject.bookID === 'OBS' || books.isOptionalValidBookID(noticeObject.bookID), `cR addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // //parameterAssert(C !== undefined, "cR addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) { //parameterAssert(typeof noticeObject.C === 'string', `cR addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
    }
    // //parameterAssert(V !== undefined, "cR addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) { //parameterAssert(typeof noticeObject.V === 'string', `cR addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
    }
    // //parameterAssert(characterIndex !== undefined, "cR addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cR addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
    }
    // //parameterAssert(excerpt !== undefined, "cR addNoticePartial: 'excerpt' parameter should be defined");
    if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cR addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}'`);
    }
    //parameterAssert(noticeObject.location !== undefined, "cR addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof noticeObject.location === 'string', `cR addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
    // //parameterAssert(noticeObject.extra !== undefined, "cR addNoticePartial: 'extra' parameter should be defined");
    //parameterAssert(typeof noticeObject.extra === 'string', `cR addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}'`);
    if (noticeObject.debugChain) noticeObject.debugChain = `checkRepo ${noticeObject.debugChain}`;
    // Add in the repoName from the outer scope
    checkRepoResult.noticeList.push({ ...noticeObject, username, repoCode, repoName });
  }


  /**
   *
   * @param {string} bookOrFileCode
   * @param {string} cfBookID
   * @param {string} filename
   * @param {string} fileContent
   * @param {string} fileLocation
   * @param {Object} checkingOptions
   */
  async function ourCheckRepoFileContents(bookOrFileCode, cfBookID, filename, fileContent, fileLocation, checkingOptions) {
    // We assume that checking for compulsory fields is done elsewhere
    // functionLog(`checkRepo ourCheckRepoFileContents(bk/fC='${bookOrFileCode}', bk='${cfBookID}', fn='${filename}', ${fileContent.length}, ${fileLocation}, ${JSON.stringify(checkingOptions)})…`);

    // Updates the global list of notices
    //parameterAssert(bookOrFileCode !== undefined, "ourCheckRepoFileContents: 'bookOrFileCode' parameter should be defined");
    //parameterAssert(typeof bookOrFileCode === 'string', `ourCheckRepoFileContents: 'bookOrFileCode' parameter should be a string not a '${typeof bookOrFileCode}'`);
    //parameterAssert(cfBookID !== undefined, "ourCheckRepoFileContents: 'cfBookID' parameter should be defined");
    //parameterAssert(typeof cfBookID === 'string', `ourCheckRepoFileContents: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
    if (cfBookID) {
      //parameterAssert(cfBookID.length === 3, `ourCheckRepoFileContents: 'cfBookID' parameter should be three characters long not ${cfBookID.length}`);
      //parameterAssert(cfBookID.toUpperCase() === cfBookID, `ourCheckRepoFileContents: 'cfBookID' parameter should be UPPERCASE not '${cfBookID}'`);
      //parameterAssert(cfBookID === 'OBS' || books.isValidBookID(cfBookID), `ourCheckRepoFileContents: '${cfBookID}' is not a valid USFM book identifier`);
    }
    //parameterAssert(filename !== undefined, "ourCheckRepoFileContents: 'filename' parameter should be defined");
    //parameterAssert(typeof filename === 'string', `ourCheckRepoFileContents: 'filename' parameter should be a string not a '${typeof filename}'`);
    //parameterAssert(fileContent !== undefined, "ourCheckRepoFileContents: 'fileContent' parameter should be defined");
    //parameterAssert(typeof fileContent === 'string', `ourCheckRepoFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    //parameterAssert(fileLocation !== undefined, "ourCheckRepoFileContents: 'fileLocation' parameter should be defined");
    //parameterAssert(typeof fileLocation === 'string', `ourCheckRepoFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "ourCheckRepoFileContents: 'checkingOptions' parameter should be defined");

    let adjustedLanguageCode = languageCode;
    if (filename === 'manifest.yaml' || filename === 'LICENSE.md'
      || ((languageCode === 'el-x-koine' || languageCode === 'hbo') && filename === 'README.md'))
      adjustedLanguageCode = 'en'; // Correct the language for these auxilliary files
    const cfcResultObject = await checkFileContents(username, adjustedLanguageCode, repoCode, repoBranch, filename, fileContent, fileLocation, checkingOptions);
    // debugLog("checkFileContents() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
    // for (const successEntry of resultObject.successList)
    //     userLog("  ", successEntry);

    // Process noticeList line by line,  appending the bookOrFileCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList)
      // We add the bookOrFileCode as an extra value (unless it’s already there from a TA or TW check)
      if (cfcNoticeEntry.extra)
        checkRepoResult.noticeList.push(cfcNoticeEntry); // Add this notice directly
      else {
        // addNoticePartial({ ...cfcNoticeEntry, bookID: cfBookID, extra: bookOrFileCode.toUpperCase() });
        const newNoticeObject = { ...cfcNoticeEntry, bookID: cfBookID };
        if (bookOrFileCode !== '01' // UGL (from content/G04230/01.md)
        && (bookOrFileCode[0]!=='H' || bookOrFileCode.length!==5)) // UHAL, e.g., H0612 from content/H0612.md
          newNoticeObject.extra = bookOrFileCode.toUpperCase();
        addNoticePartial(newNoticeObject);
      }
    /* Removing the following code as it’s unneeded
    //  as we don’t enable TA or TW checking per repo anyway
    // Anyway, not sure that the following code was working yet
    if (repoName.endsWith('_tn')) {
      // The following is needed coz we might be checking the linked TA and/or TW articles from TN2 TSV files
      userLog(`cfcResultObject JSON.stringify({ ...cfcResultObject, noticeList: "deleted" })`);
      if (cfcResultObject.checkedFileCount && cfcResultObject.checkedFileCount > 0) {
        checkRepoResult.checkedFileCount += cfcResultObject.checkedFileCount;
        addSuccessMessage(`Checked ${cfcResultObject.checkedFileCount} linked TA/TW articles`);
      }
      if (cfcResultObject.checkedFilesizes && cfcResultObject.checkedFilesizes > 0) checkRepoResult.totalCheckedSize += cfcResultObject.checkedFilesizes;
      if (cfcResultObject.checkedRepoNames && cfcResultObject.checkedRepoNames.length > 0)
        for (const checkedRepoName of cfcResultObject.checkedRepoNames)
          try { if (checkRepoResult.checkedRepoNames.indexOf(checkedRepoName) < 0) checkRepoResult.checkedRepoNames.push(checkedRepoName); }
          catch { checkRepoResult.checkedRepoNames = [checkedRepoName]; }
      if (cfcResultObject.checkedFilenameExtensions && cfcResultObject.checkedFilenameExtensions.length > 0)
        for (const checkedFilenameExtension of cfcResultObject.checkedFilenameExtensions)
          checkRepoResult.checkedFilenameExtensions.add(checkedFilenameExtension);
    }
    */
  }
  // end of ourCheckRepoFileContents function


  // Main code for checkRepo()
  if (! await repositoryExistsOnDoor43({ username, repository: repoName })) {
    setResultValue(<p style={{ color: 'red' }}>No such <b>{username}/{repoName}</b> repository!</p>);
    console.error(`checkRepo ${username}/${repoName} doesn’t seem to exist`);
    addNoticePartial({ priority: 986, message: "Repository doesn’t seem to exist", details: `username=${username}`, location: givenLocation, extra: repoName });
  } else {

    // Put all this in a try/catch block coz otherwise it’s difficult to debug/view errors
    try {
      let ourLocation = givenLocation;
      if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
      // if (ourLocation.indexOf(username) < 0)
      // ourLocation = ` in ${username} ${repoName} ${givenLocation}`

      // Update our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Fetching zipped files from <b>{username}/{repoName}</b> repository…</p>);

      // Let’s fetch the zipped repo since it should be much more efficient than individual fetches
      // functionLog(`checkRepo: fetch zip file for ${repoName}…`);
      const fetchRepositoryZipFile_ = (checkingOptions && checkingOptions.fetchRepositoryZipFile) ? checkingOptions.fetchRepositoryZipFile : cachedGetRepositoryZipFile;
      const zipFetchSucceeded = await fetchRepositoryZipFile_({ username, repository: repoName, branch: repoBranch, branchOrRelease: repoBranch });
      if (!zipFetchSucceeded) {
        console.error(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
        setResultValue(<p style={{ color: 'red' }}>Failed to fetching zipped files from <b>{username}/{repoName}</b> repository</p>);
        addNoticePartial({ priority: 989, message: "Unable to find/load repository", location: ourLocation });
        return checkRepoResult;
      }

      // Now we need to fetch the list of files from the repo
      setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
      // const pathList = await getFileListFromFetchedTreemaps(username, repoName, branch);
      const getFileListFromZip_ = checkingOptions && checkingOptions.getFileListFromZip ? checkingOptions.getFileListFromZip : getFileListFromZip;
      const pathList = await getFileListFromZip_({ username, repository: repoName, branchOrRelease: repoBranch });
      // debugLog(`Got pathlist (${pathList.length}) = ${pathList}`);


      // So now we want to work through checking all the files in this repo
      // Main loop for checkRepo()
      const countString = `${pathList.length.toLocaleString()} file${pathList.length === 1 ? '' : 's'}`;
      let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
      for (const thisFilepath of pathList) {
        // debugLog(`checkRepo: at top of loop: thisFilepath='${thisFilepath}'`);
        // if (repoCode === 'UHAL' || repoCode === 'UGL') { // temp .........................XXXXXXXXXXXXXXXXXXX
        //   if (thisFilepath.startsWith('LXX_Mapping/')) continue; // skip
        //   if (checkedFileCount > 100) break;
        // }
        if (abortFlag) break;

        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Checking <b>{username}/{repoName}</b> repo: checked {checkedFileCount.toLocaleString()}/{countString}…</p>);

        const thisFilename = thisFilepath.split('/').pop();
        // debugLog(`thisFilename=${thisFilename}`);
        const thisFilenameExtension = thisFilename.split('.').pop();
        // debugLog(`thisFilenameExtension=${thisFilenameExtension}`);

        // Default to the main filename without the extension
        let bookOrFileCode = thisFilename.substring(0, thisFilename.length - thisFilenameExtension.length - 1);
        let ourBookID = '';
        if (thisFilenameExtension === 'usfm') {
          // const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
          // debugLog(`Have USFM filenameMain=${bookOrFileCode}`);
          const bookID = bookOrFileCode.substring(bookOrFileCode.length - 3).toUpperCase();
          // debugLog(`Have USFM bookcode=${bookID}`);
          //parameterAssert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for USFM)`);
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }
        else if (thisFilenameExtension === 'tsv') {
          // debugLog(`Have TSV thisFilename(${thisFilename.length})='${thisFilename}'`);
          // debugLog(`Have TSV bookOrFileCode(${bookOrFileCode.length})='${bookOrFileCode}'`);
          let bookID;
          // bookOrFileCode could be something like 'en_tn_09-1SA.tsv ' or 'tn_2CO' or 'twl_1CH'
          // bookID = (bookOrFileCode.length === 6 || bookOrFileCode.length === 7) ? bookOrFileCode.substring(0, 3) : bookOrFileCode.slice(-3).toUpperCase();
          bookID = bookOrFileCode.slice(-3).toUpperCase();
          logicAssert(bookID !== 'twl' && bookID !== 'TWL', `Should get a valid bookID here, not '${bookID}'`)
          // debugLog(`Have TSV bookcode(${bookID.length})='${bookID}'`);
          if (repoCode === 'TWL' || repoCode === 'SN' || repoCode === 'SQ' || repoCode === 'TN2' || repoCode === 'TQ2') {// new repos allow `OBS`
            //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for TSV)`);
          } else {
            //parameterAssert(bookID !== 'OBS' && books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for TSV)`);
          }
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }
        else if (repoName.endsWith('_ta') && thisFilepath.indexOf('/') > 0)
          bookOrFileCode = thisFilepath.split('/')[1];
        else if (repoName.endsWith('_tq') && thisFilepath.indexOf('/') > 0)
          bookOrFileCode = thisFilepath.split('/')[0];

        // debugLog("checkRepo: Try to load", username, repoName, thisFilepath, branch);
        const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : cachedGetFile;
        let repoFileContent;
        try {
          repoFileContent = await getFile_({ username, repository: repoName, path: thisFilepath, branch: repoBranch });
          // debugLog("Fetched fileContent for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
        } catch (cRgfError) {
          console.error(`checkRepo(${username}, ${repoName}, ${repoBranch}, ${givenLocation}, (fn), ${JSON.stringify(checkingOptions)})) failed to load`, thisFilepath, repoBranch, `${cRgfError}`);
          let details = `username=${username}`;
          if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
            checkRepoResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: givenLocation, extra: repoCode });
          else {
            // eslint-disable-next-line eqeqeq
            if (cRgfError != 'TypeError: repoFileContent is null') details += ` error=${cRgfError}`;
            addNoticePartial({ priority: 996, message: "Unable to load", details: `username=${username} error=${cRgfError}`, bookID: ourBookID, filename: thisFilename, location: `${givenLocation} ${thisFilepath}`, extra: repoName });
          }
          return;
        }
        if (repoFileContent) {
          // functionLog(`checkRepo for ${repoName} checking ${thisFilename}`);
          await ourCheckRepoFileContents(bookOrFileCode, ourBookID,
            // OBS has many files with the same name, so we have to give some of the path as well
            // repoName.endsWith('_obs') ? thisFilepath.replace('content/', '') : thisFilename,
            thisFilenameExtension === 'md' ? thisFilepath.replace('content/', '').replace('bible/', '') : thisFilename,
            repoFileContent, ourLocation, checkingOptions);
          checkedFileCount += 1;
          checkedFilenames.push(thisFilename);
          checkedFilenameExtensions.add(thisFilenameExtension);
          totalCheckedSize += repoFileContent.length;
          // functionLog(`checkRepo checked ${thisFilename}`);
          if (thisFilenameExtension !== 'md') // There's often far, far too many of these
            addSuccessMessage(`Checked ${repoName} ${bookOrFileCode.toUpperCase()} file: ${thisFilename}`);
        }
      }

      // Check that we processed a license and a manifest
      if (checkedFilenames.indexOf('LICENSE.md') < 0)
        addNoticePartial({ priority: 946, message: "Missing LICENSE.md", location: ourLocation, extra: `${repoName} LICENSE` });
      if (checkedFilenames.indexOf('manifest.yaml') < 0)
        addNoticePartial({ priority: 947, message: "Missing manifest.yaml", location: ourLocation, extra: `${repoName} MANIFEST` });

      // Add some extra fields to our checkRepoResult object
      //  in case we need this information again later
      checkRepoResult.checkedFileCount += checkedFileCount;
      checkRepoResult.checkedFilenames = checkedFilenames;
      checkRepoResult.checkedFilenameExtensions = [...checkRepoResult.checkedFilenameExtensions, ...checkedFilenameExtensions]; // convert Set to Array
      checkRepoResult.checkedFilesizes += totalCheckedSize;
      checkRepoResult.checkedRepoNames.unshift(`${username}/${repoName}`);
      // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

      addSuccessMessage(`Checked ${username} repo: ${repoName}`);
      // functionLog(`checkRepo() is returning ${checkRepoResult.successList.length.toLocaleString()} success message(s) and ${checkRepoResult.noticeList.length.toLocaleString()} notice(s)`);
    } catch (cRerror) {
      console.error(`checkRepo main code block got error: ${cRerror.message}`);
      setResultValue(<>
        <p style={{ color: 'red' }}>checkRepo main code block got error: <b>{cRerror.message}</b> with {cRerror.trace}</p>
      </>);

    }
  }
  checkRepoResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog(`checkRepo() returning ${JSON.stringify(checkRepoResult)}`);
  return checkRepoResult;
};
// end of checkRepo()
