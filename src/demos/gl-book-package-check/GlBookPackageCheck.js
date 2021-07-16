import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { clearCaches, clearCheckedArticleCache, preloadReposIfNecessary, ourParseInt } from '../../core';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderCheckedFilesList, RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesNoticesGradient, RenderTotals } from '../RenderProcessedResults';
import { checkBookPackage } from '../book-package-check/checkBookPackage';
import { userLog, logicAssert } from '../../core/utilities';


// const GL_BP_VALIDATOR_VERSION_STRING = '0.1.13';


function GlBookPackageCheck(/*username, languageCode, bookIDs,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckBookPackages");

    // debugLog(`I'm here in GlBookPackageCheck v${GL_BP_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    // TODO: We currently ignore originalLanguagesUsername
    let username = props.otherLanguageUsername;
    // debugLog(`username='${username}'`);
    let languageCode = props.languageCode;
    // debugLog(`languageCode='${languageCode}'`);
    let bookID = props.bookID;
    // debugLog(`bookID='${bookID}'`);
    let dataSet = props.dataSet;
    // debugLog(`dataSet='${dataSet}'`);
    let branch = props.branch;
    // debugLog(`branch='${branch}'`);

    const checkingOptions = { // Uncomment any of these to test them
        // excerptLength: 25,
        checkManifestFlag: true,
        checkReadmeFlag: true,
        checkLicenseFlag: true,
        suppressNoticeDisablingFlag: true, // Leave this one as true (otherwise demo checks are less efficient)
    };
    // Or this allows the parameters to be specified as a GlBookPackageCheck property
    if (props.excerptLength) checkingOptions.excerptLength = ourParseInt(props.excerptLength);
    if (props.cutoffPriorityLevel) checkingOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);

    useEffect(() => {
        // debugLog("GlBookPackageCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // debugLog("Started GlBookPackageCheck.unnamedFunction()");

            // NOTE from RJH: I can’t find the correct React place for this / way to do this
            //                  so it shows a warning for the user, and doesn’t continue to try to process
            if (!props.wait || props.wait !== 'N') {
                setResultValue(<p><span style={{ color: 'blue' }}>Waiting for user…</span> (Adjust settings below as necessary and then set <b>wait='N'</b> to start)</p>);
                return;
            }

            // NOTE from RJH: I can’t find the correct React place for this or way to do this
            //                  so it shows a warning for the user, and doesn’t continue to try to process
            if (bookID !== 'OBS' && !books.isValidBookID(bookID)) {
                userLog(`Invalid '${bookID}' bookID given!`)
                setResultValue(<p style={{ color: 'red' }}>Please enter a valid USFM book identifier or 'OBS'. ('<b>{bookID}</b>' is not valid.)</p>);
                return;
            }

            if (props.reloadAllFilesFirst && props.reloadAllFilesFirst.slice(0).toUpperCase() === 'Y') {
                userLog("Clearing cache before running GL book packages check…");
                setResultValue(<p style={{ color: 'orange' }}>Clearing cache before running GL book packages check…</p>);
                await clearCaches();
            }
            else await clearCheckedArticleCache(); // otherwise we wouldn't see any of the warnings again from checking these

            // Load whole repo zip files which is maybe faster than loading several individual files
            //  especially if we are going to also check the manifests, license, and ReadMe files as well as the book file.
            // Remember that the manifest check actually checks the existence of all the projects, i.e., all files in the repo
            let repoPreloadList;
            if (bookID === 'OBS') {
                repoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN2', 'OBS-SQ2']; // for DEFAULT
                if (dataSet === 'OLD')
                    repoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
                else if (dataSet === 'NEW')
                    repoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN', 'OBS-SQ'];
                else if (dataSet === 'BOTH')
                    repoPreloadList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TN2', 'OBS-TQ', 'OBS-TQ2', 'OBS-SN', 'OBS-SN', 'OBS-SN2', 'OBS-SQ2'];
            } else { // not OBS
                repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TQ', 'SN', 'SQ']; // for DEFAULT
                if (dataSet === 'OLD')
                    repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TQ'];
                else if (dataSet === 'NEW')
                    repoPreloadList = ['TWL', 'LT', 'ST', 'TN2', 'TQ2', 'SN', 'SQ'];
                else if (dataSet === 'BOTH')
                    repoPreloadList = ['TWL', 'LT', 'ST', 'TN', 'TN2', 'TQ', 'TQ2', 'SN', 'SQ'];
                const whichTestament = books.testament(bookID); // returns 'old' or 'new'
                logicAssert(whichTestament === 'old' || whichTestament === 'new', `BookPackageCheck() couldn't find testament for '${bookID}'`);
                const origLangRepo = whichTestament === 'old' ? 'UHB' : 'UGNT';
                repoPreloadList.unshift(origLangRepo);
            }
            if (!checkingOptions.disableAllLinkFetchingFlag) { // Both Bible books and OBS refer to TW and TA
                repoPreloadList.push('TW');
                repoPreloadList.push('TA');
            }
            // debugLog(`GlBookPackageCheck got repoPreloadList=${repoPreloadList} for dataSet=${dataSet}`)

            setResultValue(<p style={{ color: 'magenta' }}>Preloading {repoPreloadList.length} repos for <i>{username}</i> {languageCode} ready for GL book package check…</p>);
            const successFlag = await preloadReposIfNecessary(username, languageCode, [bookID], branch, repoPreloadList);
            if (!successFlag)
                console.error(`AllBookPackagesCheck error: Failed to pre-load all repos`)

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking <i>{username}</i> {languageCode} <b>{bookID}</b> book packages…</p>);

            const rawGlBPsResults = await checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions);
            // debugLog("checkBookPackage() returned", typeof rawCBPsResults); //, JSON.stringify(rawCBPsResults));

            // Add some extra fields to our rawCBPsResults object in case we need this information again later
            rawGlBPsResults.checkType = 'GLBookPackages';
            rawGlBPsResults.username = username;
            rawGlBPsResults.languageCode = languageCode;
            rawGlBPsResults.checkedOptions = checkingOptions;

            // debugLog("Here with CBPs rawCBPsResults", typeof rawCBPsResults);
            // Now do our final handling of the result -- we have some options available
            let processOptions = { // Uncomment any of these to test them
                // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don’t suppress
                // 'errorPriorityLevel': 800, // default is 700
                // 'cutoffPriorityLevel': 100, // default is 0
                // 'sortBy': 'ByRepo', // default is 'ByPriority', also have 'AsFound'
                // 'ignorePriorityNumberList': [123, 202], // default is []
            };
            // Or this allows the parameters to be specified as a GlBookPackageCheck property
            if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
            if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
            // if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
            if (props.sortBy) processOptions.sortBy = props.sortBy;
            // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;

            let displayType = 'ErrorsWarnings'; // default
            if (props.displayType) displayType = props.displayType;

            function renderSummary(processedResults) {
                return (<div>
                    <p>Checked <b>{username} {languageCode} {bookID}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
                    <RenderCheckedFilesList username={username} results={processedResults} />
                    <RenderTotals rawNoticeListLength={rawGlBPsResults.noticeList.length} results={processedResults} />
                    {/* <RenderRawResults results={rawCBPsResults} /> */}
                </div>);
            }

            if (displayType === 'ErrorsWarnings') {
                const processedResults = processNoticesToErrorsWarnings(rawGlBPsResults, processOptions);
                //                 userLog(`GlBookPackageCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numHiddenErrors=${processedResults.numHiddenErrors.toLocaleString()} numHiddenWarnings=${processedResults.numHiddenWarnings.toLocaleString()}`);

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
                const processedResults = processNoticesToSevereMediumLow(rawGlBPsResults, processOptions);
                //                 userLog(`GlBookPackageCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
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
                const processedResults = processNoticesToSingleList(rawGlBPsResults, processOptions);
                //                 userLog(`GlBookPackageCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
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
        })(); // end of async part in unnamedFunction
        // Doesn’t work if we add this to next line: bookIDList,bookIDs,username,branch,checkingOptions,languageCode,props
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookID, branch, JSON.stringify(checkingOptions), languageCode, JSON.stringify(props), username]); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// GlBookPackageCheck.propTypes = {
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

export default GlBookPackageCheck;
