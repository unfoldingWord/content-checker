// eslint-disable-next-line no-unused-vars
import * as books from '../../core/books/books';
import {
  // eslint-disable-next-line no-unused-vars
  REPO_CODES_LIST,
  formRepoName,
  checkUSFMText, checkMarkdownFileContents, checkLexiconFileContents, checkPlainText, checkYAMLText, checkManifestText,
  checkTN_TSV9Table, checkNotesTSV7Table, checkQuestionsTSV7Table, checkTWL_TSV6Table,
} from '../../core';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, logicAssert } from '../../core';


// const CHECK_FILE_CONTENTS_VERSION_STRING = '0.5.0';


/**
 *
 * @param {string} username for Door43.org
 * @param {string} languageCode, e.g., 'en'
 * @param {string} repoCode, e.g., 'LT', 'TN', 'TN2', 'TQ', 'TWL', etc.
 * @param {string} branch, e.g., 'master'
 * @param {string} filepath -- often just a filename
 * @param {string} fileContent
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkFileContents(username, languageCode, repoCode, branch, filepath, fileContent, givenLocation, checkingOptions) {
  // Determine the file type from the filename extension
  //  and return the results of checking that kind of file text
  // functionLog(`checkFileContents(un='${username}', lC='${languageCode}', rC='${repoCode}', rBr='${branch}', fn='${filepath}', ${fileContent.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
  //parameterAssert(username !== undefined, "checkFileContents: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkFileContents: 'username' parameter should be a string not a '${typeof username}': ${username}`);
  //parameterAssert(languageCode !== undefined, "checkFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  //parameterAssert(repoCode !== undefined, "checkFileContents: 'repoCode' parameter should be defined");
  //parameterAssert(typeof repoCode === 'string', `checkFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
  //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkFileContents: 'repoCode' parameter should not be '${repoCode}'`);
  //parameterAssert(branch !== undefined, "checkFileContents: 'branch' parameter should be defined");
  //parameterAssert(typeof branch === 'string', `checkFileContents: 'branch' parameter should be a string not a '${typeof branch}': ${branch}`);
  //parameterAssert(filepath !== undefined, "checkFileContents: 'filepath' parameter should be defined");
  //parameterAssert(typeof filepath === 'string', `checkFileContents: 'filepath' parameter should be a string not a '${typeof filepath}': ${filepath}`);
  //parameterAssert(fileContent !== undefined, "checkFileContents: 'fileContent' parameter should be defined");
  //parameterAssert(typeof fileContent === 'string', `checkFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}': ${fileContent.length}`);
  //parameterAssert(givenLocation !== undefined, "checkFileContents: 'givenLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  //parameterAssert(checkingOptions !== undefined, "checkFileContents: 'checkingOptions' parameter should be defined");

  const startTime = new Date();

  let ourCFLocation = givenLocation;
  if (ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

  const filebits = filepath.split('/');
  const filename = filebits[filebits.length-1];
  // debugLog(`checkFileContents from filepath='${filepath}' got (${filebits.length}) ${filebits} and then '${filename}'`);
  const filenameLower = filename.toLowerCase();
  const repoName = formRepoName(languageCode, repoCode);

  let checkFileResult = { checkedFileCount: 0 };
  if (filenameLower.endsWith('.tsv')) {
    const filenameMain = filepath.substring(0, filepath.length - 4); // drop .tsv
    // functionLog(`checkFileContents have TSV filenameMain=${filenameMain}`);
    const bookID = filenameMain.startsWith(`${languageCode}_`) || filenameMain.startsWith('en_') ? filenameMain.substring(filenameMain.length - 3) : filenameMain.substring(filenameMain.length - 3, filenameMain.length).toUpperCase();
    // functionLog(`checkFileContents have TSV bookID=${bookID}`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    if (filepath.startsWith(`${languageCode}_`) || filenameMain.startsWith('en_')) {
      logicAssert(repoCode === 'TN', `These filenames ${filenameMain} are only for TN ${repoCode}`);
      checkFileResult = await checkTN_TSV9Table(languageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, checkingOptions);
    } else {
      // let adjustedRepoCode = repoCode;
      // if (adjustedRepoCode.startsWith('OBS-'))
      //   adjustedRepoCode = adjustedRepoCode.substring(4); // Remove the 'OBS-' from the beginning
      logicAssert(repoCode !== 'TN' && repoCode !== 'TQ' && repoCode !== 'OBS-TN' && repoCode !== 'OBS-TQ' && repoCode !== 'OBS_SN' && repoCode !== 'OBS-SQ', `This code with ${filenameMain} is not for ${repoCode}`);
      const checkFunction = {
        'TWL': checkTWL_TSV6Table, 'OBS-TWL': checkTWL_TSV6Table,
        'TN2': checkNotesTSV7Table, 'OBS-TN2': checkNotesTSV7Table,
        'TQ2': checkQuestionsTSV7Table, 'OBS-TQ2': checkQuestionsTSV7Table,
        'SN': checkNotesTSV7Table, 'OBS-SN2': checkNotesTSV7Table,
        'SQ': checkQuestionsTSV7Table, 'OBS-SQ2': checkQuestionsTSV7Table,
      }[repoCode];
      // debugLog(`checkFileContents() got ${checkFunction} function for ${repoCode}`);
      checkFileResult = await checkFunction(languageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, checkingOptions);
    }
  }
  else if (filenameLower.endsWith('.usfm')) {
    const filenameMain = filepath.substring(0, filepath.length - 5); // drop .usfm
    // debugLog(`Have USFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(filenameMain.length - 3);
    // debugLog(`Have USFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = await checkUSFMText(languageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, checkingOptions);
  } else if (filenameLower.endsWith('.sfm')) {
    const filenameMain = filepath.substring(0, filepath.length - 4); // drop .sfm
    userLog(`checkFileContents have SFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(2, 5);
    userLog(`checkFileContents have SFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = await checkUSFMText(languageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, checkingOptions);
  } else if (filenameLower.endsWith('.md'))
    if ((repoCode === 'UHAL' && filename[0] === 'H' && filename.length === 8)
      || (repoCode === 'UGL' && filename === '01.md'))
      checkFileResult = await checkLexiconFileContents(languageCode, repoCode, filepath, fileContent, ourCFLocation, checkingOptions);
    else
      checkFileResult = await checkMarkdownFileContents(languageCode, repoCode, filepath, fileContent, ourCFLocation, checkingOptions);
  else if (filenameLower.endsWith('.txt'))
    checkFileResult = checkPlainText(languageCode, repoCode, 'text', filepath, fileContent, ourCFLocation, checkingOptions);
  else if (filenameLower === 'manifest.yaml')
    checkFileResult = await checkManifestText(languageCode, repoCode, username, repoName, branch, fileContent, ourCFLocation, checkingOptions); // don’t know username or branch
  else if (filenameLower.endsWith('.yaml'))
    checkFileResult = checkYAMLText(languageCode, repoCode, filepath, fileContent, ourCFLocation, checkingOptions);
  else if (filenameLower.startsWith('license')) {
    checkFileResult = await checkMarkdownFileContents(languageCode, repoCode, filepath, fileContent, ourCFLocation, checkingOptions);
    checkFileResult.noticeList.unshift({ priority: 982, message: "File extension is not recognized, so treated as markdown.", filename: filepath, location: ourCFLocation });
  } else {
    checkFileResult = checkPlainText(languageCode, repoCode, 'raw', filepath, fileContent, ourCFLocation, checkingOptions);
    checkFileResult.noticeList.unshift({ priority: 995, message: "File extension is not recognized, so treated as plain text.", filename: filepath, location: ourCFLocation });
  }
  // debugLog(`checkFileContents got initial results: ${JSON.stringify(checkFileResult)}`);
  // debugLog(`checkFileContents got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

  // Make sure that we have the filename in all of our notices (in case other files are being checked as well)
  function addFilenameField(noticeObject) {
    if (noticeObject.debugChain) noticeObject.debugChain = `checkFileContents ${noticeObject.debugChain}`;
    if (noticeObject.fieldName === filepath) delete noticeObject.fieldName;
    // TODO: Might we need to add username, repoName, or branch here ???
    return noticeObject.extra ? noticeObject : { ...noticeObject, filename: filepath }; // NOTE: might be an indirect check on a TA or TW article
  }
  checkFileResult.noticeList = checkFileResult.noticeList.map(addFilenameField);

  // Add some extra fields to our checkFileResult object
  //  in case we need this information again later
  checkFileResult.checkedFileCount += 1;
  checkFileResult.checkedFilename = filepath;
  checkFileResult.checkedFilesize = fileContent.length;
  checkFileResult.checkedOptions = checkingOptions;

  checkFileResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog(`checkFileContents() returning ${JSON.stringify(checkFileResult)}`);
  return checkFileResult;
};
// end of checkFileContents()
