## Door43 Repo Check - Readme

The code below requests some info and then downloads and checks a Door43 repository.You can enter the `repoName`, i.e., the `username/repoName` in the code below. (Unfortunately if you refresh the page from the browser controls, it will return to the default setting. If you want to restart the test without returning to the default repo, just change one letter in a `//` comment line below.)

**Warning**: Some repos contain many files and/or very large files, and downloading them all and then checking them might slow down your browser—maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration can use saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won’t notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

import RepoCheck from './RepoCheck';

<RepoCheck
  // Leave as Y while adjusting settings below, then change to N to start the check
  wait='Y' // 'Y' (for Yes, i.e., to wait) or 'N' (for No, i.e., to start checking)

  // Set to N to rerun the check without fetching new copies of the files (slightly faster)
  // If you're checking and then editing & saving files, ensure that it's set to Y before you recheck
  reloadAllFilesFirst='Y' // 'Y' (for Yes -- same as ClearCache in menu) or 'N' (for No)

  // username = 'Door43-Catalog'
  username = 'unfoldingWord'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // NOTE: Some of these whole repository checks can take a looong time!
  // repoName='hbo_uhb' // includes OT books only—some large files with parsing info!
  // repoName='el-x-koine_ugnt' // includes NT books only—some large files with parsing info!
  // repoName='en_twl' // Translation Words (TSV files but looks up 1,000+ markdown files)
  // repoName='en_ult' // Can use ult or ust here—some large files with alignment info!
  // repoName='en_tn' // Translation Notes (TSV tables -- MANY links to check!)
  // repoName='en_tq' // Translation Questions (17,000+ markdown files!)
  // repoName='en_sn' // Study Notes (TSV)
  // repoName='en_sq' // Study Questions (TSV)
  // repoName='en_tw' // Translation Words (1,000+ markdown files)
  repoName='en_ta' // Translation Academy (700+ markdown files)
  // repoName='en_obs' // Open Bible Stories (50+ markdown files)
  // repoName='en_obs-tn' // Open Bible Stories Translation Notes (markdown files)
  // repoName='en_obs-twl' // Open Bible Stories Translation Words Links (TSV)
  // repoName='en_obs-tq' // Open Bible Stories Translation Questions (markdown)
  // repoName='en_obs-sn' // Open Bible Stories Study Notes (TSV)
  // repoName='en_obs-sq' // Open Bible Stories Study Questions (TSV)
  // repoName='en_uhal' // Hebrew/Aramaic Lexicon (8,000+ markdown files!)
  // repoName='en_ugl' // Greek Lexicon (24,000 markdown files!)
  // repoName='fr_ulb' // No alignment so smaller files (faster demo)

  // If we don’t put the branch or release version here, the default branch is used
  // branchOrRelease='master'

  // The location field appears in check messages to help the user locate the issue
  location="as specified in repo-check/README.md"

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Specifying maximumSimilarMessages and excerptLength is just to show off options
  // —those fields are not necessary (or normal) here
  //maximumSimilarMessages='4' // Default is 3 (0 means don’t suppress any)
  // excerptLength='25' // Default is 20 characters
  // cutoffPriorityLevel='200' // Default is to detect all errors/warnings
  // sortBy='AsFound' // Default is 'ByPriority'; also have 'AsFound' and 'ByRepo' (not relevant here)
  showDisabledNoticesFlag='false' // Display known specific non-issues: 'true' or 'false'
/>
```
