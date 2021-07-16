import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { clearCaches, clearCheckedArticleCache, ourParseInt, cachedGetFile, cachedFetchFileFromServerWithTag } from '../../core';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesNoticesGradient, RenderElapsedTime } from '../RenderProcessedResults';
import { checkFileContents } from './checkFileContents';
// eslint-disable-next-line no-unused-vars
import { debugLog, userLog } from '../../core/utilities';


// const FILE_CHECK_VERSION_STRING = '0.3.2';


function FileCheck(props) {
  // debugLog(`I'm here in FileCheck v${FILE_CHECK_VERSION_STRING}`);
  // consoleLogObject("props", props);

  const [result, setResultValue] = useState("Waiting-FileCheck");
  useEffect(() => {
    // debugLog("FileCheck.useEffect() called with ", JSON.stringify(props));

    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // debugLog("Started FileCheck.unnamedFunction()");

      // NOTE from RJH: I can’t find the correct React place for this / way to do this
      //                  so it shows a warning for the user, and doesn’t continue to try to process
      if (!props.wait || props.wait !== 'N') {
        setResultValue(<p><span style={{ color: 'blue' }}>Waiting for user…</span> (Adjust settings below as necessary and then set <b>wait='N'</b> to start)</p>);
        return;
      }

      if (!username) {
        setResultValue(<p style={{ color: 'red' }}>No <b>username</b> set!</p>);
        return;
      }
      if (!repoName) {
        setResultValue(<p style={{ color: 'red' }}>No <b>repoName</b> set!</p>);
        return;
      }
      if (!filename) {
        setResultValue(<p style={{ color: 'red' }}>No <b>filename</b> set!</p>);
        return;
      }

      if (props.reloadAllFilesFirst && props.reloadAllFilesFirst.slice(0).toUpperCase() === 'Y') {
        userLog("Clearing cache before running file check…");
        setResultValue(<p style={{ color: 'orange' }}>Clearing cache before running file check…</p>);
        await clearCaches();
      }
      else await clearCheckedArticleCache(); // otherwise we wouldn't see any of the warnings again from checking these

      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Fetching <i>{username}</i> {repoName} <b>{filename}</b>…</p>);

      // Fetch the file that we need to check (but it might already be in the cache)
      // debugLog(`FileCheck about to call cachedGetFile(${username}, ${repoName}, ${filename}, ${branch})…`);
      let fileContent = await cachedGetFile({ username: username, repository: repoName, path: filename, branch: branchOrRelease });
      if (!fileContent) { // could it be a release, not a branch???
        userLog(`Unable to fetch ${filename} from branch ${branchOrRelease}, so trying a release instead…`)
        fileContent = await cachedFetchFileFromServerWithTag({ username: username, repository: repoName, path: filename, tag: branchOrRelease });
      }

      setResultValue(<p style={{ color: 'magenta' }}>Checking <i>{username}</i> {repoName} <b>{filename}</b>…</p>);
      let rawCFResults = { noticeList: [{ priority: 990, message: "Unable to load file", details: `username=${username}`, repoName, filename }], elapsedSeconds: 0 };
      if (fileContent) {
        const languageCode = repoName.split('_')[0];

        let repoCodeGuess = '';
        if (repoName === 'hbo_uhb') repoCodeGuess = 'UHB'
        else if (repoName === 'el-x-koine_ugnt') repoCodeGuess = 'UGNT'
        else if (repoName.endsWith('_twl')) repoCodeGuess = 'TWL'
        else if (repoName.endsWith('_tn')) repoCodeGuess = 'TN'
        else if (repoName.endsWith('_ta')) repoCodeGuess = 'TA'
        else if (repoName.endsWith('_tq')) repoCodeGuess = 'TQ'
        else if (repoName.endsWith('_tw')) repoCodeGuess = 'TW'
        else if (repoName.endsWith('_sn')) repoCodeGuess = 'SN'
        else if (repoName.endsWith('_sq')) repoCodeGuess = 'SQ'
        else if (repoName.endsWith('lt')) repoCodeGuess = 'LT'
        else if (repoName.endsWith('st')) repoCodeGuess = 'ST'

        rawCFResults = await checkFileContents(username, languageCode, repoCodeGuess, branchOrRelease, filename, fileContent, givenLocation, checkingOptions);
        // debugLog(`rawCFResults=${JSON.stringify(rawCFResults)}`);

        // Because we know here that we're only checking one file, we don’t need the filename field in the notices
        // WRONG: We want the filename so that the lineNumber can be made into a live link
        function addFields(notice) {
          notice.username = username; notice.repoName = repoName; notice.repoCode = repoCodeGuess;
          if (!notice.extra) notice.extra = repoCodeGuess;
          return notice;
        }
        rawCFResults.noticeList = rawCFResults.noticeList.map(addFields);
      }
      // debugLog(`FileCheck got initial results with ${rawCFResults.successList.length} success message(s) and ${rawCFResults.noticeList.length} notice(s)`);

      // // Since we know the repoName here, add it to our notices
      // for (const thisNotice of rawCFResults.noticeList)
      //   thisNotice.repoName = repoName; // Add in this info that we know

      // Add some extra fields to our rawCFResults object in case we need this information again later
      rawCFResults.checkType = 'File';
      rawCFResults.username = username;
      rawCFResults.repoName = repoName;
      rawCFResults.branch = props.branch;
      rawCFResults.filename = filename;
      rawCFResults.checkingOptions = checkingOptions;

      // Now do our final handling of the result
      let processOptions = { // Uncomment any of these to test them
        // 'maximumSimilarMessages': 4, // default is 3  -- 0 means don’t suppress
        // 'errorPriorityLevel': 800, // default is 700
        // 'cutoffPriorityLevel': 100, // default is 0
        // 'sortBy': 'ByRepo', // default is 'ByPriority', also have 'AsFound'
        // 'ignorePriorityNumberList': [123, 202], // default is []
      };
      // Or this allows the parameters to be specified as a FileCheck property
      if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
      if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
      // if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
      if (props.sortBy) processOptions.sortBy = props.sortBy;
      // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;

      let displayType = 'ErrorsWarnings'; // default
      if (props.displayType) displayType = props.displayType;

      function renderSummary(processedResults) {
        let cutoffString = '';
        // NOTE: Couldn't figure out why ?. was not allowed in the statement below
        if (rawCFResults && rawCFResults.checkedOptions && rawCFResults.checkedOptions.cutoffPriorityLevel)
          cutoffString = ` Priority level ${rawCFResults.checkedOptions.cutoffPriorityLevel} or lower were not included.`;
        return (<div>
          <p>Checked <b>{filename}</b> (from <i>{username}</i> {repoName} <i>{branchOrRelease === undefined ? 'DEFAULT' : branchOrRelease}</i> branch)</p>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCFResults.noticeList.length === 0 ? 'no' : rawCFResults.noticeList.length.toLocaleString()} notice{rawCFResults.noticeList.length === 1 ? '' : 's'}
            {processedResults.numIgnoredNotices || processedResults.numDisabledNotices ? ' (but ' : ''}
            {processedResults.numIgnoredNotices ? `${processedResults.numIgnoredNotices.toLocaleString()} ignored notice(s)` : ""}
            {processedResults.numIgnoredNotices && processedResults.numDisabledNotices ? ' and ' : ''}
            {processedResults.numDisabledNotices ? `${processedResults.numDisabledNotices.toLocaleString()} expected/disabled notice${processedResults.numDisabledNotices === 1 ? '' : 's'}` : ""}
            {processedResults.numIgnoredNotices || processedResults.numDisabledNotices ? ')' : ''}.{cutoffString}</p>
          {/* <RenderRawResults results={rawCFResults} /> */}
        </div>);
      }

      if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCFResults, processOptions);
        //                 userLog(`${`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)`}
        //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenErrors=${processedResults.numHiddenErrors.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

        if (processedResults.errorList.length || processedResults.warningList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
        else // no errors or warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
      } else if (displayType === 'SevereMediumLow') {
        const processedResults = processNoticesToSevereMediumLow(rawCFResults, processOptions);
        //                 userLog(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
        //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenErrors=${processedResults.numHiddenErrors.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

        if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
        else // no severe, medium, or low notices
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
      } else if (displayType === 'SingleList') {
        const processedResults = processNoticesToSingleList(rawCFResults, processOptions);
        //       userLog(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
        // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesNoticesGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesNoticesGradient results={processedResults} />
          </>);
      } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)
    })(); // end of async part in unnamedFunction
    // Doesn’t work if we add this to next line: username,repoName,branch,checkingOptions,filename,givenLocation,props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // end of useEffect part

  const username = props.username;
  // debugLog(`FileCheck username='${username}'`);
  if (!username) return <><b>ERROR</b>: The Door43 <b>username</b> must be specified</>;
  const repoName = props.repoName;
  // debugLog(`FileCheck repoName='${repoName}'`);
  if (!repoName) return <><b>ERROR</b>: The Door43 <b>repository name</b> must be specified</>;
  let branchOrRelease = props.branchOrRelease;
  // debugLog(`FileCheck branchOrRelease='${branchOrRelease}'`);
  if (branchOrRelease === undefined) branchOrRelease = 'master';
  const filename = props.filename;
  // debugLog(`filename='${filename}'`);
  if (!filename) return <><b>ERROR</b>: The Door43 <b>filename</b> must be specified</>;

  let givenLocation = props['location'] ? props['location'] : "";
  if (givenLocation && givenLocation[0] !== ' ') givenLocation = ` ${givenLocation}`;

  const checkingOptions = { // Uncomment any of these to test them
    // excerptLength: 25,
    suppressNoticeDisablingFlag: true, // Leave this one as true (otherwise demo checks are less efficient)
  };
  // Or this allows the parameters to be specified as a FileCheck property
  if (props.excerptLength) checkingOptions.excerptLength = ourParseInt(props.excerptLength);
  if (props.cutoffPriorityLevel) checkingOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
  if (props.disableAllLinkFetchingFlag) checkingOptions.disableAllLinkFetchingFlag = props.disableAllLinkFetchingFlag.toLowerCase() === 'true';
  if (props.disableLinkedTAArticlesCheckFlag) checkingOptions.disableLinkedTAArticlesCheckFlag = props.disableLinkedTAArticlesCheckFlag.toLowerCase() === 'true';
  if (props.disableLinkedTWArticlesCheckFlag) checkingOptions.disableLinkedTWArticlesCheckFlag = props.disableLinkedTWArticlesCheckFlag.toLowerCase() === 'true';

  // {/* <div className={classes.root}> */}
  return (
    <div className="Fred">
      {result}
    </div>
  );
};
// end of FileCheck()

const styles = theme => ({
  root: {
  },
});

export default withStyles(styles)(FileCheck);
