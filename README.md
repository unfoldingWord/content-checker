[![Custom badge](https://img.shields.io/endpoint?color=%2374b9ff&url=https%3A%2F%2Fraw.githubusercontent.com%2unfoldingWord%2Fcontent-validation%2Fmaster%2Fcoverage%2Fshields.json)]()
[![Install, Build & Run Cypress](https://github.com/unfoldingWord/uw-content-validation/workflows/Install,%20Build%20&%20Run%20Cypress/badge.svg)]()

# uW Content/Resource Validation functions

GH Pages: [[https://unfoldingword.github.io/uw-content-validation/]]

This repository contains JavaScript functions for validating/checking for errors in text that is passed to the functions. This text might be a line in a file (especially a TSV file when a line contains a number of distinct fields), or the entire text of a file that’s perhaps open in an editor in the enclosing app.

The basic functions return an object containing two lists:

1. successList: a list of strings giving an overview of what checks have been made,
1. noticeList: a list of objects with fields that can be filtered, sorted, combined, and then displayed as error or warning messages.

Note that the object may also contain other relevant fields such as `checkedFileCount`, `checkedFilenames`, `checkedFilenameExtensions`, `checkedFilesizes`, `checkedRepoNames`, and `elapsedSeconds`.

There are three sample notice processing functions that show how to:

1. Divide the noticeList into a list of errors and a list of warnings,
1. Divide the noticeList into a list of severe, medium, and low priority warnings,
1. Convert the noticeList into a list of warnings sorted by priority,

In addition, there are Styleguidist pages viewable at [[https://unfoldingword.github.io/uw-content-validation/]] which show how these core functions may be used, effectively producing a primitive app that checks Door43.org files, repositories (repos), book packages, etc. as well as demonstrating the basic functions.

## The Stack

- Javascript for primary functions.
- React (functional components & hooks) for demonstration applets.
- MaterialUI for UI/UX baseline design components.
- Styleguidist for Playground Documentation.
- Yarn for dependencies, publishing, and deploying.
- Github + NPM + Github Pages for Hosting.
- Cypress for testing

## Design Philosophy

This code is designed to thoroughly check various types of Bible-related content data files. This includes:

1. [Unified Standard Format Marker](ubsicap.github.io/usfm/) (USFM) Bible content files, including original language Bibles and Bible translations aligned by word/phrase to the original words/phrases
1. Legacy Translation Notes (TN) tables in Tab-Separated Values (9-column TSV) files
1. New tables in Tab-Separated Values (TSV) files (uses TWL, TN2 and TQ2, SN and SQ)
1. Markdown files (and markdown fields in TSV files)
1. Plain-text files
1. Metadata (manifest) YAML files

Note: There is also a separate function for checking individual TSV lines (e.g., TN, TN2, TQ2) which is intended to be able to provide immediate user feedback if built into a TSV editor.

The top-level checking demonstrations return:

1. A list of things that were checked (successList)
1. Typically a list of (higher-priority) errors and a list of (lower-priority) warnings, but other formats for display of messages are also demonstrated.

Note that it's quite possible for the package to give multiple different notices for a single mistake. For example, a punctuation abnormality in a quoted text might advise about the bad punctuation as well as advising about not being able to match the quote. The package errs on the side that having additional warnings is better than missing a warning (and then later being confused about why a data file won't load). These consequential warnings mean that, if possible, it's good to rerun the checks from time to time on your latest files as you're fixing multiple errors.

### Notice Objects (in noticeList)

However, the lower-level checking functions provide only the list of success message strings and one list of `notices` (i.e., warnings/errors combined) typically consisting of an object with some or all of the following fields (as available/relevant):

There are two compulsory fields in all of these notice objects:

1. `priority`: A notice priority number in the range 1-1,000. Each different type of warning/error has a unique number (but not each instance of those warnings/errors). By default, notice priority numbers 700 and over are considered `errors` and 0-699 are considered `warnings`, but in truth, that’s rather arbitrary.
1. `message`: The actual general descriptive text of the notice

All of the following fields may be missing or undefined, i.e., they’re all optional:

1. `details`: More helpful details about the notice (if applicable)
1. `repoCode`: brief repository code (if available), e.g., 'UHB', 'LT', 'ST', 'TN', 'TQ', 'TN2', 'TQ2', etc.
1. `repoName`: Door43 repository name (if available), e.g., 'en_ta', 'hi_tw'
1. `filename`: filename string (if available)
1. `bookID`: The 3-character UPPERCASE [book identifier](http://ubsicap.github.io/usfm/identification/books.html) or [OBS](https://www.openbiblestories.org/) (if relevant)
1. `C`: The chapter number or OBS story number (if relevant)
1. `V`: The verse number or OBS frame number (if relevant)
1. `rowID`: 4-character ID field for TSV row (if relevant)
1. `lineNumber`: A one-based line number in the file (if available)
1. `fieldName`: name of TSV field (if relevant)
1. `characterIndex`: A **zero-based** integer character index which indicates the position of the error in the given text (line or field) (if available)
1. `excerpt`: An excerpt (if available) from the checked text which indicates the area containing the problem. Where helpful, some character substitutions have already been made, for example, if the notice is about spaces, it is generally helpful to display spaces as a visible character in an attempt to best highlight the issue to the user. (The length of the excerpt defaults to ten characters, but is settable as an option.)
1. `location`: A string indicating the context of the notice, e.g., "in line 17 of 'someBook.usfm'". (Still not completely sure what should be left in this string now that we have added optional `repoName`, `filename`, `rowID`, `lineNumber`, `fieldName` fields.)
1. `extra`: for a check that looks in multiple repos, this contains extra identifying information (typically the `repoCode`) to help the user determine what resource/repo/file that the notice applies to (which, in the demos, is then often prepended to the `message`).

Keeping our notices in this format, rather than the simplicity of just saving an array of single strings, allows the above *notice components* to be processed at a higher level, e.g., to allow user-controlled filtering, sorting, etc. For example, in a rush it might be good to display the highest priority messages first, and fix a few of those. On the other hand, if working systematically through, it might be good to sort by filename and line-number so that warnings about the same part of a file can be viewed together irrespective of their different priority numbers.

The default in the demos is to funnel all the raw notices through the supplied `processNoticesToErrorsWarnings` function (in demos/notice-processing-functions.fs) which does the following:

1. Removes excess repeated errors. For example, if there’s a systematic error in a file, say with unneeded leading spaces in every field, rather than returning with hundreds of errors, only the first several errors will be returned, followed by an "errors suppressed" message. (The number of each error displayed is settable as an option—zero means display all errors with no suppression.)
1. Separates notices into error and warning lists based on the priority number. (The switch-over point is settable as an option.)
1. Optionally drops the lowest priority notices and/or certain given notice types (by priority number).

There is a second version of the function which splits into `Severe`, `Medium`, and `Low` priority lists instead. And a third version that leaves them as notices, but allows for a Bright red...Dull red colour gradient instead.

However, the user is, of course, free to create their own alternative version of these functions. This is possibly also the place to consider localisation of all the notices into different interface languages???

## User-settable Options

### Checking Options

There is provision for checking to be altered and/or sped-up when the calling app sets some or all of the following fields in `checkingOptions`:

- `disableAllLinkFetchingFlag`: a boolean (true/false) which if set to true, stops the package from fetching and checking links, e.g., when a translation note refers to Translation Academy it won’t check that the TA article actually exists, and also stops the checking of any extra files like LICENSE.md—this gives a dramatic speed-up to many checks (but, of course, it means that the data might still contain quite major errors)
- `getFile`: a function which takes the four parameters ({username, repository, path, branch}) and returns the full text of the relevant Door43 file—default is to use our own function and associated caching
- `fetchRepositoryZipFile`: a function which takes the three parameters ({username, repository, branch}) and returns the contents of the zip file containing all the Door43 files—default is to use our own function and associated caching
- `getFileListFromZip`: takes the same three parameters and returns a list/array containing the filepaths of all the files in the zip file from Door43—default is to use our own function and associated caching
- `originalLanguageVerseText`: the Hebrew/Aramaic or Greek original language text for the book/chapter/verse of the TSV line being checked—this enables `Quote` fields to be checked without needing to load and parse the actual USFM file
- `originalLanguageRepoUsername` and `originalLanguageRepoBranch`: these two fields can be used to specify the username/organisation and/or the branch/tag name for fetching the UHB and UGNT files for checking
- `taRepoUsername`, `taRepoBranchName`: these two fields can be used to specify the username/organisation and/or the branch/tag name for fetching the TA files for checking
- `taRepoLanguageCode`, and `taRepoSectionName`: can be used to specify how the `SupportReference` field is checked in TA—defaults are 'en' and 'translate'
- `twRepoUsername`, `twRepoBranchName`: these two fields can be used to specify the username/organisation and/or the branch/tag name for fetching the TW files for checking
- `excerptLength`: an integer which defines how long excerpts of lines containing errors should be—the default is 20 characters—the package attempts to place the error in the middle of the excerpt
- `cutoffPriorityLevel`: an integer which can define notices to not be detected—defaults to 0 so none are dropped. Note that this will also affect the `suggestion` response. (Only partially implemented at present, so drops some but not all low priority notices.)
- `suppressNoticeDisablingFlag`: Defaults to `false`, i.e., to removing (thus suppressing) notices for warnings which are expected in certain files and hence we don’t want them displayed. Note that this is always set to `true` for the demos (because they suppress these notices later—see the `showDisabledNoticesFlag` below).

    Currently this supressing is only done in the (exported) `checkTN_TSV9Table` and `checkNotesTSV7Table` functions which we know to be called by [tC Create](https://github.com/unfoldingWord/tc-create-app) as well as `checkManifestText`, `checkMarkdownText`, `checkPlainText`, `checkTN_TSV9Table`, `checkUSFMText`, and `checkYAMLText` called by the [Content Validation App](https://github.com/unfoldingWord-box3/content-validation-app).

Most of the high-level demonstrations allow a choice of one of three display formats for notices:

- 'SingleList': sorts notices by priority (highest first) then colours the highest ones bright red, slowly fading to black for the lowest priorities
- 'ErrorsWarnings': arbitrarily divides notices into a list of *errors* and a list of *warnings*, each displayed in different colours
- 'SevereMediumLow': divides notices into three lists which are displayed in different colours

### Processing Options

In addition, there are some options in the display of notices for the demonstrations, set in `optionalProcessingOptions` used by the sample notice processing functions:

- `ignorePriorityNumberList`: a list (array) of integers that causes of notices with these priority values to be dropped during notice processing
- `sortBy`: a string which can be set to 'ByPriority', 'ByRepo', or 'AsFound'—the default is 'ByPriority', i.e., unsorted
- `errorPriorityLevel`: an integer which can define *errors* (vs *warnings*) (if relevant)—defaults to 700 (and above)
- `severePriorityLevel`: an integer which can define *severe* errors (if relevant)—defaults to 800 (and above)
- `mediumPriorityLevel`: an integer which can define *medium* errors (if relevant)—defaults to 600 (and up to `severePriorityLevel`)
- `cutoffPriorityLevel` (deprecated): an integer which can define notices to be dropped/ignored—defaults to 0 so none are dropped
- `maximumSimilarMessages`: an integer which defines how many of a certain notice to display, before summarising and saying something like *99 similar errors suppressed*—zero means don’t ever summarise notices—defaults to 3
- `showDisabledNoticesFlag`: some content files produce false alarms, e.g., a discussion of using the , as punctuation. Where known, these false alarm notices are disabled from being shown. Setting this flag to 'true' would show these notices (with the word "(disabled)" added) instead—the default is 'false'.

## Still To Do

There is a list of open issues at [[https://github.com/unfoldingWord/uw-content-validation/issues]] (and you can add suggestions and bug reports there at any time). But in summary, still unfinished (in rough priority order):

1. Finish checking that new formats working are again (in `newFormat` branches)
1. Finish moving `cutoffPriorityLevel` from `processingOptions` to `checkingOptions`
1. The `suggestion` mechanism is working, but more suggestions need to be created
1. Checking of general markdown and naked links (esp. in plain text and markdown files)
1. Work through all [Issues](https://github.com/unfoldingWord/uw-content-validation/issues)
1. Work through all `ToDo`s in code
1. Standardise parameters according to best practice (i.e., dereferencing, etc.)—might be too late now coz it would affect API presented to users???
1. Document the API (with JsDoc)
1. Improve general documentation in the code and readMe files
1. Is our `RepoCheck` the same as `ResourceContainerCheck`? Or is the latter more specific?
1. Understand and standardise React stuff in the demos, e.g., e.g., withStyles, etc.
1. Check for and remove left-over (but unused) code from the source projects that the original code was copied from
1. Remove all debug code and console logging, and to consider possible speed and memory optimizations (incl. async and/or multi-worker operations)
1. Add a Scripture Burrito check (once Door43 has that available).

Known bugs:

1. Not all demos have all available options
1. 'NEW' option not yet working again in Book Package Check
1. Work on checking naked links in text files is not yet completed
1. File caching (i.e., not checking latest file versions) is still a frustration that needs to be investigated—presumably it’s out of control of this package and its demos???

Known check deficiencies:

1. Markdown image format `![xx](yy)` is not yet fully checked
1. Manifests are not checked against all files, i.e., to find files potentially missing from the manifest
1. Naked HTTP links are not yet checked properly
1. ULT/UST quotes in TranslationAcademy are not yet checked

## Functionality and Limitations

See component `README` for details.

# How to install

Once you have this codebase forked and cloned to your local machine, you can start modifying the codebase. You will need to ensure `node.js` and `yarn` are already installed.

### Installation and Running the Styleguide Locally

1. Install the npm dependencies with `yarn`.
1. Run the Styleguide with `yarn start`.
1. Ensure that the Styleguide is running by visiting `localhost:6060` on your web browser. (for Chromebooks see note below)
1. Modify the code and documentation in your code editor and check out the Styleguide.
    - Update the styleguide.config.js to match your new component names.
1. See debug `userLog()` output in browser console—in chrome, CTRL-SHIFT-J to open.

### Setting up NPM Publishing

1. Rename your library:
    - the folder
    - repo on Github
1. Update the `package.json`:
    - change the `name` and `description` of your app
    - change the URLs of your `homepage` and `repository`
1. Create an account on `npmjs.org` if you don’t have one already.

### Publishing to NPM

The scripts in the `package.json` file do all of the heavy lifting.

1. Commit and push all changes to your github repo.
1. Run `yarn publish`:
    - login to NPM using your credentials if asked.
    - enter the new version number using symver.
    - wait for the code to be transpiled and published to NPM.
    - wait for the styleguide to be built and deployed to GHPages.
1. Visit your published library on NPM.
1. Visit your deployed Styleguide on GHPages.

### Deploying Styleguide to GHPages

You can optionally deploy the styleguide to GHPages without publishing to NPM.

1. Run `yarn deploy`
1. There is a `predeploy` hook that builds the Styleguide.
1. That’s it!

## Chromebook Linux Beta Notes

Must use `hostname -I` to get the host address. **Neither `localhost` nor `127.0.0.1` will work.**

```
$ hostname -I
100.115.92.202
$
```
