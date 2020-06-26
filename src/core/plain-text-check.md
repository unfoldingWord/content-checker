## Plain Text Check Sandbox

This function checks the given text for typical formatting errors.

It returns a list of errors and a list of warnings.

```js
import checkPlainText from './plain-text-check.js';

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
const chosenName = 'textSB';

const result = checkPlainText(chosenName, chosenText, 'that was supplied');

function RenderLines(props){
    return ( <ol>
        {props.text.split('\n').map(function(line){
            return <li key={line.id}>{line}</li>;
        })}
        </ol>
    );
}

function RenderArray(props) {
    // Display our array of 4-part lists in a nicer format
    // Uses 'result' object from outer scope
    const myList = props.arrayType=='e'? result.errorList : result.warningList;
    return ( <ul>
            {myList.map(function(listEntry){
                return <li key={listEntry.id}><b style={{color:props.arrayType=='e'?'red':'orange'}}>{listEntry[0]}</b> {(listEntry[1]>0?" (at character "+(listEntry[1]+1)+")":"")} {listEntry[2]?" in '"+listEntry[2]+"'":""} {listEntry[3]}</li>;
            })}
          </ul>
    );
}
<>
<b>Source (normalized)</b> <RenderLines text={chosenText} />
<b style={{color:result.errorList.length?'red':'green'}}>{result.errorList.length} error{result.errorList.length==1? '':'s'}</b>{result.errorList.length?':':''}
<RenderArray arrayType='e' />
<b style={{color:result.warningList.length?'orange':'green'}}>{result.warningList.length} warning{result.warningList.length==1? '':'s'}</b>{result.warningList.length?':':''}
<RenderArray arrayType='w' />
</>
```