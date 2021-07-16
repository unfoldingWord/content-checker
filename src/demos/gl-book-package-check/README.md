## Door43 Gateway Language Book Package Check - Readme

The code below requests some info and then downloads and checks the single specified Bible book in several repos. This is convenient to see all these check results collected into one place.

See a list of valid book identifiers [here](http://ubsicap.github.io/usfm/identification/books.html), although only `GEN` to `REV` from that list are useful here.

Note that `OBS` can also be entered here as a *pseudo book identifier* in order to check an **Open Bible Stories** repo.

`GL Book Packages Check` calls `checkBookPackage()` for each language and each given book identifier, which in turn calls `checkFileContents()` for the book file in each repo (or calls `checkRepo()` for **OBS**).

**Warning**: Some book packages contain many files and/or very large files, and downloading them all and then checking them might slow down your browser—maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration can use saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won’t notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

import { clearCheckedArticleCache } from '../../core';
import GlBookPackageCheck from './GlBookPackageCheck';

clearCheckedArticleCache();

<GlBookPackageCheck
  // NOTE: originalLanguagesUsername is not yet used by the demonstration
  // Uncomment or change ONE of the following lines
  // originalLanguagesUsername='Door43-Catalog' // repo organisation name for published Door43 UHB and UGNT versions
  originalLanguagesUsername='unfoldingWord' // repo organisation name for work-in-progress Door43 UHB and UGNT versions

  // Uncomment or change ONE of the following lines
  // otherLanguageUsername='Door43-Catalog' // repo organisation name for all published Door43 LT, ST, TN, etc. versions
  // otherLanguageUsername='unfoldingWord' // repo organisation name for work-in-progress en Door43 ULT, UST, UTN, etc. versions
  // otherLanguageUsername='Es-419_gl' // repo organisation name for work-in-progress es-419 Door43 LT, ST, TN, etc. versions
  // otherLanguageUsername='translationCore-Create-BCS' // repo organisation name for work-in-progress hi/kn Door43 LT, ST, TN, etc. versions
  otherLanguageUsername='ru_gl' // repo organisation name for work-in-progress ru Door43 LT, ST, TN, etc. versions

  // Of course, this languageCode has to match the chosen otherLanguageUsername above
  languageCode='ru' // Tested with es-419, hi, kn, ru

  // bookID can be a USFM bookID, e.g., 'GEN', 'MAT', '3JN'
  //  and can also be 'OBS' (for Open Bible Stories)
  bookID='TIT'

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // Specifying maximumSimilarMessages and excerptLength is just to show off options
  // —those fields are not necessary (or normal) here
  //maximumSimilarMessages='4' // Default is 3 (0 means don’t suppress any)
  // excerptLength='25' // Default is 20 characters
  // cutoffPriorityLevel='200' // Default is to detect all errors/warnings
  />
```
