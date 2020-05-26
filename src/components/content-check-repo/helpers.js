import * as gitApi from '../../core/getApi';
import * as util from '../../core/utilities';
import Path from 'path';
import { doBasicTextChecks } from '../../core';
import localforage from 'localforage';

const baseURL = 'https://git.door43.org/';

const ccstore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'cc-store',
});


async function getCheckResults(treeMap) {
    let allWords = [];
    let allL1Counts = 0;
    for ( const [k,v] of treeMap.entries() ) {
        let sha = v.sha;
        //let uri = v.url;
        let blob;
        try {
            blob = await ccstore.getItem(sha);
        } catch (error) {
            const err = "wcstore.getItem() Error:"+error;
            throw new Error(err);
        }
        blob = JSON.parse(blob);
        let content;
        try {
            content = atob(blob.content);
        } catch(error) {
            const err = "atob() Error on:"+k+" is:"+error;
            throw new Error(err);
        }
        let ext = k.split('.').pop();
        let format = "string";
        if ( ext === "md" ) {
            format = "markdown";
        } else if ( ext === "tsv" ) {
            format = "utn";
        } else if ( ext === "usfm" ) {
            format = "usfm";
        }
        let results = doBasicTextChecks('File', content, -1, format);
        for (let i=0; i < results.allWords.length; i++) {
            allWords.push(results.allWords[i])
        }
        allL1Counts += results.l1count;
        // now update the blob with content check results
        blob.path          = k;
        blob.total         = results.total;
        blob.distinct      = results.distinct;
        blob.l1count       = results.l1count;
        blob.allWords      = results.allWords;
        blob.wordFrequency = results.wordFrequency;
        try {
            await ccstore.setItem(sha,JSON.stringify(blob));
        } catch (error) {
            const err = "wcstore.setItem() Error:"+error;
            throw new Error(err);
        }
        //console.log(k," Totals:",results.total)
    }
    let results = doBasicTextChecks('String', allWords.join('\n'), -1, "string");
    results.l1count = allL1Counts;
    return results;
}

async function getBlobs(treeMap) {
    let data = [];
    const params = 'per_page=9999'
    for ( const [k,v] of treeMap.entries() ) {
        let sha = v.sha;
        let uri = v.url;
        uri += '?per_page=99999'
        // test for already fetched
        let x;
        try {
            x = await ccstore.getItem(sha);
        } catch (error) {
            const err = "wcstore.getItem() Error:" + error;
            throw new Error(err);
        }
        if ( x !== null ) {
            // already have it - no need to fetch
            continue;
        }
        try {
            data = await gitApi.getURL({uri});
        } catch(error) {
            const err = "getBlob() Error on:"+k+" is:"+error;
            throw new Error(err);
        }
        try {
            await ccstore.setItem(sha,JSON.stringify(data));
        } catch (error) {
            const err = "wcstore.setItem() Error:"+error;
            throw new Error(err);
        }
    }
}

