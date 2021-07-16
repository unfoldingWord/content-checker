import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderCheckedFilesList, RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesNoticesGradient, RenderTotals } from '../RenderProcessedResults';
import { clearCaches, clearCheckedArticleCache, preloadReposIfNecessary, ourParseInt } from '../../core';
import { checkRepo } from './checkRepo';
// eslint-disable-next-line no-unused-vars
import { logicAssert, userLog, debugLog } from '../../core/utilities';


// const REPO_VALIDATOR_VERSION_STRING = '0.2.5';


function RepoCheck(/*username, languageCode,*/ props) {
    /*
    Check an entire repository

    Loads the zip file and the repo tree
        and then checks all the individual files
    */

    // debugLog(`I'm here in RepoCheck v${REPO_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    const username = props.username;
    // debugLog(`username='${username}'`);
    const repoName = props.repoName;
    // debugLog(`repoName='${repoName}'`);
    let branchOrRelease = props.branchOrRelease;
    // debugLog(`branch='${branch}'`);
    if (branchOrRelease === undefined) branchOrRelease = 'master';

    const checkingOptions = { // Uncomment any of these to test them
        // excerptLength: 25,
        suppressNoticeDisablingFlag: true, // Leave this one as true (otherwise demo checks are less efficient)
    };
    // NOTE: I removed this again as it didn’t really seem to make sense to enable it here
    //          Also, I don’t think the results were getting returned correctly yet
    // if (repoName && repoName.endsWith('_tn')) {
    //     // TODO: Should the user be able to turn this off and on ????
    //     checkingOptions.disableLinkedTAArticlesCheckFlag = false;
    //     checkingOptions.disableLinkedTWArticlesCheckFlag = false;
    // }
    // Or this allows the parameters to be specified as a RepoCheck property
    if (props.excerptLength) checkingOptions.excerptLength = ourParseInt(props.excerptLength);
    if (props.cutoffPriorityLevel) checkingOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);


    const [result, setResultValue] = useState("Waiting-checkRepo");
    useEffect(() => {
        // debugLog("RepoCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // debugLog("Started RepoCheck.unnamedFunction()");

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

            if (props.reloadAllFilesFirst && props.reloadAllFilesFirst.slice(0).toUpperCase() === 'Y') {
                userLog("Clearing cache before running respository check…");
                setResultValue(<p style={{ color: 'orange' }}>Clearing cache before running repository check…</p>);
                await clearCaches();
            }
            else await clearCheckedArticleCache(); // otherwise we wouldn't see any of the warnings again from checking these

            let [languageCode, repoCode] = repoName.split('_');
            repoCode = repoCode.toUpperCase();
            if (repoCode === 'TN2') repoCode = 'TN';
            else if (repoCode === 'TQ2') repoCode = 'TQ';
            // debugLog(`RepoCheck languageCode='${languageCode}' repoCode='${repoCode}'`);

            // Load whole repos, especially if we are going to check files in manifests
            // NOTE: We make TWO calls to preloadReposIfNecessary()
            //          because the branchOrRelease only applies to the repo being checked
            //          for all other repos, we just use `master`
            const repoPreloadList = repoCode === 'TW' ? [] : ['TW'];
            if (repoCode !== 'UHB' && repoCode !== 'UGNT' && repoCode !== 'TA')
                repoPreloadList.push('TA'); // Original languages only have TW links
            // if (repoCode !== 'TA' && repoCode !== 'TW') repoPreloadList.push(repoCode);
            if (repoCode.startsWith('OBS-') || repoCode === 'TWL') { repoPreloadList.unshift('UGNT'); repoPreloadList.unshift('UHB'); repoPreloadList.push('OBS'); }
            setResultValue(<p style={{ color: 'magenta' }}>Preloading {repoCode} and {repoPreloadList.length} repos for <i>{username}</i> {languageCode} ready for {repoName} repo check…</p>);
            logicAssert(repoPreloadList.indexOf(repoCode) === -1);
            const successFlag = await preloadReposIfNecessary(username, languageCode, [], branchOrRelease, [repoCode])
                && preloadReposIfNecessary(username, languageCode, [], 'master', repoPreloadList);
            if (!successFlag)
                console.error(`RepoCheck error: Failed to pre-load all repos`)

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking <b>{repoName}</b> repo…</p>);

            // Put all this in a try/catch block coz otherwise it’s difficult to debug/view errors
            try {
                let rawCRResults = {};
                try {
                    // Empty string below is for location
                    rawCRResults = await checkRepo(username, repoName, branchOrRelease, "", setResultValue, checkingOptions);
                    // debugLog(`rawCRResults keys: ${Object.keys(rawCRResults)}`);
                    // debugLog(`rawCRResults: ${JSON.stringify(rawCRResults)}`);
                    // logicAssert('checkedFileCount' in rawCRResults, `Expected rawCBPsResults to contain 'checkedFileCount': ${Object.keys(rawCRResults)}`);
                } catch (checkRepoError) {
                    rawCRResults = { successList: [], noticeList: [] };
                    rawCRResults.noticeList.push({ priority: 999, message: "checkRepo function FAILED", repoName, excerpt: checkRepoError, location: repoName });
                    // debugLog("RepoCheck trace is", checkRepoError.trace);
                }
                // debugLog("checkRepo() returned", typeof rawCRResults); //, JSON.stringify(rawCRResults));

                // Add some extra fields to our rawCRResults object in case we need this information again later
                rawCRResults.checkType = 'Repo';
                rawCRResults.username = username;
                rawCRResults.languageCode = languageCode;
                rawCRResults.checkedOptions = checkingOptions;

                // debugLog("Here with RC rawCRResults", typeof rawCRResults);
                // Now do our final handling of the result -- we have some options available
                let processOptions = { // Uncomment any of these to test them
                    // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don’t suppress
                    // 'errorPriorityLevel': 800, // default is 700
                    // 'cutoffPriorityLevel': 100, // default is 0
                    // 'sortBy': 'ByRepo', // default is 'ByPriority', also have 'AsFound'
                    // 'ignorePriorityNumberList': [123, 202], // default is []
                };
                // Or this allows the parameters to be specified as a RepoCheck property
                if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
                if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
                // if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
                if (props.sortBy) processOptions.sortBy = props.sortBy;
                // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
                if (props.showDisabledNoticesFlag) processOptions.showDisabledNoticesFlag = props.showDisabledNoticesFlag.toLowerCase() === 'true';

                let displayType = 'ErrorsWarnings'; // default
                if (props.displayType) displayType = props.displayType;

                function renderSummary(processedResults) {
                    const repoLink = branchOrRelease === undefined ? `https://git.door43.org/${username}/${repoName}/` : `https://git.door43.org/${username}/${repoName}/src/branch/${branchOrRelease}/`;
                    return (<div>
                        <p>Checked <b>{username} {repoName}</b> (from <i>{branchOrRelease === undefined ? 'DEFAULT' : branchOrRelease}</i> <a rel="noopener noreferrer" target="_blank" href={repoLink}>branch</a>)</p>
                        <RenderCheckedFilesList username={username} results={processedResults} />
                        <RenderTotals rawNoticeListLength={rawCRResults.noticeList.length} results={processedResults} />
                        {/* <RenderRawResults results={rawCRResults} /> */}
                    </div>);
                }

                if (displayType === 'ErrorsWarnings') {
                    const processedResults = processNoticesToErrorsWarnings(rawCRResults, processOptions);
                    // displayPropertyNames("RC processedResults", processedResults);
                    //             userLog(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, "numHiddenErrors=" + processedResults.numHiddenErrors.toLocaleString(), "numHiddenWarnings=" + processedResults.numHiddenWarnings.toLocaleString());

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
                    const processedResults = processNoticesToSevereMediumLow(rawCRResults, processOptions);
                    //             userLog(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, "numHiddenErrors=" + processedResults.numHiddenErrors.toLocaleString(), "numHiddenWarnings=" + processedResults.numHiddenWarnings.toLocaleString());

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
                    const processedResults = processNoticesToSingleList(rawCRResults, processOptions);
                    // debugLog(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

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

                // debugLog("Finished rendering bit.");
            } catch (rcError) {
                console.error(`RepoCheck main code block got error: ${rcError.message}`);
                setResultValue(<>
                    <p style={{ color: 'red' }}>RepoCheck main code block got error: <b>{rcError.message}</b></p>
                </>);
            }
        })(); // end of async part in unnamedFunction
        // Doesn’t work if we add this to next line: languageCode,username,repoName,branch,checkingOptions,props
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// RepoCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
    root: {
    },
});

export default withStyles(styles)(RepoCheck);
