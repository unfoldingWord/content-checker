// eslint-disable-next-line no-unused-vars
import { userLog, parameterAssert, logicAssert, debugLog } from '../core/utilities';
import { isDisabledNotice } from '../core/disabled-notices';


// const NOTICE_PROCESSOR_VERSION_STRING = '0.10.2';
// TODO: Hidden message code probably doesn't work for the other sort orders

const DEFAULT_MAXIMUM_HIDDEN_NOTICES = 60; // Don't want to hide HUNDREDS/THOUSANDS of notices for each notice type
const DEFAULT_MAXIMUM_HIDDEN_NOTICES_MESSAGE = `Further hidden notices (beyond ${DEFAULT_MAXIMUM_HIDDEN_NOTICES}) were suppressed!`;
let maximumHiddenNotices = DEFAULT_MAXIMUM_HIDDEN_NOTICES, maximumHiddenNoticesMessage = DEFAULT_MAXIMUM_HIDDEN_NOTICES_MESSAGE;

// All of the following can be overriden with optionalProcessingOptions
const DEFAULT_MAXIMUM_SIMILAR_MESSAGES = 3; // Zero means no suppression of similar messages
let maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
const DEFAULT_CUTOFF_PRIORITY_LEVEL = 0; // This level or lower gets excluded from the lists
const DEFAULT_IGNORE_PRIORITY_NUMBER_LIST = [];

// For processNoticesToErrorsWarnings
const DEFAULT_ERROR_PRIORITY_LEVEL = 700; // This level or higher becomes an error (cf. warnings)

// For processNoticesToSevereMediumLow
const DEFAULT_SEVERE_PRIORITY_LEVEL = 800; // This level or higher becomes a severe error
const DEFAULT_MEDIUM_PRIORITY_LEVEL = 600; // This level or higher becomes a medium error

// For processNoticesToSingleList
// (no constants required)