async function treeRecursion(owner,repo,sha,filterpath,filetype,traversalpath,treeMap) {
    const uri = Path.join('api/v1/repos', owner, repo, 'git/trees', sha);
    let result;
    try {
        result = await fetch(baseURL+uri);
    } catch(error) {
        const err = "treeRecursion() Error:"+error;
        console.error(err);
        throw new Error(err);
    }
    let _tree = await result.json();
    let tree  = _tree.tree;

    let max = filterpath.length;
    if ( max === undefined ) max = 0;

    for ( let i=0; i < tree.length; i++ ) {
        let tpath = tree[i].path;
        traversalpath.push(tpath)
        //console.log("Traversal:",traversalpath.join('/'))
        if ( max !== 0 ) {
            // Here we see if the need to prune the tree
            // by only traversing where the user input directs us

            // first get the min of input filter array size
            // and the traversal array size
            let tsize = traversalpath.length;
            if ( tsize === undefined ) tsize = 0;
            if ( tsize < max ) {
                max = tsize
            }
            let recurseFlag = true;
            for ( let i=0; i < max; i++ ) {
                if ( filterpath[i] === traversalpath[i] ) continue;
                recurseFlag = false;
                break;
            }
            // if we have a mismatch, then prune by not recursing
            if ( ! recurseFlag ) {
                traversalpath.pop();
                continue;
            };
        }
        if (tree[i].type === 'tree') {
            await treeRecursion(owner,repo,
                tree[i].sha,
                filterpath, filetype,
                traversalpath,
                treeMap
            );
            traversalpath.pop();
            continue;
        }

        // at this point, we are looking at a file
        // Two cases:
        // a) the user input explicitly points to a single file
        // b) the user input was entire repo or a folder in repo
        // in case a), always take the file for checking, no matter the type
        // in case b), restrict to check only expected file types for repo
        // case a) is detected by observing that the traversal path and
        // the path filterpath are the same size; that will be true only
        // if the user input was to a single file.

        let mkey = traversalpath.join('/');
        // Case A. URL is to a single file
        if ( traversalpath.length === filterpath.length ) {
            treeMap.set(mkey,tree[i])
        } else {
        // Case B. only check if it matches the expected filetype
            let ext  = mkey.split('/').pop().split('.').pop();
            if ( ext === filetype ) {
                treeMap.set(mkey,tree[i])
            }
        }
        // pop the path array and continue to next one in tree
        traversalpath.pop();
    }
    if ( treeMap.size === 0 ) {
        const err = "No matching files with provided URL";
        throw new Error(err);
    }
    return;
}

export async function fetchContentCheckRepo({ url })
{
    if ( ! url.startsWith(baseURL) ) {
        throw new Error("URL must begin with "+baseURL);
    }
    url = url.replace(/\/$/,'');
    let lengthOfBaseURL = baseURL.length;
    let ownerRepoPath   = url.substring(lengthOfBaseURL);
    let ownerEnd        = ownerRepoPath.indexOf('/');
    let owner           = ownerRepoPath.substring(0,ownerEnd);
    let repoEnd         = ownerRepoPath.indexOf('/',ownerEnd+1);
    let repo            = ownerRepoPath.substring(ownerEnd+1, repoEnd);
    let pathfilter      = ownerRepoPath.substring(repoEnd+1).split('/');
    if (repoEnd === -1 ) {
        repo = ownerRepoPath.substring(ownerEnd+1);
        pathfilter = []
    }
    const sha           = 'master';
    let traversalpath   = [];

    // Step 1. Identify all files that need to be checked
    let treeMap = new Map();
    /*
    The key will be the full path to the file.
    The value will be an object like this:
    {
      "path": "README.md",
      "mode": "100644",
      "type": "blob",
      "size": 498,
      "sha": "a8d3267bda97f7933e8ca2fe416d06f53ed05d77",
      "url": "https://git.door43.org/api/v1/repos/tx-manager-test-data/tD-DataRestructure/git/blobs/a8d3267bda97f7933e8ca2fe416d06f53ed05d77"
    }

    These values are iterated over and all the blobs are fetched, stored and
    the words checked. The content checks are added to the blob and the blob
    stored with the content check values.
    */

    /*
        Per requirements:
        - if repo ends with "_tn", then only check "tsv" files.
        - if repo ends with one of the following: "_ult", "_ust", "_ugnt", or "_uhb" ,then only check "usfm" files.
        otherwise, only check "md" files.
    */
    let filetype = "md";
    if ( repo.endsWith('_tn') ) {
        filetype = "tsv";
    } else if ( repo.endsWith('_uhb') || repo.endsWith('_ugnt') || repo.endsWith('_ult') || repo.endsWith('_ust') ) {
        filetype = 'usfm';
    }
    //console.log("Repo expected filetype:",filetype);
    //console.log("treeRecursion() at ",Date.now())
    await treeRecursion(owner,repo,sha,pathfilter,filetype,traversalpath,treeMap);
    // Step 2. Fetch all the identified files
    //console.log("getBlobs() at ",Date.now())
    await getBlobs(treeMap);
    // Step 3. Do content checks on each identified file and grand totals
    //console.log("getContentChecks() at ",Date.now())
    let grandTotals = await getCheckResults(treeMap);
    let results = {};
    results.grandTotals = grandTotals;
    results.treeMap     = util.map_to_obj(treeMap);
    //console.log("Done at ",Date.now())
    return results;
}
