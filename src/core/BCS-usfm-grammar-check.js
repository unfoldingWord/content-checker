import grammar from 'usfm-grammar';


export function runBCSGrammarCheck(strictnessString, fileText) {
    // Runs the BCS USFM Grammar checker
    //  which can be quite time-consuming on large, complex USFM files
    // console.log("Running BCS USFM grammar check (can take quite a while for a large book)…");
    console.assert(strictnessString === 'strict' || strictnessString === 'relaxed');

    const ourUsfmParser = new grammar.USFMParser(fileText,
        strictnessString === 'relaxed' ? grammar.LEVEL.RELAXED : null);
    // Returns a Boolean indicating whether the input USFM text satisfies the grammar or not.
    // This method is available in both default and relaxed modes.
    const isValidUSFM = ourUsfmParser.validate();
    // console.log(`  Finished BCS USFM grammar check with ${isValidUSFM} and ${ourUsfmParser.warnings.length} warnings.`);
    // NOTE: We don't know how to get the errors out yet

    // Clean up their warnings a little
    //  Remove trailing spaces and periods
    // console.log("  Warnings:", JSON.stringify(ourUsfmParser.warnings));
    let ourWarnings = [];
    for (let warningString of ourUsfmParser.warnings) {
        // console.log(`warningString: '${warningString}'`);
        let adjustedString = warningString.trim(); // Removes the trailing space
        if (adjustedString.endsWith('.')) adjustedString = adjustedString.substring(0, adjustedString.length-1);
        ourWarnings.push(adjustedString);
    }

    return { isValidUSFM: isValidUSFM, warnings: ourWarnings };
}
// end of runBCSGrammarCheck function


export function checkUSFMGrammar(strictnessString, filename, givenText, givenLocation, optionalCheckingOptions) {
    /*
    This function is only used for the demonstration pages -- not for the core!

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkUSFMGrammar(" + givenText.length.toLocaleString() + " chars, '" + location + "')…");
    console.assert(strictnessString === 'strict' || strictnessString === 'relaxed');

    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (filename) ourLocation = ` in ${filename}${ourLocation}`;


    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkUSFMGrammar success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        // console.log("checkUSFMGrammar notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "cUSFMgr addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cUSFMgr addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "cUSFMgr addNotice: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cUSFMgr addNotice: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "cUSFMgr addNotice: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cUSFMgr addNotice: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "cUSFMgr addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cUSFMgr addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "cUSFMgr addNotice: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cUSFMgr addNotice: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    const grammarCheckResult = runBCSGrammarCheck(strictnessString, givenText, ourLocation);
    // NOTE: We haven't figured out how to get ERRORS out of this parser yet

    if (!grammarCheckResult.isValidUSFM)
        addNotice(944, `USFM3 Grammar Check (${strictnessString} mode) doesn't pass`, -1, "", ourLocation);

    // Display these warnings but with a lowish priority
    for (let warningString of grammarCheckResult.warnings)
        addNotice(100, "USFMGrammar found: " + warningString, -1, "", ourLocation);

    addSuccessMessage(`Checked USFM Grammar (${strictnessString} mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN'T validate)"}`);
    console.log(`  checkUSFMGrammar returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMGrammar result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMGrammar function


export default checkUSFMGrammar;