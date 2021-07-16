## Door43 Book Packages Check - Readme

The code below requests some info and then downloads and checks the given Bible books across several repos. This is convenient to see all these check results collected into one place.

See a list of valid book identifiers [here](http://ubsicap.github.io/usfm/identification/books.html), although only `GEN` to `REV` from that list are useful here.

Note that `OBS` can also be entered here as a *pseudo book identifier* in order to check an **Open Bible Stories** repo.

`Book Packages Check` calls `checkBookPackages()` which then calls `checkBookPackage()` for each given book identifier, which in turn calls `checkFileContents()` for the book file in each repo (or calls `checkRepo()` for **OBS**).

**Warning**: Some book packages contain many files and/or very large files, and downloading them all and then checking them might slow down your browser—maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration can use saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won’t notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

import BookPackagesCheck from './BookPackagesCheck';

<BookPackagesCheck
  // Leave as Y while adjusting settings below, then change to N to start the check
  wait='Y' // 'Y' (for Yes, i.e., to wait) or 'N' (for No, i.e., to start checking)

  // Set to N to rerun the check without fetching new copies of the files (slightly faster)
  // If you're checking and then editing & saving files, ensure that it's set to Y before you recheck
  reloadAllFilesFirst='Y' // 'Y' (for Yes -- same as ClearCache in menu) or 'N' (for No)

  username='unfoldingWord'
  languageCode='en'
  // Enter a string containing UPPERCASE USFM book identifiers separated only by commas
  //  and can also include OBS (for Open Bible Stories)
  bookIDs='RUT,EZR,NEH,EST,OBA,JON,LUK,EPH,1TI,2TI,TIT,JAS,1JN,2JN,3JN'
  // The above English book packages should all be finished or well along the way
  // bookIDs='RUT,EZR,NEH,EST,OBA,JON' // Uncomment if you're interested in OT only
  // bookIDs='LUK,EPH,1TI,2TI,TIT,JAS,1JN,2JN,3JN' // Uncomment if you're interested in NT only

  // We can choose the forthcoming new TSV formats or the existing formats
  // dataSet='OLD' // 'OLD' (Markdown TQ, TSV TN, etc.), 'NEW' (TSV TQ2, TN2, etc.), 'DEFAULT', or 'BOTH'

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // Specifying maximumSimilarMessages and excerptLength is just to show off options
  // —those fields are not necessary (or normal) here
  //maximumSimilarMessages='8' // Default is 3 (0 means don’t suppress any)
  // excerptLength='25' // Default is 20 characters
  cutoffPriorityLevel='200' // Default is to detect all errors/warnings
  // sortBy='ByRepo' // Default is 'ByPriority'; also have 'ByRepo' and 'AsFound'
  // showDisabledNoticesFlag='false' // Display known specific non-issues: 'true' or 'false'
  />
```
