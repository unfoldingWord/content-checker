import * as gitApi from '../../core/getApi';
// import * as util from '../../core/utilities';
// import Path from 'path';
import localforage from 'localforage';

const baseURL = 'https://git.door43.org/';

const rcStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'rc-store',
});


export async function getBlob(url) {
    console.log("getBlob("+url+")");
    // let data = null;
    // // test for already fetched
    // let x;
    // try {
    //     x = await rcStore.getItem(sha);
    // } catch (error) {
    //     const err = "rcStore.getItem() Error:" + error;
    //     throw new Error(err);
    // }
    // if ( x !== null ) {
    //     // already have it - no need to fetch
    //     continue;
    // }
    try {
        const data = await gitApi.getURL({url});
        console.log("getBlob("+url+") returning", data);
        return data;
        } catch(error) {
        const err = "getBlob() Error on:"+url+" is:"+error;
        throw new Error(err);
    }
    // try {
    //     await rcStore.setItem(sha,JSON.stringify(data));
    // } catch (error) {
    //     const err = "rcStore.setItem() Error:"+error;
    //     throw new Error(err);
    // }
    console.log("getBlob("+url+") returning", data);
    return null;
}
// end of function getBlob





/*async function getBlobs(treeMap) {
    let data = [];
    const params = 'per_page=9999'
    for ( const [k,v] of treeMap.entries() ) {
        let sha = v.sha;
        let uri = v.url;
        uri += '?per_page=99999'
        // test for already fetched
        let x;
        try {
            x = await rcStore.getItem(sha);
        } catch (error) {
            const err = "rcStore.getItem() Error:" + error;
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
            await rcStore.setItem(sha,JSON.stringify(data));
        } catch (error) {
            const err = "rcStore.setItem() Error:"+error;
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
        // in case a), always take the file for counting, no matter the type
        // in case b), restrict to count only expected file types for repo
        // case a) is detected by observing that the traversal path and
        // the path filterpath are the same size; that will be true only
        // if the user input was to a single file.

        let mkey = traversalpath.join('/');
        // Case A. URL is to a single file
        if ( traversalpath.length === filterpath.length ) {
            treeMap.set(mkey,tree[i])
        } else {
        // Case B. only count if it matches the expected filetype
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

export async function fetchRepo({ url })
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

    // Step 1. Identify all files that need to be counted
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
      "url": "https://git.door43.org/api/v1/repos/cecil.new/tD-DataRestructure/git/blobs/a8d3267bda97f7933e8ca2fe416d06f53ed05d77"
    }

    These values are iterated over and all the blobs are fetched, stored and
    the words counted. The word counts are added to the blob and the blob
    stored with the word count values.
    */

    /*
        Per requirements:
        - if repo ends with "_tn", then only count "tsv" files.
        - if repo ends with one of the following: "_ult", "_ust", "_ugnt", or "_uhb" ,then only count "usfm" files.
        otherwise, only count "md" files.
    */ /*
    let filetype = 'md';
    if ( repo.endsWith('_tn') ) {
        filetype = 'tsv';
    } else if ( repo.endsWith('_uhb') || repo.endsWith('_ugnt') || repo.endsWith('_ult') || repo.endsWith('_ust') ) {
        filetype = 'usfm';
    }
    //console.log("Repo expected filetype:",filetype);
    //console.log("treeRecursion() at ",Date.now())
    await treeRecursion(owner,repo,sha,pathfilter,filetype,traversalpath,treeMap);
    // Step 2. Fetch all the identified files
    //console.log("getBlobs() at ",Date.now())
    await getBlobs(treeMap);
    // Step 3. Do word counts on each identified file and grand totals
    //console.log("getWordCounts() at ",Date.now())
    let grandTotals = await getCheckResults(treeMap);
    let results = {};
    results.grandTotals = grandTotals;
    results.treeMap     = util.map_to_obj(treeMap);
    //console.log("Done at ",Date.now())
    return results;
}
*/