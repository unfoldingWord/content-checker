import * as books from '../core/books/books';
// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { cachedGetFile } from '../core/getApi';
// eslint-disable-next-line no-unused-vars
import { functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt } from './utilities';


// const QUOTE_VALIDATOR_VERSION_STRING = '0.9.7';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode
 * @param {string} fieldName
 * @param {string} fieldText
 * @param {string} occurrenceString
 * @param {string} bookID
 * @param {string} C
 * @param {string} V
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkOriginalLanguageQuoteAndOccurrence(languageCode, repoCode, fieldName, fieldText, occurrenceString, bookID, C, V, givenLocation, checkingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // Also checks that the Occurrence is valid

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // Note that the original language verse text can be passed in as
    //      checkingOptions?.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      checkingOptions?.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      checkingOptions?.originalLanguageRepoBranch (or tag)

    // functionLog(`checkOriginalLanguageQuoteAndOccurrence v${QUOTE_VALIDATOR_VERSION_STRING} ${languageCode}, ${repoCode}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${occurrenceString}, ${bookID} ${C}:${V} ${givenLocation}, …)…`);
    //parameterAssert(languageCode !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fieldName !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //parameterAssert(fieldText !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //parameterAssert(fieldText.length >= 1, `checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should have text not ${fieldText.length} characters`);
    //parameterAssert(occurrenceString !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'occurrenceString' parameter should be defined");
    //parameterAssert(typeof occurrenceString === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'occurrenceString' parameter should be a string not a '${typeof occurrenceString}'`);
    //parameterAssert(bookID !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkOriginalLanguageQuoteAndOccurrence: '${bookID}' is not a valid USFM book identifier`);
    //parameterAssert(C !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'C' parameter should be defined");
    //parameterAssert(typeof C === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'C' parameter should be a string not a '${typeof C}'`);
    //parameterAssert(V !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'V' parameter should be defined");
    //parameterAssert(typeof V === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'V' parameter should be a string not a '${typeof V}'`);
    //parameterAssert(givenLocation !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);

    const discontiguousDivider = (repoCode === 'TN') ? '…' : ' & ';
    const wrongDiscontiguousDivider = (repoCode === 'TN') ? '&' : '…'; // leave out the spaces around ampersand
    // debugLog(`Got discontiguousDivider='${discontiguousDivider}' for ${repoCode}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const colqResult = { noticeList: [] };

    function addNotice(noticeObject) {
        // functionLog(`checkOriginalLanguageQuoteAndOccurrence Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cOLQ addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cOLQ addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cOLQ addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cOLQ addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cOLQ addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cOLQ addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cOLQ addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cOLQ addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt} for ${noticeObject.priority}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cOLQ addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cOLQ addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        colqResult.noticeList.push(noticeObject);
    }

    /**
     *
     * @param {string} bookID -- USFM book ID or 'OBS'
     * @param {string} C -- chapter or story number
     * @param {string} V -- verse or frame number
     * @param {Object} checkingOptions
     */
    async function getOriginalPassage(bookID, C, V, checkingOptions) {
        // TODO: Cache these ???

        // functionLog(`getOriginalPassage(${bookID}, ${C}, ${V})…`);
        let username;
        try {
            username = checkingOptions?.originalLanguageRepoUsername;
        } catch (qcoError) { }
        if (!username) username = languageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog'; // ??? !!!
        let branch;
        try {
            branch = checkingOptions?.originalLanguageRepoBranch;
        } catch (qcunError) { }
        if (!branch) branch = 'master';
        const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;

        let verseText = '';
        if (bookID === 'OBS') {
            let originalMarkdown;
            const OBSRepoName = `${languageCode}_obs`;
            const adjC = C.length === 2 ? C : '0' + C;
            const adjV = V.length === 2 ? V : '0' + V;
            const OBSPathname = `content/${adjC}.md`;
            try {
                originalMarkdown = await getFile_({ username, repository: OBSRepoName, path: OBSPathname, branch });
                // debugLog("Fetched fileContent for", OBSRepoName, OBSPathname, typeof originalMarkdown, originalMarkdown.length);
            } catch (gcUHBerror) {
                console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, languageCode, OBSPathname, branch, gcUHBerror.message);
                addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUHBerror}`, OBSPathname, location: ourLocation, extra: OBSRepoName });
            }
            if (!originalMarkdown) return '';

            let gotIt = V === 'intro'; // normally false, but true for intro (so grabs first line of text = heading line)
            const searchString = `-${adjC}-${adjV}.`;
            // NOTE: Bible references get appended to the last frame text (but I don’t think it does any harm)
            for (const line of originalMarkdown.split('\n')) {
                if (!line) continue;
                if (line.indexOf(searchString) > 0) { gotIt = true; continue; }
                if (gotIt)
                    if (line.indexOf('[OBS Image]') > 0) // This is the next frame
                        break;
                    else
                        verseText += line; // NOTE: works coz all text on one line, otherwise would need to insert spaces here
            }
            // debugLog(`Got OBS ${V}:${C} '${verseText}'`);
        } else { // not OBS, so a USFM Bible book
            const bookNumberAndName = books.usfmNumberName(bookID);
            let whichTestament;
            try {
                whichTestament = books.testament(bookID); // returns 'old' or 'new'
            } catch (bNNerror) {
                if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
                    whichTestament = 'other';
            }
            logicAssert(whichTestament === 'old' || whichTestament === 'new', `getOriginalPassage() couldn't find testament for '${bookID}'`);
            const originalLanguageRepoLanguageCode = whichTestament === 'old' ? 'hbo' : 'el-x-koine';
            const originalLanguageRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
            const originalLanguageRepoName = `${originalLanguageRepoLanguageCode}_${originalLanguageRepoCode.toLowerCase()}`;
            const filename = `${bookNumberAndName}.usfm`;

            let originalUSFM;
            // debugLog(`Need to check against ${originalLanguageRepoCode}`);
            if (originalLanguageRepoCode === 'UHB') {
                try {
                    originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUHBerror) {
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                    addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUHBerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            } else if (originalLanguageRepoCode === 'UGNT') {
                try {
                    originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUGNTerror) {
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UGNT`, username, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                    addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUGNTerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            }
            if (!originalUSFM) return '';


            // Do global fixes
            originalUSFM = originalUSFM.replace(/\\k-e\\\*/g, ''); // Remove \k-e self-closed milestones
            originalUSFM = originalUSFM.replace(/\\k-s.+?\\\*/g, ''); // Remove \k-s self-closed milestones


            // Now find the desired C:V
            let foundChapter = false, foundVerse = false;
            for (let bookLine of originalUSFM.split('\n')) {
                // debugLog("bookLine", bookLine);
                if (!foundChapter && bookLine === `\\c ${C}`) {
                    foundChapter = true;
                    continue;
                }
                if (foundChapter && !foundVerse && bookLine.startsWith(`\\v ${V}`)) {
                    foundVerse = true;
                    bookLine = bookLine.substring(3 + V.length); // Delete verse number so below bit doesn’t fail
                }
                if (foundVerse) {
                    if (bookLine.startsWith('\\v ') || bookLine.startsWith('\\c '))
                        break; // Don’t go into the next verse or chapter
                    verseText += (bookLine.startsWith('\\f ') ? '' : ' ') + bookLine;
                }
            }
            verseText = verseText.replace(/\\p/g, '').trim().replace(/ {2}/g, ' ')
            // debugLog(`Got verse text1: '${verseText}'`);

            // Remove \w fields (just leaving the actual Bible text words)
            let ixW = verseText.indexOf('\\w ')
            while (ixW !== -1) {
                const ixEnd = verseText.indexOf('\\w*', ixW)
                if (ixEnd !== -1) {
                    const field = verseText.substring(ixW + 3, ixEnd);
                    const bits = field.split('|');
                    const adjusted_field = bits[0];
                    verseText = verseText.substring(0, ixW) + adjusted_field + verseText.substring(ixEnd + 3);
                } else {
                    debugLog(`Missing \\w* in ${bookID} ${C}:${V} verseText: '${verseText}'`);
                    verseText = verseText.replace(/\\w /g, '', 1); // Attempt to limp on
                }
                ixW = verseText.indexOf('\\w ', ixW + 1); // Might be another one
            }
            // debugLog(`Got verse text2: '${verseText}'`);

            // Remove footnotes
            verseText = verseText.replace(/\\f (.+?)\\f\*/g, '');
            // Remove alternative versifications
            verseText = verseText.replace(/\\va (.+?)\\va\*/g, '');
            // debugLog(`Got verse text3: '${verseText}'`);

            // Final clean-up (shouldn’t be necessary, but just in case)
            verseText = verseText.replace(/ {2}/g, ' ');
            //parameterAssert(verseText.indexOf('\\w') === -1, `getOriginalPassage: Should be no \\w in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\k') === -1, `getOriginalPassage: Should be no \\k in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('x-') === -1, `getOriginalPassage: Should be no x- in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\f') === -1, `getOriginalPassage: Should be no \\f in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\x') === -1, `getOriginalPassage: Should be no \\x in ${bookID} ${C}:${V} '${verseText}'`);
        }

        // debugLog(`  getOriginalPassage(${bookID} ${C}:${V}) is returning '${verseText}'`);
        return verseText;
    }
    // end of getOriginalPassage function


    /**
     *
     * @param {string} foundQuoteSegment -- an origQuote, or a segment of an origQuote, that exists in the verseText
     * @param {string} partDescription -- empty string if first parameter is the entire origQuote else a descriptive word (like "beginning")
     * @param {string} occurrenceString -- from the source file
     * @param {string} partialVerseText -- relevant section of origL verse text
     * @param {string} fullVerseText -- origL verse text
     * @param {Object} location
     * @description Checks that the segment (although found so we know it's in the verse) actually starts and ends at word breaks
     */
    function checkFoundQuoteSegment(foundQuoteSegment, partDescription, occurrenceString, partialVerseText, fullVerseText, location) {
        // if (partDescription) functionLog(`checkFoundQuoteSegment(${foundQuoteSegment}, ${partDescription}, ${verseText}, ${location}) ${C}:${V}…`);
        //parameterAssert(foundQuoteSegment !== undefined, "checkFoundQuoteSegment: 'foundQuoteSegment' parameter should be defined");
        //parameterAssert(typeof foundQuoteSegment === 'string', `checkFoundQuoteSegment: 'foundQuoteSegment' parameter should be a string not a '${typeof foundQuoteSegment}'`);
        //parameterAssert(foundQuoteSegment.indexOf(discontiguousDivider) === -1, `checkFoundQuoteSegment: 'foundQuoteSegment' parameter should not contain '${discontiguousDivider}' divider: '${foundQuoteSegment}'`);
        //parameterAssert(partDescription !== undefined, "checkFoundQuoteSegment: 'partDescription' parameter should be defined");
        //parameterAssert(typeof partDescription === 'string', `checkFoundQuoteSegment: 'partDescription' parameter should be a string not a '${typeof partDescription}'`);
        //parameterAssert(occurrenceString !== undefined, "checkFoundQuoteSegment: 'occurrenceString' parameter should be defined");
        //parameterAssert(typeof occurrenceString === 'string', `checkFoundQuoteSegment: 'occurrenceString' parameter should be a string not a '${typeof occurrenceString}'`);
        //parameterAssert(partialVerseText !== undefined, "checkFoundQuoteSegment: 'partialVerseText' parameter should be defined");
        //parameterAssert(typeof partialVerseText === 'string', `checkFoundQuoteSegment: 'partialVerseText' parameter should be a string not a '${typeof partialVerseText}'`);
        //parameterAssert(fullVerseText !== undefined, "checkFoundQuoteSegment: 'fullVerseText' parameter should be defined");
        //parameterAssert(typeof fullVerseText === 'string', `checkFoundQuoteSegment: 'fullVerseText' parameter should be a string not a '${typeof fullVerseText}'`);
        //parameterAssert(fullVerseText.length >= partialVerseText.length, `checkFoundQuoteSegment: 'partialVerseText' should not be longer`);
        //parameterAssert(location !== undefined, "checkFoundQuoteSegment: 'location' parameter should be defined");
        //parameterAssert(typeof location === 'string', `checkFoundQuoteSegment: 'location' parameter should be a string not a '${typeof location}'`);

        let details = `verse text ◗${fullVerseText}◖`;
        if (partDescription.length) details = `${partDescription} part of quote = "${foundQuoteSegment}" -- ${details}`;

        let remainingVerseBits = partialVerseText.split(foundQuoteSegment); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
        if (remainingVerseBits.length > 2) // Join the extra bits back up
            remainingVerseBits = [remainingVerseBits[0], remainingVerseBits.slice(1).join(discontiguousDivider)];
        logicAssert(remainingVerseBits.length === 2, `remaining bits are ${remainingVerseBits.length}`);

        // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
        // Note: Straight quotes are included here (even though unwanted) as other code warns about them
        // Note: We don't give errors for leading or trailing spaces here, coz that's done elsewhere
        const precedingChar = remainingVerseBits[0].slice(-1);
        // debugLog(`Previous char before ${C}:${V} '${foundQuoteSegment}' is '${precedingChar}'`);
        // const precedingRegex = new RegExp('[ ־*[("\'“‘]', 'g');
        // NOTE: This algorithm has to handle a single word inside another prior word, e.g., searching for δὲ in οὐδὲν δὲ συνκεκαλυμμένον ἐστὶν
        if (foundQuoteSegment.slice(0) !== ' ' && remainingVerseBits[0]
            && precedingChar && ' ־*[("\'“‘—'.indexOf(precedingChar) === -1 // handle punctuation expected before words
            && (foundQuoteSegment.indexOf(' ') !== -1 || partialVerseText.indexOf(` ${foundQuoteSegment}`) === -1) // it's multiword, or there's not another word that fits
        ) {
            let precederDescription;
            if (precedingChar === '\u2060') precederDescription = 'WordJoiner';
            else if (precedingChar === '\u200D') precederDescription = 'ZeroWidth-WordJoiner';
            else precederDescription = `${precedingChar}=D${precedingChar.charCodeAt(0)}/H${precedingChar.charCodeAt(0).toString(16)}`;
            // debugLog(`Seems ${bookID} ${C}:${V} '${foundQuoteSegment}' might not start at the beginning of a word—it’s preceded by '${precederDescription}' in '${partialVerseText}' of '${fullVerseText}'`);
            const excerpt = `(${precederDescription})${foundQuoteSegment.substring(0, excerptLength - 3)}${(foundQuoteSegment.length > excerptLength - 3 ? '…' : '')}${occurrenceString.length ? ` occurrence=${occurrenceString}` : ''}`;
            // We greatly lower the priority if we're less sure that it's a genuine error
            addNotice({ priority: foundQuoteSegment.indexOf(' ') !== -1 || fullVerseText.search(` ${foundQuoteSegment}`) === -1 ? 909 : 389, message: "Seems original language quote might not start at the beginning of a word", details, characterIndex: 0, excerpt, location });
        }
        const followingChar = remainingVerseBits[1][0];
        // debugLog(`Next char after ${C}:${V} '${foundQuoteSegment}' is '${followingChar}'`);
        // Note: There's some Hebrew (RTL) characters at the beginning of the following string used in regex
        const allowedWordEndChars = ' ׃־.,:;?!–—)…'; // Ellipsis occurs in UGNT, e.g., Rom 3:15, Rev 2:26, 18:7
        // We make up the RegEx on the fly but we need to escape special chars in foundQuoteSegment
        // debugLog(`checkFoundQuoteSegment ${bookID} ${C}:${V} regex will be '${foundQuoteSegment}[${allowedWordEndChars}]'`);
        const escapedFoundQuoteSegment = foundQuoteSegment.replace(/\(/g, '\\(').replace(/\)/g, '\\)'); // Segments may have any one or more of these (not necessarily matched)
        // if (escapedFoundQuoteSegment !== foundQuoteSegment ) debugLog(`checkFoundQuoteSegment ${bookID} ${C}:${V} from '${foundQuoteSegment}' regex will be '${escapedFoundQuoteSegment}[${allowedWordEndChars}]'`);
        const followingRegex = new RegExp(`${escapedFoundQuoteSegment}[${allowedWordEndChars}]`, 'g');
        if (foundQuoteSegment.slice(-1) !== ' ' && remainingVerseBits[1]
            && followingChar && allowedWordEndChars.indexOf(followingChar) === -1 // handle punctuation expected after words
            && (foundQuoteSegment.indexOf(' ') !== -1 || partialVerseText.search(followingRegex) === -1) // it's multiword, or there's not another word that fits
        ) {
            // No problems if quote is followed by expected terminator-type punctuation
            // const badCharString = `'${followingChar}'=D${followingChar.charCodeAt(0)}/H${followingChar.charCodeAt(0).toString(16)}`;
            // debugLog(`Seems ${bookID} ${C}:${V} '${foundQuoteSegment}' might not finish at the end of a word—it’s followed by ${badCharString} in '${partialVerseText}' of '${fullVerseText}'`);
            const excerpt = `${(foundQuoteSegment.length > excerptLength - 3 ? '…' : '')}${foundQuoteSegment.substring(foundQuoteSegment.length - excerptLength + 3, foundQuoteSegment.length)}(${followingChar}=D${remainingVerseBits[1].charCodeAt(0)}/H${remainingVerseBits[1].charCodeAt(0).toString(16)})${occurrenceString.length ? ` occurrence=${occurrenceString}` : ''}`;
            // We greatly lower the priority if we're less sure that it's a genuine error
            addNotice({ priority: foundQuoteSegment.indexOf(' ') !== -1 || fullVerseText.search(followingRegex) === -1 ? 908 : 388, message: "Seems original language quote might not finish at the end of a word", details, characterIndex: foundQuoteSegment.length, excerpt, location });
        }
    }
    // end of checkFoundQuoteSegment function


    /**
     *
     * @param {string} notFoundQuoteSegment -- an origQuote, or a segment of an origQuote, that exists in the verseText
     * @param {string} partDescription -- empty string if first parameter is the entire origQuote else a descriptive word (like "beginning")
     * @param {string} fullVerseText -- origL verse text
     * @param {Object} location
     * @description Checks the segment that was not found (so it's not in the verse) for special characters when we create the warning
     */
    function warnForNotFoundQuoteSegment(notFoundQuoteSegment, partDescription, occurrenceString, fullVerseText, location) {
        // if (partDescription) functionLog(`warnForNotFoundQuoteSegment(${notFoundQuoteSegment}, ${partDescription}, ${fullVerseText}, ${location}) ${C}:${V}…`);
        //parameterAssert(notFoundQuoteSegment !== undefined, "warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should be defined");
        //parameterAssert(typeof notFoundQuoteSegment === 'string', `warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should be a string not a '${typeof notFoundQuoteSegment}'`);
        //parameterAssert(notFoundQuoteSegment.indexOf(discontiguousDivider) === -1, `warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should not contain '${discontiguousDivider}' divider: '${notFoundQuoteSegment}'`);
        //parameterAssert(partDescription !== undefined, "warnForNotFoundQuoteSegment: 'partDescription' parameter should be defined");
        //parameterAssert(typeof partDescription === 'string', `warnForNotFoundQuoteSegment: 'partDescription' parameter should be a string not a '${typeof partDescription}'`);
        //parameterAssert(fullVerseText !== undefined, "warnForNotFoundQuoteSegment: 'fullVerseText' parameter should be defined");
        //parameterAssert(typeof fullVerseText === 'string', `warnForNotFoundQuoteSegment: 'fullVerseText' parameter should be a string not a '${typeof fullVerseText}'`);
        //parameterAssert(location !== undefined, "warnForNotFoundQuoteSegment: 'location' parameter should be defined");
        //parameterAssert(typeof location === 'string', `warnForNotFoundQuoteSegment: 'location' parameter should be a string not a '${typeof location}'`);

        let excerpt = partDescription ? `${partDescription ? '(' + partDescription + ' quote portion)' : ''} '${notFoundQuoteSegment}'` : '';

        const noBreakSpaceText = notFoundQuoteSegment.indexOf('\u00A0') >= 0 ? "quote which contains No-Break Space shown as '⍽'" : "";
        if (noBreakSpaceText) notFoundQuoteSegment = notFoundQuoteSegment.replace(/\u00A0/g, '⍽');
        // debugLog(`722 fieldText='${fieldText}'${extraText}`);
        // debugLog(`722 verseText='${verseText}'`);
        if (notFoundQuoteSegment[0] === ' ') {
            if (!excerpt) excerpt = notFoundQuoteSegment.substring(0, excerptLength) + (notFoundQuoteSegment.length > excerptLength ? '…' : '');
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment.endsWith(' ')) {
            if (!excerpt) excerpt = (notFoundQuoteSegment.length > excerptLength ? '…' : '') + notFoundQuoteSegment.substring(notFoundQuoteSegment.length - excerptLength, notFoundQuoteSegment.length);
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment[0] === '\u2060') { // Word joiner
            if (!excerpt) excerpt = notFoundQuoteSegment.substring(0, excerptLength) + (notFoundQuoteSegment.length > excerptLength ? '…' : '');
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment.endsWith('\u2060')) { // Word joiner
            if (!excerpt) excerpt = (notFoundQuoteSegment.length > excerptLength ? '…' : '') + notFoundQuoteSegment.substring(notFoundQuoteSegment.length - excerptLength, notFoundQuoteSegment.length);
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment[0] === '\u200B') { // Zero-width space
            if (!excerpt) excerpt = notFoundQuoteSegment.substring(0, excerptLength) + (notFoundQuoteSegment.length > excerptLength ? '…' : '');
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment.endsWith('\u200B')) { // Zero-width space
            if (!excerpt) excerpt = (notFoundQuoteSegment.length > excerptLength ? '…' : '') + notFoundQuoteSegment.substring(notFoundQuoteSegment.length - excerptLength, notFoundQuoteSegment.length);
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment[0] === '\u200D') { // Zero-width joiner
            if (!excerpt) excerpt = notFoundQuoteSegment.substring(0, excerptLength) + (notFoundQuoteSegment.length > excerptLength ? '…' : '');
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else if (notFoundQuoteSegment.endsWith('\u200D')) { // Zero-width joiner
            if (!excerpt) excerpt = (notFoundQuoteSegment.length > excerptLength ? '…' : '') + notFoundQuoteSegment.substring(notFoundQuoteSegment.length - excerptLength, notFoundQuoteSegment.length);
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
        } else {
            if (!excerpt) excerpt = notFoundQuoteSegment.length <= excerptLength ? notFoundQuoteSegment : (notFoundQuoteSegment.substring(0, excerptHalfLength) + (notFoundQuoteSegment.length > 2 * excerptHalfLength ? '…' : '') + notFoundQuoteSegment.substring(notFoundQuoteSegment.length - excerptHalfLength, notFoundQuoteSegment.length));
            addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: noBreakSpaceText ? noBreakSpaceText : `verse text ◗${fullVerseText}◖`, excerpt, location: ourLocation });
        }
    }
    // end of warnForNotFoundQuoteSegment function


    // Main code for checkOriginalLanguageQuoteAndOccurrence
    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (gcELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    let occurrence = 1;
    try { occurrence = ourParseInt(occurrenceString); }
    catch { dataAssert(false, `NOTE: We got occurrence=${occurrence} from ${C}:${V} '${occurrenceString}'`); } // errors in this field are noted elsewhere

    // if fieldText.lstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at start of ${TNid} '${fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at end of ${TNid} '${fieldText}'")
    // fieldText = fieldText.strip() # so we don’t get consequential errors

    let characterIndex;
    if ((characterIndex = fieldText.indexOf(wrongDiscontiguousDivider)) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNotice({ priority: 918, message: `Seems like the wrong divider for discontiguous quote segments`, details: `expected ◗${discontiguousDivider}◖`, characterIndex, excerpt, location: ourLocation });
    }

    if (discontiguousDivider === '…' && (characterIndex = fieldText.indexOf('...')) >= 0) {
        // debugLog(`Bad ellipse characters in '${fieldText}'`);
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNotice({ priority: 159, message: "Should use proper ellipse character (not periods)", characterIndex, excerpt, location: ourLocation });
    }

    let quoteBits;
    if (fieldText.indexOf(discontiguousDivider) >= 0) {
        quoteBits = fieldText.split(discontiguousDivider);
        if ((characterIndex = fieldText.indexOf(` ${discontiguousDivider}`)) >= 0 || (characterIndex = fieldText.indexOf(`${discontiguousDivider} `)) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 158, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        }
        // } else if (fieldText.indexOf('↔') >= 0) {
        //     quoteBits = fieldText.split('↔');
        //     if ((characterIndex = fieldText.indexOf(' ↔')) >= 0 || (characterIndex = fieldText.indexOf('↔ ')) >= 0) {
        //         // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
        //         const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        //         addNotice({ priority: 157, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        //     }
    } else if (discontiguousDivider === '…' && fieldText.indexOf('...') >= 0) { // Yes, we still actually allow this
        quoteBits = fieldText.split('...');
        if ((characterIndex = fieldText.indexOf(' ...')) >= 0 || (characterIndex = fieldText.indexOf('... ')) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse characters in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 156, message: "Unexpected space(s) beside ellipse characters", characterIndex, excerpt, location: ourLocation });
        }
    }
    // debugLog(`Got quoteBits=${quoteBits}`);

    // Find the verse text in the original language
    let verseText;
    try {
        verseText = checkingOptions?.originalLanguageVerseText;
    } catch (gcVTerror) { }
    if (!verseText) {// not supplied, so then we need to get it ourselves
        if (checkingOptions?.disableAllLinkFetchingFlag)
            return colqResult; // nothing else we can do here
        else {
            verseText = await getOriginalPassage(bookID, C, V, checkingOptions);
            if (!verseText) {
                addNotice({ priority: 851, message: bookID === 'OBS' ? "Unable to load OBS story text" : "Unable to load original language verse text", location: ourLocation });
                return colqResult; // nothing else we can do here
            }
        }
    }

    // Now check if the quote can be found in the verse text
    if (quoteBits) { // it had an ellipsis
        // //parameterAssert(occurrence === 1, `Oh -- can get '${fieldText}' with occurrence=${occurrence} in ${bookID} ${C}:${V}`);
        if (occurrence !== 1) {
            addNotice({ priority: 50, message: "Is this quote/occurrence correct???", details: `Occurrence=${occurrence}`, excerpt: fieldText, location: ourLocation });
        }
        // TODO: Are we checking the correct occurrence below ???
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            let quoteIndex = -1; // These parts have to be in order, i.e., found in the verse one AFTER the other
            for (let bitIndex = 0; bitIndex < numQuoteBits; bitIndex++) {
                // debugLog(`warnForNotFoundQuoteSegment: checking quote part ${bitIndex} '${quoteBits[bitIndex]}' from '${fieldText}' against '${verseText.substring(quoteIndex)}' from '${verseText}'`)
                let partDescription;
                if (numQuoteBits === 1) partDescription = '';
                else if (bitIndex === 0) partDescription = 'beginning';
                else if (bitIndex === numQuoteBits - 1) partDescription = 'end';
                else partDescription = `middle${numQuoteBits > 3 ? bitIndex : ''}`;
                if ((quoteIndex = verseText.indexOf(quoteBits[bitIndex], quoteIndex + 1)) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    const excerpt = `${partDescription ? '(' + partDescription + ' quote portion)' : ''} '${quoteBits[bitIndex]}'`;
                    if (verseText.indexOf(quoteBits[bitIndex]) >= 0) {
                        logicAssert(bitIndex > 0, "This shouldn't happen for bitIndex of zero!");
                        // debugLog(`914, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        addNotice({ priority: 914, message: "Unable to find original language quote portion in the right place in the verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    } else {
                        // debugLog(`915, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        warnForNotFoundQuoteSegment(fieldText, partDescription, occurrenceString, verseText, ourLocation);
                        // addNotice({ priority: 915, message: "Unable to find original language quote portion in verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    }
                } else { // We found this bit
                    // debugLog(`Found ${C}:${V} origQuote portion ${bitIndex} '${quoteBits[bitIndex]}' at ${quoteIndex} (num text chars = ${verseText.length})`);
                    const verseTextBits = verseText.split(quoteBits[bitIndex]); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                    checkFoundQuoteSegment(quoteBits[bitIndex], partDescription, occurrenceString, `${verseTextBits[occurrence - 1]}${quoteBits[bitIndex]}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            }
        } else // < 2
            addNotice({ priority: 815, message: "Divider without surrounding snippet", location: ourLocation });
    } else { // Only a single quote (no discontiguousDivider)
        if (verseText.indexOf(fieldText) >= 0) {
            if (occurrence > 1) {
                // functionLog(`checkOriginalLanguageQuoteAndOccurrence is checking for ${occurrence} occurrences of ${fieldText}`);
                const verseTextBits = verseText.split(fieldText); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                const actualNumOccurrences = verseTextBits.length - 1;
                if (occurrence > actualNumOccurrences) { // There's not enough of them
                    const actualOccurrencesText = actualNumOccurrences === 0 ? 'no' : `only ${actualNumOccurrences}`;
                    const excerpt = fieldText.substring(0, excerptHalfLength) + (fieldText.length > 2 * excerptHalfLength ? '…' : '') + fieldText.substring(fieldText.length - excerptHalfLength, fieldText.length);
                    addNotice({ priority: 917, message: "Unable to find duplicate original language quote in verse text", details: `occurrence=${occurrenceString} but ${actualOccurrencesText} occurrence${actualNumOccurrences === 1 ? '' : 's'} found, passage ◗${verseText}◖`, excerpt, location: ourLocation });
                } else {
                    checkFoundQuoteSegment(fieldText, '', occurrenceString, `${verseTextBits[occurrence - 1]}${fieldText}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            } else { // We only need to check for one occurrence
                // TODO: The error in the next line has been notified elsewhere, but should we try to handle it more intelligently here ???
                logicAssert(occurrence === 1 || occurrence === -1, `Expected ${C}:${V} occurrence to be 1 or -1 not ${occurrence} from '${occurrenceString}' for ${C}:${V} '${fieldText}'`);
                // Double check that it doesn’t start/stop in the middle of a word
                // debugLog(`Here with fieldText=${fieldText} and verseText=${verseText}`);
                // debugLog(`remainingBits=${JSON.stringify(remainingBits)}`);
                checkFoundQuoteSegment(fieldText, '', occurrenceString, verseText, verseText, ourLocation);
            }
        } else { // can’t find the given text
            // debugLog(`916, Unable to find '${fieldText}' in '${verseText}'`);
            warnForNotFoundQuoteSegment(fieldText, '', occurrenceString, verseText, ourLocation);
        }
    }

    // functionLog(`checkOriginalLanguageQuoteAndOccurrence is returning ${ JSON.stringify(colqResult) }`);
    return colqResult;
}
// end of checkOriginalLanguageQuoteAndOccurrence function
