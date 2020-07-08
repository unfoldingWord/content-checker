import React, { useState, useEffect, useContext } from 'react';
import { RepositoryContextProvider, RepositoryContext, FileContextProvider, FileContext } from 'gitea-react-toolkit';
// import { forwardRef } from 'react';
// import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
// import { Typography } from '@material-ui/core';
// import List from '@material-ui/core/List';
// import ListItem from '@material-ui/core/ListItem';
// import ListItemText from '@material-ui/core/ListItemText';
// import Paper from '@material-ui/core/Paper';
// import AddBox from '@material-ui/icons/AddBox';
// import ArrowDownward from '@material-ui/icons/ArrowDownward';
// import Check from '@material-ui/icons/Check';
// import ChevronLeft from '@material-ui/icons/ChevronLeft';
// import ChevronRight from '@material-ui/icons/ChevronRight';
// import Clear from '@material-ui/icons/Clear';
// import DeleteOutline from '@material-ui/icons/DeleteOutline';
// import Edit from '@material-ui/icons/Edit';
// import FilterList from '@material-ui/icons/FilterList';
// import FirstPage from '@material-ui/icons/FirstPage';
// import LastPage from '@material-ui/icons/LastPage';
// import Remove from '@material-ui/icons/Remove';
// import SaveAlt from '@material-ui/icons/SaveAlt';
// import Search from '@material-ui/icons/Search';
// import ViewColumn from '@material-ui/icons/ViewColumn';
// import MaterialTable from 'material-table';
// import { fetchRepo } from './helpers';
import * as books from '../../core/books/books.js';
// import * as util from '../../core/utilities.js';
import checkBookPackage from './checkBookPackage.js';
import processNotices from '../../core/notice-handling-functions.js';
// import { displayObject } from '../../core/utilities.js';

// const tableIcons = {
//   Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
//   Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
//   Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
//   Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
//   DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
//   Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
//   Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
//   Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
//   FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
//   LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
//   NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
//   PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
//   ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
//   Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
//   SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
//   ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
//   ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
// };

const CHECKER_VERSION_STRING = '0.0.2';

