## Door43 File Check - Readme

The code below requests some info to select an online repository
and then validates the content of one file selected from the repo.

**Note**: This demonstration can use saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won’t notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

<FileCheck
  // Leave as Y while adjusting settings below, then change to N to start the check
  wait='Y' // 'Y' (for Yes, i.e., to wait) or 'N' (for No, i.e., to start checking)

  // Set to N to rerun the check without fetching new copies of the files (slightly faster)
  // If you're checking and then editing & saving files, ensure that it's set to Y before you recheck
  reloadAllFilesFirst='Y' // 'Y' (for Yes -- same as ClearCache in menu) or 'N' (for No)

  // username='Door43-Catalog'
  username='unfoldingWord'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // repoName='hbo_uhb' // OT books only
  // repoName='el-x-koine_ugnt' // NT books only
  // repoName='en_ult' // Can use ult or ust here
  repoName='en_ugl' // Can use ta, tw, tn, tq, sn, sq, uhal, or ugl here

  // If we don’t put the branch or release version here, the default branch is used
  // branchOrRelease='master'

  // Of course, the filename must be correct for the chosen repository
  // filename= '01-GEN.usfm' // e.g., for UHB, LT, or ST
  // filename= '08-RUT.usfm' // e.g., for UHB, LT, or ST
  // filename= '39-MAL.usfm' // e.g., for UHB, LT, or ST
  // filename= '41-MAT.usfm' // e.g., for UGNT, LT, or ST
  // filename= '42-MRK.usfm' // e.g., for UGNT, LT, or ST
  // filename= '43-LUK.usfm' // e.g., for UGNT, LT, or ST
  // filename= '45-ACT.usfm' // e.g., for UGNT, LT, or ST
  // filename= '48-2CO.usfm' // e.g., for UGNT, LT, or ST
  // filename= '50-EPH.usfm' // e.g., for UGNT, LT, or ST
  // filename= '57-TIT.usfm' // e.g., for UGNT, LT, or ST
  // filename= '65-3JN.usfm' // e.g., for UGNT, LT, or ST
  // filename= '67-REV.usfm' // e.g., for UGNT, LT, or ST
  // filename= 'en_tn_01-GEN.tsv' // for TSV9 TN
  // filename= 'en_tn_15-EZR.tsv' // for TSV9 TN
  // filename= 'en_tn_16-NEH.tsv' // for TSV9 TN
  // filename= 'en_tn_17-EST.tsv' // for TSV9 TN
  // filename= 'en_tn_31-OBA.tsv' // for TSV9 TN
  // filename= 'en_tn_39-MAL.tsv' // for TSV9 TN
  // filename= 'en_tn_41-MAT.tsv' // for TSV9 TN
  // filename= 'en_tn_43-LUK.tsv' // for TSV9 TN
  // filename= 'en_tn_50-EPH.tsv' // for TSV9 TN
 // filename= 'en_tn_57-TIT.tsv' // for TSV9 TN
  // filename= 'en_tn_58-PHM.tsv' // for TSV9 TN
  // filename= 'en_tn_61-1PE.tsv' // for TSV9 TN
  // filename= 'en_tn_65-3JN.tsv' // for TSV9 TN
  // filename= 'en_tn_67-REV.tsv' // for TSV9 TN
  // It's actually possible to put a filepath in the filename field
  // filename= 'bible/names/zilpah.md' // for TW
   filename= 'content/H0612.md' // for UHAL
   filename= 'content/G14650/01.md' // for UGL

  // The location field appears in check messages to help the user locate the issue
  location="as specified in FileCheck demo"

  // Specifying excerptLength and cutoffPriorityLevel is just to show off options
  // —those fields are not necessary (or normal) here
  excerptLength='25' // Default is 20 characters
  // cutoffPriorityLevel='200' // Default is to detect all errors/warnings

  // Normally links in files are downloaded to check that they really exist
  // disableAllLinkFetchingFlag='false' // 'true' or 'false'
  disableAllLinkFetchingFlag='false' // 'true' or 'false'
  // The next two are only relevant if the above is 'false'
  // They control whether the linked articles themselves are also checked or not
  disableLinkedTAArticlesCheckFlag='false' // 'true' or 'false'
  disableLinkedTWArticlesCheckFlag='false' // 'true' or 'false'

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Specifying maximumSimilarMessages is just to show off options
  // —those fields are not necessary (or normal) here
  //maximumSimilarMessages='0' // Default is 3 (0 means don’t suppress any)
  />
```
