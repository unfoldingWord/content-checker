import * as books from './books/books';
import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import { checkTN_TSVDataRow } from './tn-tsv9-row-check';
import { removeDisabledNotices } from './disabled-notices';
import { debugLog, parameterAssert } from './utilities';


const TN_TABLE_TEXT_VALIDATOR_VERSION_STRING = '0.4.0';

const NUM_EXPECTED_TN_TSV_FIELDS = 9; // so expects 8 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';


/**
 *
 * @param {string} languageCode
 * @param {string} bookID
 * @param {string} filename
 * @param {string} tableText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkTN_TSV9Table(languageCode, bookID, filename, tableText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkTN_TSV9Table(${languageCode}, ${bookID}, ${filename}, ${tableText.length}, ${givenLocation},${JSON.stringify(checkingOptions)})…`);
    parameterAssert(languageCode !== undefined, "checkTN_TSV9Table: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkTN_TSV9Table: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    parameterAssert(bookID !== undefined, "checkTN_TSV9Table: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkTN_TSV9Table: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(bookID.length === 3, `checkTN_TSV9Table: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkTN_TSV9Table: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(books.isValidBookID(bookID), `checkTN_TSV9Table: '${bookID}' is not a valid USFM book identifier`);
    parameterAssert(givenLocation !== undefined, "checkTN_TSV9Table: 'givenLocation' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkTN_TSV9Table: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);
    parameterAssert(checkingOptions !== undefined, "checkTN_TSV9Table: 'checkingOptions' parameter should be defined");

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ttResult = { successList: [], noticeList: [] };

    /**
     *
     * @param {string} successString
     */
    function addSuccessMessage(successString) {
        // functionLog(`checkTN_TSV9Table success: ${successString}`);
        ttResult.successList.push(successString);
    }
    /**
     *
     * @param {Object} noticeObject
     */
    function addNoticePartial(noticeObject) {
        // functionLog(`checkTN_TSV9Table notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "TSV addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `TSV addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "TSV addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `TSV addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(C !== undefined, "TSV addNoticePartial: 'C' parameter should be defined");
        if (noticeObject.C) parameterAssert(typeof noticeObject.C === 'string', `TSV addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        // parameterAssert(V !== undefined, "TSV addNoticePartial: 'V' parameter should be defined");
        if (noticeObject.V) parameterAssert(typeof noticeObject.V === 'string', `TSV addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        // parameterAssert(characterIndex !== undefined, "TSV addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `TSV addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "TSV addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `TSV addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "TSV addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `TSV addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkTN_TSV9Table ${noticeObject.debugChain}`;
        // NOTE: We only add the repoCode here because this function is called directly by tC Create
        //          and notice disabling currently depends on knowing the repoCode
        if (noticeObject.repoCode) debugLog(`checkTN_TSV9Table.addNoticePartial already had repoCode=${noticeObject.repoCode} (will be lost)`);
        ttResult.noticeList.push({ ...noticeObject, bookID, filename, repoCode: 'TN' });
    }


    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (ttcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // debugLog(`Using default extractLength=${extractLength}`);
    }
    // else
    // debugLog(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // debugLog(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in tn_table-text-check");
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    }
    catch {
        if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
            addNoticePartial({ priority: 747, message: "Bad function call: should be given a valid book abbreviation", extract: bookID, location: ` (not '${bookID}')${ourLocation}` });
    }

    let lines = tableText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines (expecting ${NUM_EXPECTED_TN_FIELDS} fields in each line)`);

    let lastB = '', lastC = '', lastV = '';
    let rowIDList = [], uniqueRowList = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        // functionLog(`checkTN_TSV9Table checking line ${n}: ${JSON.stringify(lines[n])}`);
        if (n === 0) {
            if (lines[0] === EXPECTED_TN_HEADING_LINE)
                addSuccessMessage(`Checked TSV header ${ourLocation}`);
            else
                addNoticePartial({ priority: 746, message: "Bad TSV header", lineNumber: n + 1, location: `${ourLocation}: '${lines[0]}'` });
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_TN_TSV_FIELDS) {
                // eslint-disable-next-line no-unused-vars
                const [B, C, V, rowID, supportReference, origQuote, occurrence, _GLQuote, _occurrenceNote] = fields;

                // Use the row check to do most basic checks
                const drResultObject = await checkTN_TSVDataRow(languageCode, lines[n], bookID, C, V, ourLocation, checkingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                // result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
                //  process results line by line
                for (const drNoticeEntry of drResultObject.noticeList)
                    if (drNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN check
                        ttResult.noticeList.push(drNoticeEntry); // Just copy the complete notice as is
                    else
                        addNoticePartial({ ...drNoticeEntry, lineNumber: n + 1 });
                // The following is needed coz we might be checking the linked TA and/or TW articles
                if (drResultObject.checkedFileCount && drResultObject.checkedFileCount > 0)
                    if (typeof ttResult.checkedFileCount === 'number') ttResult.checkedFileCount += drResultObject.checkedFileCount;
                    else ttResult.checkedFileCount = drResultObject.checkedFileCount;
                if (drResultObject.checkedFilesizes && drResultObject.checkedFilesizes > 0)
                    if (typeof ttResult.checkedFilesizes === 'number') ttResult.checkedFilesizes += drResultObject.checkedFilesizes;
                    else ttResult.checkedFilesizes = drResultObject.checkedFilesizes;
                if (drResultObject.checkedRepoNames && drResultObject.checkedRepoNames.length > 0)
                    for (const checkedRepoName of drResultObject.checkedRepoNames)
                        try { if (ttResult.checkedRepoNames.indexOf(checkedRepoName) < 0) ttResult.checkedRepoNames.push(checkedRepoName); }
                        catch { ttResult.checkedRepoNames = [checkedRepoName]; }
                if (drResultObject.checkedFilenameExtensions && drResultObject.checkedFilenameExtensions.length > 0)
                    for (const checkedFilenameExtension of drResultObject.checkedFilenameExtensions)
                        try { if (ttResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) ttResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                        catch { ttResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
                // if (ttResult.checkedFilenameExtensions) userLog("ttResult", JSON.stringify(ttResult));

                // So here we only have to check against the previous and next fields for out-of-order problems and duplicate problems
                if (B !== lastB || C !== lastC || V !== lastV) {
                    rowIDList = []; // ID's only need to be unique within each verse
                    uniqueRowList = []; // Same for these
                }

                // TODO: Check if we need this at all (even though tC 3.0 can’t display these "duplicate" notes)
                // Check for duplicate notes
                const uniqueID = C + V + supportReference + origQuote + occurrence; // This combination should not be repeated
                // if (uniqueRowList.includes(uniqueID))
                //     addNoticePartial({ priority: 880, C, V, message: `Duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                // if (uniqueRowList.includes(uniqueID))
                //     addNoticePartial({ priority: 80, C, V, message: `Note: tC 3.0 won’t display duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                uniqueRowList.push(uniqueID);

                if (B) {
                    if (B !== bookID)
                        addNoticePartial({ priority: 745, C, V, message: `Wrong '${B}' book identifier (expected '${bookID}')`, rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticePartial({ priority: 744, C, V, message: "Missing book identifier", rowID, lineNumber: n + 1, location: ourLocation });

                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticePartial({ priority: 551, C, V, message: `Invalid zero chapter number`, rowID, lineNumber: n + 1, extract: C, location: ourLocation });
                        if (intC > numChaptersThisBook)
                            addNoticePartial({ priority: 737, C, V, message: "Invalid large chapter number", rowID, lineNumber: n + 1, extract: C, location: ourLocation });
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticePartial({ priority: 736, C, V, message: "Receding chapter number", details: `'${C}' after '${lastC}'`, rowID, lineNumber: n + 1, location: ourLocation });
                            else if (intC > lastintC + 1)
                                addNoticePartial({ priority: 735, C, V, message: "Advancing chapter number", details: `'${C}' after '${lastC}'`.rowID, lineNumber: n + 1, location: ourLocation });
                        }
                    }
                    else
                        addNoticePartial({ priority: 734, C, V, message: "Bad chapter number", rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticePartial({ priority: 739, C, V, message: "Missing chapter number", rowID, lineNumber: n + 1, location: ` after ${lastC}:${V}${ourLocation}` });

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0 && bookID !== 'PSA') // Psalms have \d titles
                            addNoticePartial({ priority: 552, C, V, message: "Invalid zero verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 734, C, V, message: "Invalid large verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (C === lastC && intV < lastintV)
                                addNoticePartial({ priority: 733, C, V, message: "Receding verse number", details: `'${V}' after '${lastV} for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                            // else if (intV > lastintV + 1)
                            //   addNoticePartial({priority:556, "Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticePartial({ priority: 738, C, V, message: "Bad verse number", rowID, lineNumber: n + 1, location: ourLocation });

                }
                else
                    addNoticePartial({ priority: 790, C, V, message: "Missing verse number", rowID, lineNumber: n + 1, location: ` after ${C}:${lastV}${ourLocation}` });

                if (rowID) {
                    if (rowIDList.includes(rowID))
                        addNoticePartial({ priority: 729, C, V, message: `Duplicate '${rowID}' ID`, fieldName: 'ID', rowID, lineNumber: n + 1, location: ourLocation });
                } else
                    addNoticePartial({ priority: 730, C, V, message: "Missing ID", fieldName: 'ID', lineNumber: n + 1, location: ourLocation });


                lastB = B; lastC = C; lastV = V;

            } else // wrong number of fields in the row
                // if (n === lines.length - 1) // it’s the last line
                //     userLog(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) { // it’s not the last line
                    // Have a go at getting some of the first fields out of the line
                    let C = '?', V = '?', rowID = '????';
                    try { C = fields[1]; } catch { }
                    try { V = fields[2]; } catch { }
                    try { rowID = fields[3]; } catch { }
                    addNoticePartial({ priority: 988, message: `Wrong number of tabbed fields (expected ${NUM_EXPECTED_TN_TSV_FIELDS})`, extract: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, C, V, rowID, lineNumber: n + 1, location: ourLocation });
                }
        }
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkTN_TSV9Table: calling removeDisabledNotices(${ttResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        ttResult.noticeList = removeDisabledNotices(ttResult.noticeList);
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 20)
        && checkingOptions?.disableAllLinkFetchingFlag)
        addNoticePartial({ priority: 20, message: "Note that 'disableAllLinkFetchingFlag' was set so link targets were not checked", location: ourLocation });

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (ttResult.noticeList)
        addSuccessMessage(`checkTN_TSV9Table v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING} finished with ${ttResult.noticeList.length ? ttResult.noticeList.length.toLocaleString() : "zero"} notice${ttResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkTN_TSV9Table v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkTN_TSV9Table returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkTN_TSV9Table result is", JSON.stringify(result));
    return ttResult;
}
// end of checkTN_TSV9Table function