function BookPackageCheck(/*username, language_code, book_code,*/ props) {
  const { state: repo, component: repoComponent } = useContext(RepositoryContext);
//   const { state: file, component: fileComponent } = useContext(FileContext);
  const { state: repository, component: setRepository } = useState(RepositoryContext);
//   const { state: file, component: setFilepath } = useState(FileContext);

  // const { state: file, component: fileComponent } = useContext(FileContext);

//   console.log("BPC repo", typeof repo, JSON.stringify(repo));
//   console.log("BPC repoComponent", typeof repoComponent);
//   console.log("BPC repository", typeof repository, JSON.stringify(repository));
//   console.log("BPC setRepository", typeof setRepository);
//   console.log("BPC file", typeof file, JSON.stringify(file));
//   console.log("BPC fileComponent", typeof fileComponent);

  console.log("I'm here in BookPackageCheck v" + CHECKER_VERSION_STRING);
  // displayObject("props", props);
  // displayObject("props.classes", props.classes);
  let username = props.username;
  // console.log("username='"+ username+"'");
  let language_code = props.language_code;
  // console.log("language_code='"+ language_code+"'");
  let book_code = props.book_code;
  // console.log("book_code='"+ book_code+"'");
  let branch = undefined;

  if (!books.isValidBookCode(book_code))
    return (<p>Please enter a valid USFM book code. ('{book_code}' is not valid.)</p>);

  let checkingOptions = { // Uncomment any of these to test them
    // 'extractLength': 25,
    };
// Or this allows the parameters to be specified as a BookPackageCheck property
if (props.extractLength) checkingOptions.extractLength = parseInt(props.extractLength);


let returnedResult = <p style={{ color: 'magenta' }}>Waiting for check results for {username} {language_code} <b>{book_code}</b> book package…</p>;

// failing async code -- sorta works except doesn't render when completed
// let preliminaryResult = { successList:[], noticeList:[]};
let processedResult = { successList:[], errorList:[], warningList:[] };
// useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
        console.log("Started unnamedFunction()");
        let preliminaryResult = await checkBookPackage(username, language_code, book_code, checkingOptions);
        console.log("checkBookPackage() returned", typeof preliminaryResult); //, JSON.stringify(preliminaryResult));

        // Add some extra fields to our preliminaryResult object in case we need this information again later
        preliminaryResult.checkType = 'BookPackage';
        preliminaryResult.username = username;
        preliminaryResult.language_code = language_code;
        preliminaryResult.book_code = book_code;
        preliminaryResult.checkingOptions = checkingOptions;

        console.log("Here with preliminaryResult", typeof preliminaryResult);
        // Now do our final handling of the result -- we have some options available
        let processOptions = { // Uncomment any of these to test them
            // 'maximumSimilarMessages': 3, // default is 2
            // 'errorPriorityLevel': 800, // default is 700
            // 'cutoffPriorityLevel': 100, // default is 0
            // 'sortBy': 'ByPriority', // default is 'AsFound'
            // 'ignorePriorityNumberList': [123, 202], // default is []
        };
        // Or this allows the parameters to be specified as a BookPackageCheck property
        if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = parseInt(props.maximumSimilarMessages);
        if (props.errorPriorityLevel) processOptions.errorPriorityLevel = parseInt(props.errorPriorityLevel);
        if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = parseInt(props.cutoffPriorityLevel);
        if (props.sortBy) processOptions.sortBy = props.sortBy;
        // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
        processedResult = processNotices(preliminaryResult, processOptions);
        console.log("BookPackageCheck got back processedResult with " + processedResult.successList.length.toLocaleString() + " success message(s), " + processedResult.errorList.length.toLocaleString() + " error(s) and " + processedResult.warningList.length.toLocaleString() + " warning(s)");
        console.log("  numIgnoredNotices=" + processedResult.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + processedResult.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResult.numSuppressedWarnings.toLocaleString());
        console.log("Finished unnamedFunction().");

    // WHY WHY WHY doesn't this render from inside useEffect/async???
    console.log("Here now in rendering bit!");

    function RenderArray(props) {
        // Display our array of 4-part lists in a nicer format
        // Uses 'result' object from outer scope
        let myList;
        if (props.arrayType === 's')
            return (<ol>
                {processedResult.successList.map(function (listEntry) {
                    return <li key={listEntry.id}>
                        <b style={{ color: 'green' }}>{listEntry}</b>
                    </li>;
                })}
            </ol>
            );
        else {
            const myList = props.arrayType === 'e' ? processedResult.errorList : processedResult.warningList;
            return (<ul>
                {myList.map(function (listEntry) {
                    return <li key={listEntry.id}>
                        <b style={{ color: props.arrayType === 'e' ? 'red' : 'orange' }}>{listEntry[1]}</b>
                        {listEntry[2] > 0 ? " (at character " + (listEntry[2] + 1) + ")" : ""}
                        <span style={{ color: 'DimGray' }}>{listEntry[3] ? " in '" + listEntry[3] + "'" : ""}</span>
                        {listEntry[4]}
                        <small style={{ color: 'Gray' }}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
                    </li>;
                })}
            </ul>
            );
        }
    }

    if (processedResult.errorList.length || processedResult.warningList.length)
        returnedResult = (<>
            <p>Checked <b>{username} {language_code} {book_code}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)
                {processedResult.numIgnoredNotices ? " (but " + processedResult.numIgnoredNotices.toLocaleString() + " ignored errors/warnings)" : ""}</p>
            <b style={{ color: processedResult.errorList.length ? 'red' : 'green' }}>{processedResult.errorList.length.toLocaleString()} error{processedResult.errorList.length == 1 ? '' : 's'}</b>{processedResult.errorList.length ? ':' : ''}
            <small style={{ color: 'Gray' }}>{processedResult.numSuppressedErrors ? " (" + processedResult.numSuppressedErrors.toLocaleString() + " similar one" + (processedResult.numSuppressedErrors == 1 ? '' : 's') + " suppressed)" : ''}</small>
            <RenderArray arrayType='e' />
            <b style={{ color: processedResult.warningList.length ? 'orange' : 'green' }}>{processedResult.warningList.length.toLocaleString()} warning{processedResult.warningList.length == 1 ? '' : 's'}</b>{processedResult.warningList.length ? ':' : ''}
            <small style={{ color: 'Gray' }}>{processedResult.numSuppressedWarnings ? " (" + processedResult.numSuppressedWarnings.toLocaleString() + " similar one" + (processedResult.numSuppressedWarnings == 1 ? '' : 's') + " suppressed)" : ''}</small>
            <RenderArray arrayType='w' />
        </>);
    else // no errors or warnings
        returnedResult = (<>
            <p>Checked <b>{username} {language_code} {book_code}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)
            {processedResult.numIgnoredNotices ? " (with a total of " + processedResult.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
            <b style={{ color: 'green' }}>{processedResult.successList.length.toLocaleString()} check{processedResult.successList.length == 1 ? '' : 's'} completed</b>{processedResult.successList.length ? ':' : ''}
            <RenderArray arrayType='s' />
        </>);
    console.log("Finished rendering bit.");

    // console.log("ReturningINSIDE", typeof returnedResult);
    // return returnedResult;


    })(); // end of async part in unnamedFunction

// }, []); // end of useEffect part

console.log("ReturningOUTSIDE", typeof returnedResult);
return returnedResult;
}

// BookPackageCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   language_code: PropTypes.object.isRequired,
//   book_code: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
  root: {
  },
});

export default withStyles(styles)(BookPackageCheck);
