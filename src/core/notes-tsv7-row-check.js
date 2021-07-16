// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults';
import { isWhitespace, countOccurrences } from './text-handling-functions';
import * as books from './books/books';
import { checkTextField } from './field-text-check';
import { checkMarkdownText } from './markdown-text-check';
import { checkSupportReferenceInTA } from './ta-reference-check';
// import { checkNotesLinksToOutside } from './notes-links-check';
import { checkOriginalLanguageQuoteAndOccurrence } from './orig-quote-check';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


// const NOTES_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.6.14';

const NUM_EXPECTED_NOTES_TSV_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_NOTES_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote';

const LC_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LC_ALPHABET_PLUS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN = 'abcdefghijklmnopqrstuvwxyz0123456789-';

const TA_REGEX = new RegExp('\\[\\[rc://[^ /]+?/ta/man/[^ /]+?/([^ \\]]+?)\\]\\]', 'g');


/**
 *
 * @description - Checks one TSV data row of translation notes (TN2)
 * @param {string} languageCode - the language code, e.g., 'en'
 * @param {string} repoCode - TN2, or SN -- allows more specific checks
 * @param {string} line - the TSV line to be checked
 * @param {string} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {string} givenC - chapter number or (for OBS) story number string
 * @param {string} givenV - verse number or (for OBS) frame number string
 * @param {string} givenRowLocation - description of where the line is located
 * @param {Object} checkingOptions - may contain excerptLength parameter
 * @return {Object} - containing noticeList
 */
