// import { isWhitespace, countOccurrences } from './text-handling-functions'
import yaml from 'yaml';
import doBasicTextChecks from './basic-text-check';


const YAML_VALIDATOR_VERSION = '0.0.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkYAMLText(textName, YAMLText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList,
        as well as the parsed YAML for further checking.

     */
    // console.log(`checkYAMLText(${textName}, ${YAMLText.length}, ${givenLocation})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) {}
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    const cytResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkYAMLText success: " + successString);
        cytResult.successList.push(successString);
    }
    function addNotice5(priority, message, index, extract, location) {
        // console.log("checkYAMLText Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "cYt addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "cManT addNotice5: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "cYt addNotice5: 'message' parameter should be defined");
        console.assert(typeof message==='string', "cManT addNotice5: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(index!==undefined, "cYt addNotice5: 'index' parameter should be defined");
        console.assert(typeof index==='number', "cManT addNotice5: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "cYt addNotice5: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "cManT addNotice5: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "cYt addNotice5: 'location' parameter should be defined");
        console.assert(typeof location==='string', "cYt addNotice5: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        cytResult.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cYt doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName!==undefined, "cYt doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName==='string', "cYt doOurBasicTextChecks: 'fieldName' parameter should be a string not a '"+(typeof fieldName)+"'");
        console.assert(fieldText!==undefined, "cYt doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText==='string', "cYt doOurBasicTextChecks: 'fieldText' parameter should be a string not a '"+(typeof fieldText)+"'");
        console.assert( allowedLinks===true || allowedLinks===false, "cYt doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Process results line by line
        //  suppressing undesired errors
        for (const noticeEntry of resultObject.noticeList) {
            console.assert(noticeEntry.length === 5, `YAML doOurBasicTextChecks notice length=${noticeEntry.length}`);
            if (noticeEntry[0] !== 591
              && noticeEntry[1] !== "Unexpected ' character after space"
              && noticeEntry[1] !== "Unexpected space after ' character"
              && noticeEntry[1] !== "Unexpected space after [ character"
              && (noticeEntry[1] !== "Unexpected doubled - characters" || fieldText === '---')
              )
                addNotice5(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);
    }
}
    // end of doOurBasicTextChecks function

    function checkYAMLLineContents(lineName, lineText, lineLocation) {

        // console.log(`checkYAMLLineContents for '${lineName} ${lineText}' at${lineLocation}`);
        let thisText = lineText

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g,'')
        // console.log(`After removing leading spaces have '${thisText}'`);

        // Remove leading hyphens
        thisText = thisText.replace(/^\-/g,'')
        // console.log(`After removing hyphens have '${thisText}'`);

        // Remove leading spaces again now
        thisText = thisText.replace(/^ +/g,'')
        // console.log(`After removing more leading spaces have '${thisText}'`);

        const allowedLinksInLine = thisText.startsWith('url:') || thisText.startsWith('chapter_url:');
        if (thisText)
            doOurBasicTextChecks(lineName, thisText, allowedLinksInLine, lineLocation, optionalCheckingOptions);
    }
    // end of checkYAMLLine function


    // Main code for checkYAMLText function
    const lines = YAMLText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);
    let formData;
    try {
        formData = yaml.parse(YAMLText);
        // console.log("yaml.parse(YAMLText) got formData", JSON.stringify(formData));
    }
    catch(e) {
        console.log("ERROR: yaml parse error:", e.message);
        addNotice5(916, e.message, -1, "", ourLocation)
    }
    // Add the parsed YAML to our result
    cytResult.formData = formData;

    let lastNumLeadingSpaces = 0;
    let lastLineContents;
    for (let n= 1; n <= lines.length; n++) {
        const atString = " in line "+n.toLocaleString()+ourLocation;

        const line = lines[n - 1];
        // let numLeadingSpaces;
        // if (line) {
        //     numLeadingSpaces = line.match(/^ */)[0].length;
        //     // console.log("Got numLeadingSpaces="+ numLeadingSpaces + " for "+line+atString);
        //     if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces!=lastNumLeadingSpaces)
        //         addNotice5(472, "Nesting seems confused", 0, '', atString);

            checkYAMLLineContents("line "+n.toLocaleString(), line, ourLocation);
        // } else {
        //     // This is a blank line
        //     numLeadingSpaces = 0;
        // }

        // lastLineContents = line;
        // lastNumLeadingSpaces = numLeadingSpaces;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}${ourLocation}.`);
    if (cytResult.noticeList)
        addSuccessMessage(`checkYAMLText v${YAML_VALIDATOR_VERSION} finished with ${cytResult.noticeList.length?cytResult.noticeList.length.toLocaleString():"zero"} notice${cytResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkYAMLText v${YAML_VALIDATOR_VERSION}`)
    // console.log(`  checkYAMLText returning with ${cytResult.successList.length.toLocaleString()} success(es), ${cytResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkYAMLText result is", JSON.stringify(result));
    return cytResult;
}
// end of checkYAMLText function


export default checkYAMLText;
