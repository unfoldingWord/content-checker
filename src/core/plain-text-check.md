## Plain Text Check Sandbox

This function checks the given text for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import { checkPlainText } from './plain-text-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// Plain text samples
const textSG = `Short Good Plain Test

This is a paragraph.

Second level heading

Another paragraph.

  List item 1
  List item 2
`;
const textSB = `Short Ba,d Plain Test

This should be a  paragraph.

First level heading

Another  paragraph.

  List item 1
   List item 2
`;

// You can choose any of the above texts here
//  (to demonstrate differing results)
const chosenText = textSB;
const chosenTextName = 'textSB';

const rawResults = checkPlainText('raw', chosenTextName, chosenText, 'that was supplied');
if (!rawResults.successList || !rawResults.successList.length)
  rawResults.successList = ["Done plain text checks"];

<>
<b>Source (normalized)</b>: <RenderLines text={chosenText} />
<RenderRawResults results={rawResults} />
</>
```