export async function checkNotesTSV7DataRow(languageCode, repoCode, line, bookID, givenC, givenV, givenRowLocation, checkingOptions) {
    /* This function is only for checking one data row
          and the function doesn’t assume that it has any previous context.

        TN2, or SN
            being translation or study notes.

        bookID is a three-character UPPERCASE USFM book identifier or 'OBS'
            so givenC and givenV are usually chapter number and verse number
                but can be story number and frame number for OBS.

        It’s designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // functionLog(`checkNotesTSV7DataRow(${languageCode}, ${repoCode}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkNotesTSV7DataRow: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkNotesTSV7DataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkNotesTSV7DataRow: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkNotesTSV7DataRow: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    // //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkNotesTSV7DataRow: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(repoCode==='TN2' || repoCode==='SN', `checkNotesTSV7DataRow: 'repoCode' parameter should be 'TN2' or 'SN', not '${repoCode}'`);
    //parameterAssert(line !== undefined, "checkNotesTSV7DataRow: 'line' parameter should be defined");
    //parameterAssert(typeof line === 'string', `checkNotesTSV7DataRow: 'line' parameter should be a string not a '${typeof line}'`);
    //parameterAssert(bookID !== undefined, "checkNotesTSV7DataRow: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkNotesTSV7DataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkNotesTSV7DataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkNotesTSV7DataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkNotesTSV7DataRow: '${bookID}' is not a valid USFM book identifier`);
    // //parameterAssert(givenC !== undefined, "checkNotesTSV7DataRow: 'givenC' parameter should be defined");
    if (givenC) {
        //parameterAssert(typeof givenC === 'string', `checkNotesTSV7DataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    }
    // //parameterAssert(givenV !== undefined, "checkNotesTSV7DataRow: 'givenV' parameter should be defined");
    if (givenV) {
        //parameterAssert(typeof givenV === 'string', `checkNotesTSV7DataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    }
    //parameterAssert(givenRowLocation !== undefined, "checkNotesTSV7DataRow: 'givenRowLocation' parameter should be defined");
    //parameterAssert(typeof givenRowLocation === 'string', `checkNotesTSV7DataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);
    //parameterAssert(givenRowLocation.indexOf('true') === -1, "checkNotesTSV7DataRow: 'givenRowLocation' parameter should not be 'true'");

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    const linkCheckingOptions = { ...checkingOptions };
    linkCheckingOptions.taRepoLanguageCode = languageCode;

    let drResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {string} message - the text of the notice message
        * @param {string} rowID - 4-character row ID field
        * @param {Number} lineNumber - one-based line number
        * @param {Number} characterIndex - zero-based index of where the issue occurs in the line
        * @param {string} excerpt - short excerpt from the line centred on the problem (if available)
        * @param {string} location - description of where the issue is located
        */
        // functionLog(`checkNotesTSV7DataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.excerpt}, ${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `checkNotesTSV7DataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `checkNotesTSV7DataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(lineNumber !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // //parameterAssert(typeof lineNumber === 'number', `checkNotesTSV7DataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // //parameterAssert(characterIndex !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `checkNotesTSV7DataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `checkNotesTSV7DataRow addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "checkNotesTSV7DataRow addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `checkNotesTSV7DataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // Also uses the given bookID,C,V, parameters from the main function call
        // noticeObject.debugChain = noticeObject.debugChain ? `checkNotesTSV7DataRow ${noticeObject.debugChain}` : `checkNotesTSV7DataRow(${repoCode})`;
        drResult.noticeList.push({ ...noticeObject, bookID, C: givenC, V: givenV });
    }

    async function ourMarkdownTextChecks(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        /**
        * @description - checks the given markdown field and processes the returned results
        * @param {string} rowID - 4-character row ID field
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} rowLocation - description of where the line is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does markdown checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // We don’t currently use the allowedLinks parameter

        // functionLog(`checkNotesTSV7DataRow ourMarkdownTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkNotesTSV7DataRow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkNotesTSV7DataRow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        // //parameterAssert(fieldName !== undefined, "checkNotesTSV7DataRow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        // //parameterAssert(typeof fieldName === 'string', `checkNotesTSV7DataRow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldName === 'Note', `checkNotesTSV7DataRow ourMarkdownTextChecks: Only run this check on Notes not '${fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkNotesTSV7DataRow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkNotesTSV7DataRow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "checkNotesTSV7DataRow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");
        //parameterAssert(rowLocation !== undefined, "checkNotesTSV7DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be defined");
        //parameterAssert(typeof rowLocation === 'string', `checkNotesTSV7DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkNotesTSV7DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const omtcResultObject = await checkMarkdownText(languageCode, repoCode, fieldName, fieldText, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of omtcResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            // NOTE: Ellipses in Note have the normal meaning
            //          not like the specialised meaning in the Quote snippet fields
            if (noticeEntry.priority !== 178 && noticeEntry.priority !== 179 // unexpected space after ellipse, ellipse after space
                && !noticeEntry.message.startsWith("Unexpected … character after space") // 191
            )
                addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
        return omtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourMarkdownTextChecks function

    function ourCheckTextField(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {string} rowID - 4-character row ID field
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} rowLocation - description of where the line is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // functionLog(`checkNotesTSV7DataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkNotesTSV7DataRow ourCheckTextField: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkNotesTSV7DataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkNotesTSV7DataRow ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkNotesTSV7DataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkNotesTSV7DataRow ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkNotesTSV7DataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "checkNotesTSV7DataRow ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(rowLocation !== undefined, "checkNotesTSV7DataRow ourCheckTextField: 'rowLocation' parameter should be defined");
        //parameterAssert(typeof rowLocation === 'string', `checkNotesTSV7DataRow ourCheckTextField: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkNotesTSV7DataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const fieldType = fieldName === 'Note' ? 'markdown' : 'raw';
        const octfResultObject = checkTextField(languageCode, repoCode, fieldType, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of octfResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
        return octfResultObject.suggestion; // There may or may not be one!
    }
    // end of ourCheckTextField function

    async function ourCheckSupportReferenceInTA(rowID, fieldName, taLinkText, rowLocation, checkingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // functionLog(`checkNotesTSV7DataRow ourCheckSupportReferenceInTA(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(taLinkText !== undefined, "checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be defined");
        //parameterAssert(typeof taLinkText === 'string', `checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkNotesTSV7DataRow ourCheckSupportReferenceInTA: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkSupportReferenceInTA(fieldName, taLinkText, rowLocation, { ...checkingOptions, taRepoLanguageCode: languageCode, expectFullLink: true });

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckSupportReferenceInTA notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckSupportReferenceInTA function


    async function ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, fieldName, fieldText, occurrence, rowLocation, checkingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // functionLog(`checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(occurrence !== undefined, "checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be defined");
        //parameterAssert(typeof occurrence === 'string', `checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkNotesTSV7DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkOriginalLanguageQuoteAndOccurrence(languageCode, repoCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuoteAndOccurrence notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTNOriginalLanguageQuoteAndOccurrence function


    // Main code for checkNotesTSV7DataRow function
    if (line === EXPECTED_NOTES_HEADING_LINE) // Assume it must be ok
        return drResult; // We can’t detect if it’s in the wrong place

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (tlcELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    if (bookID === 'OBS')
        numChaptersThisBook = 50; // There's 50 Open Bible Stories
    else {
        //parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in checkNotesTSV7DataRow");
        try {
            numChaptersThisBook = books.chaptersInBook(bookID);
        } catch (tlcNCerror) {
            addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkNotesTSV7DataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
        }
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    let RIDSuggestion, SRSuggestion, QSuggestion, OSuggestion, ASuggestion;
    if (fields.length === NUM_EXPECTED_NOTES_TSV_FIELDS) {
        const [reference, rowID, tags, supportReference, quote, occurrence, note] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':');
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `expected '${givenC}'`, fieldName: 'Reference', rowID, excerpt: C, location: ourRowLocation });
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNoticePartial({ priority: 824, message: `Invalid zero chapter number`, excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNoticePartial({ priority: 823, message: `Invalid large chapter number`, excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                if (lowercaseBookID === 'obs')
                    numVersesThisChapter = 99; // Set to maximum expected number of frames
                else {
                    try {
                        numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        haveGoodChapterNumber = true;
                    } catch (tlcNVerror) {
                        if (!haveGoodBookID)
                            // addNoticePartial({priority:500, "Invalid chapter number", rowLocation);
                            // else
                            addNoticePartial({ priority: 822, message: "Unable to check chapter number", excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                        haveGoodChapterNumber = false;
                    }
                }
            }
            else
                addNoticePartial({ priority: 821, message: "Bad chapter number", excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 820, message: "Missing chapter number", rowID, fieldName: 'Reference', location: ` ?:${V}${ourRowLocation}` });

        if (V?.length) { // can be undefined if no colon at split above
            if (V !== givenV)
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `expected '${givenV}'`, rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
            if (bookID === 'OBS' || V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0 && bookID !== 'PSA') // Psalms have \d as verse zero
                    addNoticePartial({ priority: 814, message: "Invalid zero verse number", rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 813, message: "Invalid large verse number", details: `${bookID} chapter ${C} only has ${numVersesThisChapter} verses`, rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
                    } else
                        addNoticePartial({ priority: 812, message: "Unable to check verse number", rowID, fieldName: 'Reference', location: ourRowLocation });
                }
            }
            else
                addNoticePartial({ priority: 811, message: "Bad verse number", rowID, fieldName: 'Reference', location: ` '${V}'${ourRowLocation}` });
        }
        else
            addNoticePartial({ priority: 810, message: "Missing verse number", rowID, fieldName: 'Reference', location: ` after ${C}:?${ourRowLocation}` });

        if (!rowID.length)
            addNoticePartial({ priority: 931, message: "Missing row ID field", fieldName: 'Reference', location: ourRowLocation });
        else {
            if (rowID.length !== 4) {
                addNoticePartial({ priority: 778, message: "Row ID should be exactly 4 characters", details: `not ${rowID.length}`, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
                if (rowID.length > 4) RIDSuggestion = rowID.substring(0, 5);
                else { // must be < 4
                    RIDSuggestion = rowID;
                    while (RIDSuggestion.length < 4) RIDSuggestion += LC_ALPHABET_PLUS_DIGITS[Math.floor(Math.random() * LC_ALPHABET_PLUS_DIGITS.length)];;
                }
            } else if (LC_ALPHABET.indexOf(rowID[0]) < 0)
                addNoticePartial({ priority: 176, message: "Row ID should start with a lowercase letter", characterIndex: 0, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS.indexOf(rowID[3]) < 0)
                addNoticePartial({ priority: 175, message: "Row ID should end with a lowercase letter or digit", characterIndex: 3, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[1]) < 0)
                addNoticePartial({ priority: 174, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 1, rowID, excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[2]) < 0)
                addNoticePartial({ priority: 173, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 2, rowID, excerpt: rowID, location: ourRowLocation });
        }

        if (tags.length) {
            let tagsList = tags.split('; ');
            for (const thisTag of tagsList) {
                // No tags are yet defined for TNs or SNs
                // if (thisTag !== 'keyterm' && thisTag !== 'name')
                addNoticePartial({ priority: 746, message: "Unexpected tag", details: thisTag, excerpt: tags, fieldName: 'Tags', rowID, location: ourRowLocation });
            }
        }

        if (supportReference.length) { // need to check TN2 against TA
            if (isWhitespace(supportReference))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'SupportReference', rowID, location: ourRowLocation });
            else if (repoCode === 'TN2') { // More than just whitespace
                const supportReferenceArticlePart = supportReference.replace('rc://*/ta/man/translate/', '');
                // debugLog("supportReferenceArticlePart", supportReferenceArticlePart);
                if (!supportReferenceArticlePart.startsWith('figs-')
                    && !supportReferenceArticlePart.startsWith('grammar-')
                    && !supportReferenceArticlePart.startsWith('translate-')
                    && !supportReferenceArticlePart.startsWith('writing-')
                    && supportReferenceArticlePart !== 'guidelines-sonofgodprinciples')
                    addNoticePartial({ priority: 788, message: "Only 'Just-In-Time Training' TA articles allowed here", fieldName: 'SupportReference', excerpt: supportReference, rowID, location: ourRowLocation });
                SRSuggestion = ourCheckTextField(rowID, 'SupportReference', supportReference, true, ourRowLocation, checkingOptions);
                if (checkingOptions?.disableAllLinkFetchingFlag !== true)
                    await ourCheckSupportReferenceInTA(rowID, 'SupportReference', supportReference, ourRowLocation, checkingOptions);
                if (note.indexOf(supportReference) < 0)
                    addNoticePartial({ priority: 787, message: "Link to TA should also be in Note", fieldName: 'SupportReference', excerpt: supportReference, rowID, location: ourRowLocation });
            }
            let characterIndex;
            if ((characterIndex = supportReference.indexOf('\u200B') !== -1)) {
                const charCount = countOccurrences(supportReference, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'SupportReference', characterIndex, rowID, location: ourRowLocation });
            }
        }
        // // TODO: Check if this is really required????
        // else if (/^\d+$/.test(C) && /^\d+$/.test(V)) // C:V are both digits
        //     addNoticePartial({ priority: 877, message: "Missing SupportReference field", fieldName: 'SupportReference', rowID, location: ourRowLocation });

        if (quote.length) { // need to check UTN against UHB and UGNT
            QSuggestion = ourCheckTextField(rowID, 'Quote', quote, false, ourRowLocation, checkingOptions);
            if (occurrence.length)
                await ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, 'Quote', quote, occurrence, ourRowLocation, checkingOptions);
            else
                addNoticePartial({ priority: 750, message: "Missing occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, location: ourRowLocation });
        }
        else // TODO: Find more details about when these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (repoCode === 'TN2' && V !== 'intro' && occurrence !== '0')
                addNoticePartial({ priority: 919, message: "Missing Quote field", fieldName: 'Quote', rowID, location: ourRowLocation });

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn’t occur
                if (quote.length) {
                    addNoticePartial({ priority: 751, message: "Invalid zero occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                    OSuggestion = '1';
                }
                // if (V !== 'intro')
                //     addNoticePartial({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') { } // TODO check the special conditions when this can occur???
            else if ('12345678'.indexOf(occurrence) < 0) { // it’s not one of these integers
                addNoticePartial({ priority: 792, message: `Invalid occurrence field`, fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                OSuggestion = '1';
            }
        }
        else if (quote.length) {
            addNoticePartial({ priority: 791, message: `Missing occurrence field`, fieldName: 'Occurrence', rowID, location: ourRowLocation });
            OSuggestion = '1';
        }

        if (note.length) {
            if (note.indexOf('<br>') >= 0) {
                const charCount = countOccurrences(note, '<br>');
                addNoticePartial({ priority: 674, message: "Field contains HTML <br> field(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found—should be '\\n' instead`, fieldName: 'Note', rowID, location: ourRowLocation });
            }
            if (note.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(note, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'Note', rowID, location: ourRowLocation });
            }
            if (isWhitespace(note))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'Note', rowID, location: ourRowLocation });
            else { // More than just whitespace
                const adjustedNote = note.replace(/\\n/g, '\n');
                ASuggestion = await ourMarkdownTextChecks(rowID, 'Note', adjustedNote, true, ourRowLocation, checkingOptions);
                // await ourCheckNotesLinksToOutside(rowID, 'Note', adjustedNote, ourRowLocation, linkCheckingOptions);
                let regexResultArray, linksList = [], foundSR = false;
                while ((regexResultArray = TA_REGEX.exec(adjustedNote))) {
                    // debugLog("Got TA Regex in Note", JSON.stringify(regexResultArray));
                    linksList.push(regexResultArray[1])
                    const adjustedLink = regexResultArray[0].substring(2, regexResultArray[0].length - 2)
                    if (adjustedLink === supportReference) foundSR = true;
                }
                if (linksList.length && V !== 'intro') {
                    let details = supportReference ? `SR='${supportReference}'` : "empty SR field"
                    if (linksList.length > 1) details += `—found ${linksList.length} TA links`;
                    const excerpt = linksList.length > 1 ? JSON.stringify(linksList) : linksList[0];
                    if (foundSR) {
                        if (linksList.length > 1)
                            addNoticePartial({ priority: 786, message: "Shouldn’t have multiple TA links in Note", details, rowID, fieldName: 'OccurrenceNote', excerpt, location: ourRowLocation });
                    } else // didn't find SR
                        addNoticePartial({ priority: 789, message: "Should have a SupportReference when Note has a TA link", details, rowID, fieldName: 'OccurrenceNote', excerpt, location: ourRowLocation });
                }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (repoCode === 'TN2')
                addNoticePartial({ priority: 274, message: "Missing Note field", fieldName: 'Note', rowID, location: ourRowLocation });

        // 7 [reference, rowID, tags, supportReference, quote, occurrence, note]
        const suggestion = `${reference}\t${RIDSuggestion === undefined ? rowID : RIDSuggestion}\t${tags}\t${SRSuggestion === undefined ? supportReference : SRSuggestion}\t${QSuggestion === undefined ? quote : QSuggestion}\t${OSuggestion === undefined ? occurrence : OSuggestion}\t${ASuggestion === undefined ? note : ASuggestion}`;
        if (suggestion !== line) {
            // debugLog(`Had note ${line}`);
            // debugLog(`Sug note ${suggestion}`);
            drResult.suggestion = suggestion;
        }

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[1]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_NOTES_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // debugLog(`  checkNotesTSV7DataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkNotesTSV7DataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList and possibly suggestion only
}
// end of checkNotesTSV7DataRow function
