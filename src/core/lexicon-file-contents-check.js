import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkMarkdownText } from './markdown-text-check';
import { checkTextfileContents } from './file-text-check';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert } from './utilities';


const LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '0.4.4';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'UHAL', or 'UGL', etc.
 * @param {string} lexiconFilename -- used for identification
 * @param {string} lexiconMarkdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkLexiconFileContents(languageCode, repoCode, lexiconFilename, lexiconMarkdownText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire markdown file, i.e., all lines.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkLexiconFileContents(lC=${languageCode}, rC=${repoCode}, fn=${lexiconFilename}, ${lexiconMarkdownText.length}, ${givenLocation})…`);
    //parameterAssert(languageCode !== undefined, "checkLexiconFileContents: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkLexiconFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    parameterAssert(repoCode === 'UHAL' || repoCode === 'UGL', `checkLexiconFileContents: 'repoCode' parameter should be 'UHAL' or 'UGL', not '${repoCode}'`);
    //parameterAssert(lexiconFilename !== undefined, "checkLexiconFileContents: 'lexiconFilename' parameter should be defined");
    //parameterAssert(typeof lexiconFilename === 'string', `checkLexiconFileContents: 'lexiconFilename' parameter should be a string not a '${typeof lexiconFilename}': ${lexiconFilename}`);
    //parameterAssert(lexiconMarkdownText !== undefined, "checkLexiconFileContents: 'lexiconMarkdownText' parameter should be defined");
    //parameterAssert(typeof lexiconMarkdownText === 'string', `checkLexiconFileContents: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}': ${lexiconMarkdownText}`);
    //parameterAssert(givenLocation !== undefined, "checkLexiconFileContents: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkLexiconFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    //parameterAssert(givenLocation.indexOf('true') === -1, `checkLexiconFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
    if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkLexiconFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (mdtcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog("Using default excerptLength=" + excerptLength);
    }
    // else
    // debugLog("Using supplied excerptLength=" + excerptLength, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog("Using excerptHalfLength=" + excerptHalfLength, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog("checkLexiconFileContents success: " + successString);
        result.successList.push(successString);
    }
    function addNoticePartial(noticeObject) {
        // functionLog(`checkLexiconFileContents addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? " " + noticeObject.excerpt : ""}${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cMdT addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cMdT addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        if (noticeObject.debugChain) noticeObject.debugChain = `checkLexiconFileContents ${noticeObject.debugChain}`; // Prepend our name
        result.noticeList.push({ ...noticeObject, filename: lexiconFilename });
    }
    // end of addNoticePartial function

    /**
    * @description - checks the given text field and processes the returned results
    * @param {string} lexiconMarkdownText - the actual text of the file being checked
    * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {string} optionalFieldLocation - description of where the field is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    async function ourCheckMarkdownText(lexiconMarkdownText, optionalFieldLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cMdT ourCheckMarkdownText(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
        //parameterAssert(lexiconMarkdownText !== undefined, "cMdFC ourCheckMarkdownText: 'lexiconMarkdownText' parameter should be defined");
        //parameterAssert(typeof lexiconMarkdownText === 'string', `cMdFC ourCheckMarkdownText: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}'`);
        //parameterAssert(optionalFieldLocation !== undefined, "cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be defined");
        //parameterAssert(typeof optionalFieldLocation === 'string', `cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const cmtResultObject = await checkMarkdownText(languageCode, repoCode, lexiconFilename, lexiconMarkdownText, optionalFieldLocation, checkingOptions);
        // debugLog(`cmtResultObject=${JSON.stringify(cmtResultObject)}`);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList)
            addNoticePartial(noticeEntry);
    }
    // end of ourCheckMarkdownText function


    /**
    * @description - checks the given text field and processes the returned results
    * @param {string} lexiconMarkdownText - the actual text of the file being checked
    * @param {string} optionalFieldLocation - description of where the field is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    function ourFileTextCheck(lexiconMarkdownText, optionalFieldLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cMdFC ourFileTextCheck(${lexiconMarkdownText}, (${lexiconMarkdownText.length}), ${optionalFieldLocation}, ${JSON.stringify(checkingOptions)})`);
        //parameterAssert(lexiconMarkdownText !== undefined, "cMdFC ourFileTextCheck: 'lexiconMarkdownText' parameter should be defined");
        //parameterAssert(typeof lexiconMarkdownText === 'string', `cMdFC ourFileTextCheck: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}'`);
        //parameterAssert(checkingOptions !== undefined, "cMdFC ourFileTextCheck: 'checkingOptions' parameter should be defined");

        const ctfcResultObject = checkTextfileContents(languageCode, repoCode, 'markdown', lexiconFilename, lexiconMarkdownText, optionalFieldLocation, checkingOptions);
        // debugLog(`ctfcResultObject=${JSON.stringify(ctfcResultObject)}`);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of ctfcResultObject.noticeList)
            addNoticePartial(noticeEntry);
    }
    // end of ourFileTextCheck function


    // Main code for checkLexiconFileContents function
    const lines = lexiconMarkdownText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    // Create the hierarchy of the headings
    let hierarchy = [], currentLevel;
    for (const line of lines) {
        if (line.startsWith('## ')) {
            currentLevel = line.substring(3);
            hierarchy.push({ level: currentLevel, sublevels: [] });
        }
        if (currentLevel && line.startsWith('* ')) {
            let adjustedLine =line.substring(2);
            const colonIndex = adjustedLine.indexOf(':');
            if (colonIndex !== -1) adjustedLine = adjustedLine.substring(0,colonIndex); // we don't want the actual data
            hierarchy[hierarchy.length - 1].sublevels.push(adjustedLine);
        }
    }
    // debugLog(`checkLexiconFileContents hierarchy=${JSON.stringify(hierarchy)}`);

    let compulsoryFields = ['## Word data', '## Etymology', '## Senses'];
    if (repoCode === 'UHAL') {
    } else if (repoCode === 'UGL') {
    }

    // This next part is common for UHAL and UGL
    if (!lines[0].startsWith('# ') || lines[0].length < 4)
        addNoticePartial({ priority: 630, message: `Expected lexicon lemma on first line`, except: lines[0], location: ourLocation });
    if (!lines[2].startsWith('<!-- Status: '))
        addNoticePartial({ priority: 330, message: `Expected lexicon entry status on third line`, except: lines[2], location: ourLocation });

    for (const compulsoryField of compulsoryFields)
        if (!lines.find((field) => { return field.startsWith(compulsoryField) }))
            addNoticePartial({ priority: 620, message: `Expected lexicon lemma on first line`, except: lines[0], location: ourLocation });

    // Now do the standard markdown checks
    await ourCheckMarkdownText(lexiconMarkdownText, givenLocation, checkingOptions);
    ourFileTextCheck(lexiconMarkdownText, givenLocation, checkingOptions);


    addSuccessMessage(`Checked lexicon file: ${lexiconFilename}`);
    if (result.noticeList.length)
        addSuccessMessage(`checkLexiconFileContents v${LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkLexiconFileContents v${LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkLexiconFileContents returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // userLog(`checkLexiconFileContents result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkLexiconFileContents function
