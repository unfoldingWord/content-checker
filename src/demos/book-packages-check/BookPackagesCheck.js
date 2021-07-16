import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { clearCaches, clearCheckedArticleCache, ourParseInt, preloadReposIfNecessary } from '../../core';
import { checkBookPackages } from './checkBookPackages';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderCheckedFilesList, RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesNoticesGradient, RenderTotals } from '../RenderProcessedResults';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, logicAssert } from '../../core/utilities';


// const BPS_VALIDATOR_VERSION_STRING = '0.2.7';


/**
 *
 * @param {Object} props
 */
function BookPackagesCheck(/*username, languageCode, bookIDs,*/ props) {
  // Check a single Bible book across many repositories
  const [result, setResultValue] = useState("Waiting-CheckBookPackages");

  // debugLog(`I'm here in BookPackagesCheck v${BPS_VALIDATOR_VERSION_STRING}`);
  // consoleLogObject("props", props);
  // consoleLogObject("props.classes", props.classes);

  let username = props.username;
  // debugLog(`username='${username}'`);
  let languageCode = props.languageCode;
  // debugLog(`languageCode='${languageCode}'`);
  let bookIDs = props.bookIDs;
  // debugLog(`bookIDs='${bookIDs}'`);
  let dataSet = props.dataSet;
  // debugLog(`dataSet='${dataSet}'`);
  let branch = props.branch;
  // debugLog(`branch='${branch}'`);

  const bookIDList = [];
  let bookIDInvalid;
  let haveOT = false, haveNT = false;
  for (let bookID of bookIDs.split(',')) {
    bookID = bookID.trim();
    if (!books.isValidBookID(bookID) && bookID !== 'OBS') {
      bookIDInvalid = bookID;
    }
    bookIDList.push(bookID);
    if (books.isValidBookID(bookID)) {
      const whichTestament = books.testament(bookID);
      logicAssert(whichTestament === 'old' || whichTestament === 'new', `BookPackagesCheck() couldn't find testament for '${bookID}'`);
      if (whichTestament === 'old') haveOT = true;
      if (whichTestament === 'new') haveNT = true;
    }
  }
  // debugLog(`bookIDList (${bookIDList.length}) = ${bookIDList.join(', ')}`);

  const checkingOptions = { // Uncomment any of these to test them
    dataSet: dataSet, // Can be 'OLD' (Markdown, etc.), 'NEW' (TSV only), or 'BOTH', or 'DEFAULT'
    // excerptLength: 25,
    suppressNoticeDisablingFlag: true, // Leave this one as true (otherwise demo checks are less efficient)
  };
  // Or this allows the parameters to be specified as a BookPackagesCheck property
  if (props.excerptLength) checkingOptions.excerptLength = ourParseInt(props.excerptLength);
  if (props.cutoffPriorityLevel) checkingOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
  if (props.disableAllLinkFetchingFlag) checkingOptions.disableAllLinkFetchingFlag = props.disableAllLinkFetchingFlag.toLowerCase() === 'true';
  if (props.disableLinkedTAArticlesCheckFlag) checkingOptions.disableLinkedTAArticlesCheckFlag = props.disableLinkedTAArticlesCheckFlag.toLowerCase() === 'true';
  if (props.disableLinkedTWArticlesCheckFlag) checkingOptions.disableLinkedTWArticlesCheckFlag = props.disableLinkedTWArticlesCheckFlag.toLowerCase() === 'true';
  // functionLog(`checkingOptions.disableLinkedTAArticlesCheckFlag ${checkingOptions.disableLinkedTAArticlesCheckFlag} from '${props.disableLinkedTAArticlesCheckFlag}'`);
  // functionLog(`checkingOptions.disableLinkedTWArticlesCheckFlag ${checkingOptions.disableLinkedTWArticlesCheckFlag} from '${props.disableLinkedTWArticlesCheckFlag}'`);

  useEffect(() => {
    // debugLog("BookPackagesCheck.useEffect() called with ", JSON.stringify(props));

    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // debugLog("Started BookPackagesCheck.unnamedFunction()");

      // NOTE from RJH: I can’t find the correct React place for this / way to do this
      //                  so it shows a warning for the user, and doesn’t continue to try to process
      if (!props.wait || props.wait !== 'N') {
        setResultValue(<p><span style={{ color: 'blue' }}>Waiting for user…</span> (Adjust settings below as necessary and then set <b>wait='N'</b> to start)</p>);
        return;
      }

      if (props.reloadAllFilesFirst && props.reloadAllFilesFirst.slice(0).toUpperCase() === 'Y') {
        userLog("Clearing cache before running book packages check…");
        setResultValue(<p style={{ color: 'orange' }}>Clearing cache before running book packages check…</p>);
        await clearCaches();
      }
      else await clearCheckedArticleCache(); // otherwise we wouldn't see any of the warnings again from checking these

      // Load whole repos, especially if we are going to check files in manifests
      let repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TQ', 'SN', 'SQ']; // for DEFAULT
      if (dataSet === 'OLD')
        repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TQ'];
      else if (dataSet === 'NEW')
        repoPreloadList = ['TWL', 'LT', 'ST', 'TN2', 'TQ2', 'SN', 'SQ'];
      else if (dataSet === 'BOTH')
        repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TN2', 'TQ', 'TQ2', 'SN', 'SQ'];
      if (haveNT) repoPreloadList.unshift('UGNT');
      if (haveOT) repoPreloadList.unshift('UHB');
      if (!checkingOptions.disableAllLinkFetchingFlag) {
        repoPreloadList.push('TW');
        repoPreloadList.push('TA');
      }
      if (bookIDList.includes('OBS')) {
        let obsRepoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN2', 'OBS-SQ2']; // for DEFAULT
        if (dataSet === 'OLD')
          obsRepoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
        else if (dataSet === 'NEW')
          obsRepoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN2', 'OBS-SQ2'];
        else if (dataSet === 'BOTH')
          obsRepoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TN2', 'OBS-TQ', 'OBS-TQ2', 'OBS-SN', 'OBS-SN', 'OBS-SN2', 'OBS-SQ2'];
        repoPreloadList.push.apply(repoPreloadList, obsRepoPreloadList);
      }
      // debugLog(`BookPackagesCheck got repoPreloadList=${repoPreloadList} for dataSet=${dataSet}`)

      setResultValue(<p style={{ color: 'magenta' }}>Preloading {repoPreloadList.length} repos for <i>{username}</i> {languageCode} ready for book packages check…</p>);
      const successFlag = await preloadReposIfNecessary(username, languageCode, bookIDList, branch, repoPreloadList);
      if (!successFlag)
        console.error(`BookPackagesCheck error: Failed to pre-load all repos`)

      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Checking <i>{username}</i> {languageCode} <b>{bookIDList.join(', ')}</b> book packages…</p>);

      const rawCBPsResults = await checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions);

      // Add some extra fields to our rawCBPsResults object in case we need this information again later
      rawCBPsResults.checkType = 'BookPackages';
      rawCBPsResults.username = username;
      rawCBPsResults.languageCode = languageCode;
      rawCBPsResults.bookIDs = bookIDs;
      rawCBPsResults.bookIDList = bookIDList;
      rawCBPsResults.checkedOptions = checkingOptions;

      // debugLog("Here with CBPs rawCBPsResults", typeof rawCBPsResults);
      // Now do our final handling of the result -- we have some options available
      let processOptions = { // Uncomment any of these to test them
        // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don’t suppress
        // 'errorPriorityLevel': 800, // default is 700
        // 'cutoffPriorityLevel': 100, // default is 0
        // 'sortBy': 'ByRepo', // default is 'ByPriority', also have 'AsFound'
        // 'ignorePriorityNumberList': [123, 202], // default is []
      };
      // Or this allows the parameters to be specified as a BookPackagesCheck property
      if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
      if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
      // if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
      if (props.sortBy) processOptions.sortBy = props.sortBy;
      // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
      if (props.showDisabledNoticesFlag) processOptions.showDisabledNoticesFlag = props.showDisabledNoticesFlag.toLowerCase() === 'true';

      let displayType = 'ErrorsWarnings'; // default
      if (props.displayType) displayType = props.displayType;

      function renderSummary(processedResults) {
        return (<div>
          <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
          <RenderCheckedFilesList username={username} results={processedResults} />
          <RenderTotals rawNoticeListLength={rawCBPsResults.noticeList.length} results={processedResults} />
          {/* <RenderRawResults results={rawCBPsResults} /> */}
        </div>);
      }

      if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCBPsResults, processOptions);
        //       userLog(`BookPackagesCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
        // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenErrors=${processedResults.numHiddenErrors.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

        // debugLog("Here now in rendering bit!");

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
        const processedResults = processNoticesToSevereMediumLow(rawCBPsResults, processOptions);
        //                 userLog(`BookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
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
        const processedResults = processNoticesToSingleList(rawCBPsResults, processOptions);
        //       userLog(`BookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
        // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            <div>{renderSummary(processedResults)}
              {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
            <RenderSuccessesNoticesGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesNoticesGradient results={processedResults} />
          </>);
      } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)

      // debugLog("Finished rendering bit.");
    })(); // end of async part in unnamedFunction
    // Doesn’t work if we add this to next line: bookIDList,bookIDs,username,branch,checkingOptions,languageCode,props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bookIDList), bookIDs, branch, JSON.stringify(checkingOptions), languageCode, JSON.stringify(props), username]); // end of useEffect part

  if (bookIDInvalid) {
    return (<p>Please enter only valid USFM book identifiers separated by commas. ('{bookIDInvalid}' is not valid.)</p>);
  }

  // {/* <div className={classes.root}> */}
  return (
    <div className="Fred">
      {result}
    </div>
  );
}

// BookPackagesCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   bookIDs: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

// const styles = theme => ({
//   root: {
//   },
// });

export default BookPackagesCheck;