/**
* @description - Preprocesses the successList and noticeList
* @param {Object} givenNoticeObject - must contain a noticeList array
* @param {Object} optionalProcessingOptions - may contain parameters
* @return {Array} containing three items: remainingNoticeList, allTotals, resultObject
*/
function processNoticesCommon(givenNoticeObject, optionalProcessingOptions) {
    /*
        Expects to get an object with:
            successList: a list of strings describing what has been checked
            noticeList: a list of components to notices, being:
                priority: A notice priority number in the range 1-1,000.
                    Each different type of warning/error has a unique number
                      (but not each instance of those warnings/errors).
                    By default, notice priority numbers 700 and over are
                      considered `errors` and 0-699 are considered `warnings`,
                      but in truth, that’s rather arbitrary.
                message: The actual general description text of the notice
                details: Additional clarifying notice information (if relevant)
                The next three fields may be ommitted if irrelevant
                 (since BCV is not relevant to all types of files/repos)
                    bookID: book identifier 3-character UPPERCASE string
                    C: Chapter number string
                    V: Verse number string (can also be a bridge, e.g., '22-23')
                repoName: repository name (if relevant)
                filename: string (if relevant)
                rowID: 4-character string (if relevant)
                lineNumber: A one-based integer indicating the line number in the file
                fieldName: string (if relevant)
                characterIndex: A zero-based integer index which indicates the position
                    of the error on the line or in the text field as appropriate.
                excerpt: An excerpt of the checked text which indicates the area
                      containing the problem.
                    Where helpful, some character substitutions have already been made,
                      for example, if the notice is about spaces,
                      it is generally helpful to display spaces as a visible
                      character in an attempt to best highlight the issue to the user.
                 location: A string indicating the context of the notice,
                        e.g., `in 'someBook.usfm'.
                There is also an optional notice component (where multiple files/repos are checked)
                extra: A string indicating an extra location component, e.g., repoCode or bookID
                    This will probably need to be added to the message string but is left
                        until now in order to allow the most display flexibility
        Available options are:
            cutoffPriorityLevel (integer; default is DEFAULT_CUTOFF_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)
            sortBy ('AsFound' or 'ByPriority' or 'ByRepo', default is 'ByPriority')
            ignorePriorityNumberList (list of integers, default is empty list, list of notice priority numbers to be ignored)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.

        Returns an array of three fields:
            remainingNoticeList
                A list of notice entries, each one containing exactly eight or nine fields (see above)
                    i.e., notice entries originally containing five or six fields have had blank BCV fields inserted.
            allTotals
                A table with a count of notices for that priority/message.
                    (May be used in further processing for possible removal of lots of similar messages)
            resultObject
                A prototype object which will be added to and then returned as the final result of the NEXT notice processing step.
                Contains the following:
                    successList -- a list of strings noting what has been checked
                    numIgnored Notices (int)
                    numSuppressedNotices (int)
                    processingOptions (a copy of the optionalProcessingOptions passed to these functions)
                    Any other fields that were part of the givenNoticeObject passed to these functions. These might include:
                        checkedFilenames -- list of strings
                        checkedRepos -- list of strings
                    depending on the type of check that was made.
    */
    // debugLog(`processNoticesCommon v${NOTICE_PROCESSOR_VERSION_STRING}
    //     with ${JSON.stringify(givenNoticeObject)}
    //     with options=${JSON.stringify(optionalProcessingOptions)}
    //   Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);


    const standardisedNoticeList = givenNoticeObject.noticeList; // TODO: Why did we need this???

    maximumHiddenNotices = DEFAULT_MAXIMUM_HIDDEN_NOTICES; maximumHiddenNoticesMessage = DEFAULT_MAXIMUM_HIDDEN_NOTICES_MESSAGE;
    maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (npfMSMerror) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // debugLog(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    }
    // else userLog(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);

    // Check for duplicate notices in the noticeList
    // This might indicate that a function is being called twice unnecessarily
    // This entire section may be commented out of production code
    // It only really makes sense if the debugChain is enabled
    if (givenNoticeObject.noticeList && givenNoticeObject.noticeList.length)
        if (givenNoticeObject.noticeList.length > 8000) {
            userLog(`processNoticesCommon: ${givenNoticeObject.noticeList.length.toLocaleString()} notices is too many to search for duplicates!`);
        } else {
            userLog(`processNoticesCommon: Checking ${givenNoticeObject.noticeList.length.toLocaleString()} notices for duplicates…`);
            const uniqueList = [];
            function uniqueListContains(item) { // returns -1 or the index of the first match
                for (let ix = 0; ix < uniqueList.length; ix++) {
                    const thisUniqueNotice = uniqueList[ix];
                    if ( // compare as few essentialfields as possible to find matches
                        thisUniqueNotice.priority === item.priority
                        && thisUniqueNotice.message === item.message
                        && (thisUniqueNotice.details === item.details || thisUniqueNotice.details === undefined || item.details === undefined)
                        && (thisUniqueNotice.repoCode === item.repoCode || thisUniqueNotice.repoCode === undefined || item.repoCode === undefined)
                        && (thisUniqueNotice.filename === item.filename || thisUniqueNotice.filename === undefined || item.filename === undefined)
                        && (thisUniqueNotice.rowID === item.rowID || thisUniqueNotice.rowID === undefined || item.rowID === undefined)
                        && (thisUniqueNotice.lineNumber === item.lineNumber || thisUniqueNotice.lineNumber === undefined || item.lineNumber === undefined)
                        && (thisUniqueNotice.characterIndex === item.characterIndex || thisUniqueNotice.characterIndex === undefined || item.characterIndex === undefined)
                        && (thisUniqueNotice.excerpt === item.excerpt || thisUniqueNotice.excerpt === undefined || item.excerpt === undefined)
                        && (thisUniqueNotice.extra === item.extra || thisUniqueNotice.extra === undefined || item.extra === undefined)
                    )
                        return ix;
                }
                return -1;
            }
            for (const thisGivenNotice of standardisedNoticeList) {
                let xx;
                if ((xx = uniqueListContains(thisGivenNotice)) === -1) // wasn’t found
                    uniqueList.push(thisGivenNotice);
                else userLog(`Duplicate notices:\n${JSON.stringify(thisGivenNotice)}\nwhen had\n${JSON.stringify(uniqueList[xx])}`);
            }
            if (uniqueList.length !== givenNoticeObject.noticeList.length)
                userLog(`Here with ${givenNoticeObject.noticeList.length.toLocaleString()} notices and ${uniqueList.length.toLocaleString()} unique notices`);
        }


    // Run a check through the noticeList to help discover any programming errors that need fixing
    // This entire section may be commented out of production code
    if (givenNoticeObject.noticeList && givenNoticeObject.noticeList.length) {
        // eslint-disable-next-line no-unused-vars
        const ALL_TSV_FIELDNAMES = ['Book', 'Chapter', 'Verse', 'Reference',
            'ID', 'Tags', 'SupportReference',
            'OrigWords', 'TWLink',
            'OrigQuote', 'Quote', 'Occurrence', 'GLQuote',
            'Question', 'Response',
            'OccurrenceNote', 'Note'];
        const numberStore = {}, duplicatePriorityList = [];
        for (const thisGivenNotice of standardisedNoticeList) {
            const thisPriority = thisGivenNotice.priority, thisMsg = thisGivenNotice.message;
            //(typeof thisPriority === 'number' && thisPriority > 0 && thisPriority < 10000, `BAD PRIORITY for ${JSON.stringify(thisGivenNotice)}`);
            //parameterAssert(typeof thisMsg === 'string' && thisMsg.length >= 10, `BAD MESSAGE for ${JSON.stringify(thisGivenNotice)}`);

            // Check that notice priority numbers are unique (to detect programming errors)
            const oldMsg = numberStore[thisPriority];
            if (oldMsg && oldMsg !== thisMsg && !duplicatePriorityList.includes(thisPriority)
                // Some of the messages include the troubling character in the message
                //    so we expect them to differ slightly
                && !thisMsg.startsWith('Mismatched ')
                && !thisMsg.startsWith('Unexpected doubled ')
                && !thisMsg.startsWith('Unexpected space after ')
                && !thisMsg.startsWith('Unexpected content after \\')
                && !thisMsg.startsWith('USFMGrammar: ')
                && !thisMsg.startsWith('Bad punctuation nesting: ')
                && !thisMsg.startsWith('At end of text with unclosed ')
                && !thisMsg.startsWith('Possible mismatched ')
                && !thisMsg.endsWith(' character combination')
                && !thisMsg.endsWith(' character after space')
                && !thisMsg.endsWith(' character at start of line')
                && !thisMsg.endsWith(' character at end of line')
                && !thisMsg.endsWith(' marker at start of line')
                && !thisMsg.endsWith(' closing character (no matching opener)')
                && !thisMsg.endsWith(' closing character doesn’t match')
            ) {
                console.error(`POSSIBLE PROGRAMMING ERROR: priority ${thisPriority} has at least two different messages: '${oldMsg}' and '${thisMsg}'`);
                duplicatePriorityList.push(thisPriority); // so that we only give the error once
            }

            // Check fields for bad values, and also across fields for unexpected combinations
            const thisRepoName = thisGivenNotice.repoName,
                thisFilename = thisGivenNotice.filename, thisLineNumber = thisGivenNotice.lineNumber,
                thisC = thisGivenNotice.C, thisV = thisGivenNotice.V,
                thisRowID = thisGivenNotice.rowID, thisFieldName = thisGivenNotice.fieldName,
                thisLocation = thisGivenNotice.location, thisExtra = thisGivenNotice.extra;
            if (thisRepoName) {
                //parameterAssert(thisRepoName.indexOf(' ') < 0 && thisRepoName.indexOf('/') < 0 && thisRepoName.indexOf('\\') < 0, `repoName '${thisRepoName}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation) { //parameterAssert(thisLocation.indexOf(thisRepoName) < 0, `repoName is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
                }
            }
            if (thisFilename) {
                logicAssert(thisFilename.indexOf(':') < 0 && thisFilename.indexOf('\\') < 0, `filename '${thisFilename}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                logicAssert(ALL_TSV_FIELDNAMES.indexOf(thisFilename) < 0, `filename '${thisFilename}' contains a TSV fieldName!`);
                // NOTE: Some OBS and other messages have to include part of the part in the 'filename' (to prevent ambiguity) so we don’t disallow forward slash
                // if (!thisRepoName || !(thisRepoName.endsWith('_obs') || thisRepoName.endsWith('_ta') || thisRepoName.endsWith('_tw')))
                //     //parameterAssert(thisFilename.indexOf('/') < 0, `filename '${thisFilename}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    logicAssert(thisLocation.indexOf(thisFilename) < 0, `filename is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisC)
                logicAssert(thisC === 'front' || !isNaN(thisC * 1), `C '${thisC}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
            if (thisV) { // NOTE: We don't allow for a en-dash in verse ranges -- should we?
                if (thisV.indexOf('-') !== -1) { // it contains a hyphen, i.e., a verse range
                    const vBits = thisV.split('-');
                    logicAssert(vBits.length === 2 && !isNaN(vBits[0] * 1) && !isNaN(vBits[1] * 1), `V '${thisV}' verse range contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                } else // NOTE: Question mark below is in "bad verse number" notices
                    logicAssert(thisV === 'intro' || thisV === '?' || !isNaN(thisV * 1), `V '${thisV}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisRowID) {
                logicAssert(thisRowID.indexOf(' ') < 0 && thisRowID.indexOf('/') < 0 && thisRowID.indexOf('\\') < 0, `rowID '${thisRowID}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    logicAssert(thisLocation.indexOf(thisRowID) < 0, `rowID is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisFieldName) {
                // NOTE: fieldName can be a USFM marker, e.g., 'from \w'
                logicAssert(thisFieldName.indexOf('/') < 0, `fieldName '${thisFieldName}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    logicAssert(thisFieldName === 'w' // 'w' is just too likely to occur in the location string
                        || thisLocation.indexOf(thisFieldName) < 0, `fieldName is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisLineNumber) {
                logicAssert(typeof thisLineNumber === 'number' && thisLineNumber > 0, `lineNumber '${thisLineNumber}' contains unexpected value in ${JSON.stringify(thisGivenNotice)}`);
                // Note: lineNumber can occur in location, e.g., in 3 in '3JN' or 'Door43' so have to take additional care not to give false alarms
                if (thisLocation && thisLineNumber > 4 && thisLineNumber !== 43)
                    // && (!thisGivenNotice.bookID || thisGivenNotice.bookID.indexOf(thisLineNumber + '') < 0)
                    logicAssert(thisLocation.indexOf(thisLineNumber + '') < 0 && thisLocation.indexOf(thisLineNumber.toLocaleString()) < 0, `lineNumber might be repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisExtra) { logicAssert(thisExtra !== '01', `extra should not be '${thisExtra}'`); }
            numberStore[thisPriority] = thisMsg;
        }
    }


    const resultObject = { // inititalise with our new fields
        numIgnoredNotices: 0, // Ignored by unique priority number
        numDisabledNotices: 0, // Individually disabled
        numSuppressedNotices: 0, // Low priority notices dropped completely
        processingOptions: optionalProcessingOptions, // Just helpfully includes what we were given (may be undefined)
    };
    // Copy across all the other properties that we aren’t interested in
    for (const gnoPropertyName in givenNoticeObject)
        if (gnoPropertyName !== 'successList' && gnoPropertyName !== 'noticeList')
            resultObject[gnoPropertyName] = givenNoticeObject[gnoPropertyName];

    // Fetch our processing parameters
    let ignorePriorityNumberList;
    try {
        ignorePriorityNumberList = optionalProcessingOptions.ignorePriorityNumberList;
    } catch (npfIPNLerror) { }
    if (ignorePriorityNumberList === undefined) {
        ignorePriorityNumberList = DEFAULT_IGNORE_PRIORITY_NUMBER_LIST;
        // debugLog(`Using default ignorePriorityNumberList=${JSON.stringify(ignorePriorityNumberList)}`);
    }
    else userLog(`processNoticesCommon: Using supplied ignorePriorityNumberList=${JSON.stringify(ignorePriorityNumberList)} cf. default=${JSON.stringify(DEFAULT_IGNORE_PRIORITY_NUMBER_LIST)}`);
    //parameterAssert(Array.isArray(ignorePriorityNumberList), `ignorePriorityNumberList should be an Array, not ${typeof ignorePriorityNumberList}=${ignorePriorityNumberList}`);
    let sortBy;
    try {
        sortBy = optionalProcessingOptions.sortBy;
        // debugLog(`processNoticesCommon: Setting sortBy='${sortBy}' from optionalProcessingOptions`);
    } catch (npfSBerror) { }
    if (sortBy === undefined) {
        sortBy = 'ByPriority';
        // debugLog(`processNoticesCommon: Using default sortBy='${sortBy}'`);
    }
    // else userLog(`processNoticesCommon: Using supplied sortBy='${sortBy}' cf. default='ByPriority'`);
    let cutoffPriorityLevel;
    try {
        cutoffPriorityLevel = optionalProcessingOptions.cutoffPriorityLevel;
    } catch (npfCPLerror) { }
    if (cutoffPriorityLevel === undefined) {
        cutoffPriorityLevel = DEFAULT_CUTOFF_PRIORITY_LEVEL;
        // debugLog(`Using default cutoffPriorityLevel=${cutoffPriorityLevel}`);
    }
    else userLog(`Using supplied cutoffPriorityLevel=${cutoffPriorityLevel} cf. default=${DEFAULT_CUTOFF_PRIORITY_LEVEL}`);
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push({999, "Cutoff level must not be higher than error level", excerpt:`(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);

    let showDisabledNoticesFlag = optionalProcessingOptions.showDisabledNoticesFlag === true;
    if (showDisabledNoticesFlag) userLog(`showDisabledNoticesFlag=${showDisabledNoticesFlag}`);

    // Adjust the list of success notices to combine multiple similar messages, e.g., Checked this book, Checked that book
    //  into one summary message, e.g., Checked this and that books.
    if (givenNoticeObject.successList)
        // Handle the successList
        if (givenNoticeObject.successList.length < 5)
            resultObject.successList = givenNoticeObject.successList;
        else { // successList is fairly long -- maybe we can shorten it by combining multiple similar messages
            const BibleRegex = /\d\d-(\w\w\w).usfm/; // "Checked JUD file: 66-JUD.usfm"
            const NotesRegex = /\d\d-(\w\w\w).tsv/; // "Checked EN_TN_01-GEN.TSV file: en_tn_01-GEN.tsv"
            // const TWLRegex = /twl_(\w\w\w).tsv/; // From repoCheck "Checked en_twl BBB file: twl_BBB.tsv"
            const manifestRegex = /Checked ([\w\-_]{2,25}) manifest file/;
            const READMEregex = /Checked ([\w\-_]{2,25}) README file/;
            const LICENSEregex = /Checked ([\w\-_]{2,25}) LICENSE file/;
            resultObject.successList = [];
            const UHBBookList = [], UGNTBookList = [], LTBookList = [], STBookList = [], TNBookList = [], TN2BookList = [], TQ2BookList = [];
            const USFMBookList = [], TSVNotesList = [], manifestsList = [], READMEsList = [], LICENSEsList = [];
            const TNList = [], TQList = [], TWLList = [];
            for (const thisParticularSuccessMsg of givenNoticeObject.successList) {
                // debugLog("thisParticularSuccessMsg", thisParticularSuccessMsg);
                let regexResult;
                if (thisParticularSuccessMsg.startsWith('Checked UHB file: '))
                    UHBBookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked UGNT file: '))
                    UGNTBookList.push(thisParticularSuccessMsg.substring(19, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TWL file: '))
                    TWLList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked LT file: '))
                    LTBookList.push(thisParticularSuccessMsg.substring(17, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked ST file: '))
                    STBookList.push(thisParticularSuccessMsg.substring(17, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TN file: '))
                    TNBookList.push(thisParticularSuccessMsg.substring(17, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TN2 file: '))
                    TN2BookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TQ2 file: '))
                    TQ2BookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TN2 ') && thisParticularSuccessMsg.substring(14, 20) === ' file:')
                    TNList.push(thisParticularSuccessMsg.substring(21, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TQ2 ') && thisParticularSuccessMsg.substring(14, 20) === ' file:')
                    TQList.push(thisParticularSuccessMsg.substring(21, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TWL ') && thisParticularSuccessMsg.substring(15, 21) === ' file:')
                    TWLList.push(thisParticularSuccessMsg.substring(22, thisParticularSuccessMsg.length))
                else if ((regexResult = BibleRegex.exec(thisParticularSuccessMsg)) !== null
                    // but don’t do it for Book Package checks (in different repos)
                    && thisParticularSuccessMsg.startsWith(`Checked ${regexResult[1]} file`))
                    USFMBookList.push(regexResult[1]);
                else if ((regexResult = NotesRegex.exec(thisParticularSuccessMsg)) !== null
                    // but don’t do it for Book Package checks (in different repos)
                    && thisParticularSuccessMsg.startsWith(`Checked ${regexResult[1]} file`))
                    TSVNotesList.push(regexResult[1]);
                // else if ((regexResult = TWLRegex.exec(thisParticularSuccessMsg)) !== null)
                //     TWLList.push(regexResult[1]);
                else if ((regexResult = manifestRegex.exec(thisParticularSuccessMsg)) !== null)
                    manifestsList.push(regexResult[1]);
                else if ((regexResult = READMEregex.exec(thisParticularSuccessMsg)) !== null)
                    READMEsList.push(regexResult[1]);
                else if ((regexResult = LICENSEregex.exec(thisParticularSuccessMsg)) !== null)
                    LICENSEsList.push(regexResult[1]);
                else // Just copy it across
                    resultObject.successList.push(thisParticularSuccessMsg);
            }
            // Recreate original messages if exactly one found
            if (UHBBookList.length === 1)
                resultObject.successList.push(`Checked UHB file: ${UHBBookList[0]}`);
            if (UGNTBookList.length === 1)
                resultObject.successList.push(`Checked UGNT file: ${UGNTBookList[0]}`);
            // if (TWLBookList.length === 1)
            // resultObject.successList.push(`Checked TWL file: ${TWLBookList[0]}`);
            if (LTBookList.length === 1)
                resultObject.successList.push(`Checked LT file: ${LTBookList[0]}`);
            if (STBookList.length === 1)
                resultObject.successList.push(`Checked ST file: ${STBookList[0]}`);
            if (TNBookList.length === 1)
                resultObject.successList.push(`Checked TN file: ${TNBookList[0]}`);
            if (TN2BookList.length === 1)
                resultObject.successList.push(`Checked TN2 file: ${TN2BookList[0]}`);
            if (TQ2BookList.length === 1)
                resultObject.successList.push(`Checked TQ2 file: ${TQ2BookList[0]}`);
            if (USFMBookList.length === 1)
                resultObject.successList.push(`Checked ${USFMBookList[0]} file`);
            if (TSVNotesList.length === 1)
                resultObject.successList.push(`Checked ${TSVNotesList[0]} file`);
            if (TNList.length === 1)
                resultObject.successList.push(`Checked TN2 file: ${TNList[0]}`);
            if (TQList.length === 1)
                resultObject.successList.push(`Checked TQ2 file: ${TQList[0]}`);
            if (TWLList.length === 1)
                resultObject.successList.push(`Checked TWL file: ${TWLList[0]}`);
            if (manifestsList.length === 1)
                resultObject.successList.push(`Checked ${manifestsList[0]} manifest file`);
            if (READMEsList.length === 1)
                resultObject.successList.push(`Checked ${READMEsList[0]} README file`);
            if (LICENSEsList.length === 1)
                resultObject.successList.push(`Checked ${LICENSEsList[0]} LICENSE file`);
            // Put summary messages at the beginning of the list if more than one found
            // Process these messages in the opposite order than we want them to display (since we push to beginning of list each time)
            if (LICENSEsList.length > 1)
                resultObject.successList.unshift(`Checked ${LICENSEsList.length} LICENSE files: ${LICENSEsList.join(', ')}`);
            if (READMEsList.length > 1)
                resultObject.successList.unshift(`Checked ${READMEsList.length} README files: ${READMEsList.join(', ')}`);
            if (manifestsList.length > 1)
                resultObject.successList.unshift(`Checked ${manifestsList.length} manifest files: ${manifestsList.join(', ')}`);
            if (TSVNotesList.length > 1)
                resultObject.successList.unshift(`Checked ${TSVNotesList.length} TSV notes files: ${TSVNotesList.join(', ')}`);
            if (USFMBookList.length > 1)
                resultObject.successList.unshift(`Checked ${USFMBookList.length} USFM Bible files: ${USFMBookList.join(', ')}`);
            if (TWLList.length > 1)
                resultObject.successList.unshift(`Checked ${TWLList.length} TWL files: ${TWLList.join(', ')}`);
            if (TQList.length > 1)
                resultObject.successList.unshift(`Checked ${TQList.length} TQ2 files: ${TQList.join(', ')}`);
            if (TNList.length > 1)
                resultObject.successList.unshift(`Checked ${TNList.length} TN files: ${TNList.join(', ')}`);
            if (TQ2BookList.length > 1)
                resultObject.successList.unshift(`Checked ${TQ2BookList.length} TQ2 files: ${TQ2BookList.join(', ')}`);
            if (TN2BookList.length > 1)
                resultObject.successList.unshift(`Checked ${TN2BookList.length} TN2 files: ${TN2BookList.join(', ')}`);
            if (TNBookList.length > 1)
                resultObject.successList.unshift(`Checked ${TNBookList.length} TN files: ${TNBookList.join(', ')}`);
            if (STBookList.length > 1)
                resultObject.successList.unshift(`Checked ${STBookList.length} ST files: ${STBookList.join(', ')}`);
            if (LTBookList.length > 1)
                resultObject.successList.unshift(`Checked ${LTBookList.length} LT files: ${LTBookList.join(', ')}`);
            // if (TWLBookList.length > 1)
            // resultObject.successList.unshift(`Checked ${TWLBookList.length} TWL files: ${LTBookList.join(', ')}`);
            if (UGNTBookList.length > 1)
                resultObject.successList.unshift(`Checked ${UGNTBookList.length} UGNT files: ${UGNTBookList.join(', ')}`);
            if (UHBBookList.length > 1)
                resultObject.successList.unshift(`Checked ${UHBBookList.length} UHB files: ${UHBBookList.join(', ')}`);
        }
    else resultObject.successList = [];

    // Handle the checkedFilenames list
    //  which might have 100s or 1,000s of .md filenames
    if (resultObject.checkedFilenames && resultObject.checkedFilenames.length > 10) {
        // debugLog(`Have ${resultObject.checkedFilenames.length} checkedFilenames`);
        resultObject.checkedFilenames = [...new Set(resultObject.checkedFilenames)]; // Only keep unique ones
        // debugLog(`Now have ${resultObject.checkedFilenames.length} checkedFilenames`);
        // debugLog(JSON.stringify(resultObject.checkedFilenames));
    }

    // Specialised processing
    // If have s5 marker warnings, add one summary error
    // consoleLogObject('standardisedNoticeList', standardisedNoticeList);
    for (const thisParticularNotice of standardisedNoticeList) {
        // debugLog("thisParticularNotice", JSON.stringify(thisParticularNotice));
        if (thisParticularNotice.message.indexOf('\\s5') >= 0) {
            const thisNewNotice = {
                ...thisParticularNotice, priority: 701, message: "\\s5 fields should be coded as \\ts\\* milestones", location: ` in ${givenNoticeObject.checkType}`,
                // I think we need to delete these fields below as they were probably set in thisParticularNotice
                C: undefined, V: undefined, characterIndex: undefined, excerpt: undefined
            };
            // if (thisParticularNotice.filename && thisParticularNotice.filename.length)
            //     thisNewNotice.filename = thisParticularNotice.filename; // Sometimes we have an additional file identifier
            // if (thisParticularNotice.repoName && thisParticularNotice.repoName.length)
            //     thisNewNotice.repoName = thisParticularNotice.repoName; // Sometimes we have an additional file identifier
            // if (thisParticularNotice.extra && thisParticularNotice.extra.length)
            //     thisNewNotice.extra = thisParticularNotice.extra; // Sometimes we have an additional file identifier
            standardisedNoticeList.push(thisNewNotice);
            break;
        }
    }

    // Remove any notices that they have asked us to ignore
    //  plus any from our list of disabled notices (for certain repos/files, etc.)
    let remainingNoticeList = [];
    for (const thisNotice of standardisedNoticeList) {
        if (ignorePriorityNumberList.includes(thisNotice.priority))
            resultObject.numIgnoredNotices++;
        else if (isDisabledNotice(thisNotice))
            if (showDisabledNoticesFlag) {
                thisNotice.message = `(disabled) ${thisNotice.message}`;
                remainingNoticeList.push(thisNotice);
            } else // ignore it as usual
                resultObject.numDisabledNotices++;
        else
            remainingNoticeList.push(thisNotice);
    }
    if (resultObject.numIgnoredNotices)
        userLog(`processNoticesCommon: Ignored ${resultObject.numIgnoredNotices.toLocaleString()} generic notice(s) out of ${givenNoticeObject.noticeList.length.toLocaleString()}`);
    if (resultObject.numDisabledNotices)
        userLog(`processNoticesCommon: Disabled ${resultObject.numDisabledNotices.toLocaleString()} specific notice(s) out of ${givenNoticeObject.noticeList.length.toLocaleString()}`);

    // Cut off the lowest priority notices if requested
    if (cutoffPriorityLevel > 0) {
        const newNoticeList = [];
        for (const thisNotice of remainingNoticeList)
            if (thisNotice.priority < cutoffPriorityLevel)
                resultObject.numSuppressedNotices++;
            else newNoticeList.push(thisNotice);
        remainingNoticeList = newNoticeList;
    }
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push({999, "Cutoff level must not be higher than error level", excerpt:`(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);

    // Ensure that our displayed message list doesn't end up too huge for the browser to handle
    if (remainingNoticeList.length > 6000) {
        maximumHiddenNotices = Math.min(20, maximumHiddenNotices);
        maximumHiddenNoticesMessage = `Further hidden notices (beyond ${maximumHiddenNotices}) were suppressed!`;
    }
    if (remainingNoticeList.length > 10000) {
        maximumSimilarMessages = Math.min(2, maximumSimilarMessages);
        standardisedNoticeList.push({ priority: 1, message: `Reduced numbers of similar and hidden messages because of large list (${standardisedNoticeList.length.toLocaleString()})`, location: " during notice processing" });
    }

    // Sort the remainingNoticeList as required
    const SORT_LIST = ['TN', 'TN2', 'LT', 'ST', 'UHB', 'UGNT', 'TWL', 'TW', 'TQ', 'TQ2', 'SN', 'SQ', 'TA', undefined, 'README', 'LICENSE'];
    if (sortBy === 'ByPriority' || sortBy === 'ByRepo')
        // NOTE: We do have some notices with the same priority but different actual messages, esp. 191 Unexpected xx character after space
        remainingNoticeList.sort(function (a, b) { return `${String(b.priority).padStart(3, '0')}${b.message}` > `${String(a.priority).padStart(3, '0')}${a.message}`; });
    else if (sortBy !== 'AsFound')
        console.error(`Sorting '${sortBy}' is not implemented yet!!!`);
    if (sortBy === 'ByRepo') // sort again by repoCode string
        remainingNoticeList.sort(function (a, b) { return SORT_LIST.indexOf(a.repoCode) - SORT_LIST.indexOf(b.repoCode); });
    // remainingNoticeList.sort(function (a, b) { return b.repoCode > a.repoCode; });

    // Add in extra info if it’s there -- default is to prepend it to the msg
    //  Doing this prevents errors/warnings from different repos or books from being combined
    if (remainingNoticeList.length
        && remainingNoticeList[0].extra && remainingNoticeList[0].extra.length) {
        // debugLog(`We need to add the extra location, e.g. '${remainingNoticeList[0][5]}': will prepend it to the messages`);
        const newNoticeList = [];
        for (const thisNotice of remainingNoticeList) {
            const thisExtra = thisNotice.extra;
            // logicAssert(thisExtra && thisExtra.length, `Expect thisNotice to have an "extra" field: ${JSON.stringify(thisNotice)}`)
            const newNotice = { ...thisNotice };
            // We don’t need the extra field if we've already got this info
            if (thisExtra && thisExtra !== thisNotice.repoName && thisExtra !== thisNotice.bookID)
                newNotice.message = `${thisExtra} ${thisNotice.message}`;
            delete newNotice.extra; // since we've used it (if it existed)
            newNoticeList.push(newNotice);
        }
        remainingNoticeList = newNoticeList;
    }

    // Count the number of occurrences of each message
    //  ready for further processing
    const allTotals = {};
    for (const thisNotice of remainingNoticeList) {
        const thisCombinedID = `${String(thisNotice.priority).padStart(3, '0')}${thisNotice.message}`; // Could have identical worded messages but with different priorities
        if (isNaN(allTotals[thisCombinedID])) allTotals[thisCombinedID] = 1;
        else allTotals[thisCombinedID]++;
    }

    // debugLog(`processNoticesCommon is returning resultObject=${JSON.stringify(resultObject)}`);
    return [remainingNoticeList, allTotals, resultObject];
}
// end of processNoticesCommon function


/**
 *
 * @param {Object} givenNoticeObject
 * @param {Object} optionalProcessingOptions
 * @return {Object} containing errorList and warningList
 */
export function processNoticesToErrorsWarnings(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            errorPriorityLevel (integer; default is DEFAULT_ERROR_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            errorList
            warningList
            numIgnoredNotices, numDisabledNotices, numSuppressedNotices, numHiddenErrors, numHiddenWarnings
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
    //     userLog(`processNoticesToErrorsWarnings v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.errorList = []; resultObject.warningList = [];
    resultObject.numHiddenErrors = 0; resultObject.numHiddenWarnings = 0;

    let errorPriorityLevel;
    try {
        errorPriorityLevel = optionalProcessingOptions.errorPriorityLevel;
    } catch (npfEPLerror) { }
    if (errorPriorityLevel === undefined) {
        errorPriorityLevel = DEFAULT_ERROR_PRIORITY_LEVEL;
        // debugLog(`Using default errorPriorityLevel=${errorPriorityLevel}`);
    }
    else userLog(`Using supplied errorPriorityLevel=${errorPriorityLevel} cf. default=${DEFAULT_ERROR_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisCombinedID = `${String(thisNotice.priority).padStart(3, '0')}${thisNotice.message}`; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisCombinedID])) counter[thisCombinedID] = 1;
        else counter[thisCombinedID]++;
        if (maximumSimilarMessages > 0 && allTotals[thisCombinedID] > maximumSimilarMessages + 1 && counter[thisCombinedID] === maximumSimilarMessages + 1) {
            if (thisPriority >= errorPriorityLevel) {
                const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
                logicAssert(numHidden !== 1, `Shouldn’t suppress just one error of priority ${thisPriority}`);
                const adjHidden = Math.min(numHidden, maximumHiddenNotices);
                const numSuppressed = numHidden - adjHidden;
                resultObject.errorList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR ERROR${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
                resultObject.numHiddenErrors++;
            } else {
                const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
                logicAssert(numHidden !== 1, `Shouldn’t suppress just one warning of priority ${thisPriority}`);
                const adjHidden = Math.min(numHidden, maximumHiddenNotices);
                const numSuppressed = numHidden - adjHidden;
                resultObject.warningList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR WARNING${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
                resultObject.numHiddenWarnings++;
            }
        } else if (maximumSimilarMessages > 0 && counter[thisCombinedID] > maximumSimilarMessages + 1) {
            if (thisPriority >= errorPriorityLevel) {
                const previousObject = resultObject.errorList[resultObject.errorList.length - 1];
                try {
                    if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                        previousObject.hiddenNotices.push(thisNotice);
                        resultObject.numHiddenErrors++;
                    } else { // suppress these excess notices
                        const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                        if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                            previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                        resultObject.numSuppressedNotices++;
                    }
                } catch (e) { // presumably no hidden Notices in previous Object
                    console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                    resultObject.numSuppressedNotices++;
                }
            } else {
                const previousObject = resultObject.warningList[resultObject.warningList.length - 1];
                try {
                    if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                        previousObject.hiddenNotices.push(thisNotice);
                        resultObject.numHiddenWarnings++;
                    } else { // suppress these excess notices
                        const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                        if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                            previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                        resultObject.numSuppressedNotices++;
                    }
                } catch (e) { // presumably no hidden Notices in previous Object
                    console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                    resultObject.numSuppressedNotices++;
                }
            }
        } else if (thisPriority >= errorPriorityLevel)
            resultObject.errorList.push(thisNotice);
        else
            resultObject.warningList.push(thisNotice);
    }

    // debugLog(`processNoticesToErrorsWarnings is returning ${resultObject.successList.length} successes, ${resultObject.errorList.length} errors, and ${resultObject.warningList.length} warnings
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numHiddenErrors=${resultObject.numHiddenErrors} numHiddenWarnings=${resultObject.numHiddenWarnings}`);
    return resultObject;
}
// end of processNoticesToErrorsWarnings function


/**
 *
 * @param {Object} givenNoticeObject
 * @param {Object} optionalProcessingOptions
 * @return {Object} containing severeList, mediumList, and lowList
 */
export function processNoticesToSevereMediumLow(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            severePriorityLevel (integer; default is DEFAULT_SEVERE_PRIORITY_LEVEL above)
            mediumPriorityLevel (integer; default is DEFAULT_MEDIUM_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            severeList
            mediumList
            lowList
            numIgnoredNotices, numDisabledNotices, numSuppressedNotices, numHiddenSevere, numHiddenMedium, numHiddenLow
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
    //     userLog(`processNoticesToSevereMediumLow v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.severeList = []; resultObject.mediumList = []; resultObject.lowList = [];
    resultObject.numHiddenSevere = 0; resultObject.numHiddenMedium = 0; resultObject.numHiddenLow = 0;

    let severePriorityLevel;
    try {
        severePriorityLevel = optionalProcessingOptions.severePriorityLevel;
    } catch (npfSPLerror) { }
    if (severePriorityLevel === undefined) {
        severePriorityLevel = DEFAULT_SEVERE_PRIORITY_LEVEL;
        // debugLog(`Using default severePriorityLevel=${severePriorityLevel}`);
    }
    else userLog(`Using supplied severePriorityLevel=${severePriorityLevel} cf. default=${DEFAULT_SEVERE_PRIORITY_LEVEL}`);
    let mediumPriorityLevel;
    try {
        mediumPriorityLevel = optionalProcessingOptions.mediumPriorityLevel;
    } catch (nfpMPLerror) { }
    if (mediumPriorityLevel === undefined) {
        mediumPriorityLevel = DEFAULT_MEDIUM_PRIORITY_LEVEL;
        // debugLog(`Using default mediumPriorityLevel=${mediumPriorityLevel}`);
    }
    else userLog(`Using supplied mediumPriorityLevel=${mediumPriorityLevel} cf. default=${DEFAULT_MEDIUM_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisCombinedID = `${String(thisNotice.priority).padStart(3, '0')}${thisNotice.message}`; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisCombinedID])) counter[thisCombinedID] = 1;
        else counter[thisCombinedID]++;
        if (maximumSimilarMessages > 0 && allTotals[thisCombinedID] > maximumSimilarMessages + 1 && counter[thisCombinedID] === maximumSimilarMessages + 1) {
            if (thisPriority >= severePriorityLevel) {
                const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
                logicAssert(numHidden !== 1, `Shouldn’t suppress just one severe error of priority ${thisPriority}`);
                const adjHidden = Math.min(numHidden, maximumHiddenNotices);
                const numSuppressed = numHidden - adjHidden;
                resultObject.severeList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR ERROR${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
                resultObject.numHiddenSevere++;
            } else if (thisPriority >= mediumPriorityLevel) {
                const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
                logicAssert(numHidden !== 1, `Shouldn’t suppress just one medium error of priority ${thisPriority}`);
                const adjHidden = Math.min(numHidden, maximumHiddenNotices);
                const numSuppressed = numHidden - adjHidden;
                resultObject.mediumList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR ERROR${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
                resultObject.numHiddenMedium++;
            } else {
                const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
                logicAssert(numHidden !== 1, `Shouldn’t suppress just one low warning of priority ${thisPriority}`);
                const adjHidden = Math.min(numHidden, maximumHiddenNotices);
                const numSuppressed = numHidden - adjHidden;
                resultObject.lowList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR WARNING${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
                resultObject.numHiddenLow++;
            }
        } else if (maximumSimilarMessages > 0 && counter[thisCombinedID] > maximumSimilarMessages + 1) {
            if (thisPriority >= severePriorityLevel) {
                const previousObject = resultObject.severeList[resultObject.severeList.length - 1];
                try {
                    if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                        previousObject.hiddenNotices.push(thisNotice);
                        resultObject.numHiddenSevere++;
                    } else { // suppress these excess notices
                        const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                        if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                            previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                        resultObject.numSuppressedNotices++;
                    }
                } catch (e) { // presumably no hidden Notices in previous Object
                    console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                    resultObject.numSuppressedNotices++;
                }
            } else if (thisPriority >= mediumPriorityLevel) {
                const previousObject = resultObject.mediumList[resultObject.mediumList.length - 1];
                try {
                    if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                        previousObject.hiddenNotices.push(thisNotice);
                        resultObject.numHiddenMedium++;
                    } else { // suppress these excess notices
                        const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                        if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                            previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                        resultObject.numSuppressedNotices++;
                    }
                } catch (e) { // presumably no hidden Notices in previous Object
                    console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                    resultObject.numSuppressedNotices++;
                }
            } else {
                const previousObject = resultObject.lowList[resultObject.lowList.length - 1];
                try {
                    if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                        previousObject.hiddenNotices.push(thisNotice);
                        resultObject.numHiddenLow++;
                    } else { // suppress these excess notices
                        const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                        if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                            previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                        resultObject.numSuppressedNotices++;
                    }
                } catch (e) { // presumably no hidden Notices in previous Object
                    console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                    resultObject.numSuppressedNotices++;
                }
            }
        } else if (thisPriority >= severePriorityLevel)
            resultObject.severeList.push(thisNotice);
        else if (thisPriority >= mediumPriorityLevel)
            resultObject.mediumList.push(thisNotice);
        else
            resultObject.lowList.push(thisNotice);
    }

    // debugLog(`processNoticesToSevereMediumLow is returning ${resultObject.successList.length} successes, ${resultObject.severeList.length} severe, ${resultObject.mediumList.length} medium, and ${resultObject.lowList.length} low
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numHiddenSevere=${resultObject.numHiddenSevere} numHiddenMedium=${resultObject.numHiddenMedium} numHiddenLow=${resultObject.numHiddenLow}`);
    return resultObject;
}
// end of processNoticesToSevereMediumLow function


/**
 *
 * @param {Object} givenNoticeObject
 * @param {Object} optionalProcessingOptions
 * @return {Object} containing warningList
 */
export function processNoticesToSingleList(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            severePriorityLevel (integer; default is DEFAULT_SEVERE_PRIORITY_LEVEL above)
            mediumPriorityLevel (integer; default is DEFAULT_MEDIUM_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            warningList
            numIgnoredNotices, numDisabledNotices, numSuppressedNotices, numHiddenNotices
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
    //     userLog(`processNoticesToSingleList v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.warningList = []; resultObject.numHiddenNotices = 0;

    // Check for repeated notices that should be compressed
    //  while simultaneously creating warning list
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisCombinedID = `${String(thisNotice.priority).padStart(3, '0')}${thisNotice.message}`; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisCombinedID])) counter[thisCombinedID] = 1;
        else counter[thisCombinedID]++;
        if (maximumSimilarMessages > 0 && allTotals[thisCombinedID] > maximumSimilarMessages + 1 && counter[thisCombinedID] === maximumSimilarMessages + 1) {
            const numHidden = allTotals[thisCombinedID] - maximumSimilarMessages;
            logicAssert(numHidden !== 1, `Shouldn’t suppress just one notice of priority ${thisPriority}`);
            const adjHidden = Math.min(numHidden, maximumHiddenNotices);
            const numSuppressed = numHidden - adjHidden;
            resultObject.warningList.push({ priority: thisPriority, message: thisMsg, location: ` ↑ ${adjHidden.toLocaleString()} MORE SIMILAR NOTICE${adjHidden === 1 ? '' : 'S'} HIDDEN${numSuppressed ? ` (PLUS ${numSuppressed.toLocaleString()} SUPPRESSED)` : ''}`, hiddenNotices: [thisNotice] });
            resultObject.numHiddenNotices++;
        } else if (maximumSimilarMessages > 0 && counter[thisCombinedID] > maximumSimilarMessages + 1) {
            // debugLog(`Have thisCombinedID='${thisCombinedID}' and ${counter[thisCombinedID]}`)
            const previousObject = resultObject.warningList[resultObject.warningList.length - 1];
            try {
                // console.assert(previousObject, `previousObject should be defined: ${resultObject.warningList.length}`);
                // console.assert(previousObject.hiddenNotices, `resultObject.warningList[${resultObject.warningList.length-1}].hiddenNotices should be defined: now ${JSON.stringify(thisNotice, 2)} with ${JSON.stringify(previousObject, 2)} and before that ${JSON.stringify(resultObject.warningList[resultObject.warningList.length-2])}`);
                if (previousObject.hiddenNotices.length < maximumHiddenNotices) {
                    previousObject.hiddenNotices.push(thisNotice);
                    resultObject.numHiddenNotices++;
                } else { // suppress these excess notices
                    const lastHiddenNoticeObject = previousObject.hiddenNotices[previousObject.hiddenNotices.length - 1];
                    if (lastHiddenNoticeObject.message !== maximumHiddenNoticesMessage)
                        previousObject.hiddenNotices.push({ priority: thisNotice.priority, message: maximumHiddenNoticesMessage });
                    resultObject.numSuppressedNotices++;
                }
            } catch (e) { // presumably no hidden Notices in previous Object
                console.assert(!previousObject.hiddenNotices, `Didn't expected hiddenNotices to be defined: ${JSON.stringify(previousObject)} error was: ${e.message}`);
                resultObject.numSuppressedNotices++;
            }
        } else
            resultObject.warningList.push(thisNotice);
    }

    // debugLog(`processNoticesToSingleList is returning ${resultObject.successList.length} successes, ${resultObject.warningList.length} warnings
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numHiddenNotices=${resultObject.numHiddenNotices}`);
    return resultObject;
}
// end of processNoticesToSingleList function
