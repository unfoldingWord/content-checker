import Path from 'path';
import YAML from 'js-yaml-parser';
import localforage from 'localforage';
import { setup } from 'axios-cache-adapter';
import JSZip from 'jszip';

const baseURL = 'https://git.door43.org/';
const apiPath = 'api/v1';

const cacheStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'web-cache',
});

const zipStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'zip-store',
});


const Door43Api = setup({
  baseURL: baseURL,
  cache: {
    store: cacheStore,
    maxAge: 5 * 60 * 1000, // 5-minutes
    exclude: { query: false },
    key: req => {
      // if (req.params) debugger
      let serialized = req.params instanceof URLSearchParams ?
      req.params.toString() : JSON.stringify(req.params) || '';
      return req.url + serialized;
    },
  },
});


export async function clearCaches() {
  console.log("Clearing localforage.INDEXEDDB zipStore and cacheStore caches…");
  const tasks = [zipStore, cacheStore].map(clear);
  const results = await Promise.all(tasks);
  results.forEach(x => console.log("Done it", x));
  // await zipStore.clear();
  // await cacheStore.clear();
}


/*
const resourceRepositories = ({languageId}) => {
  return {
    obs: languageId + '_obs',
    'obs-tn': languageId + '_obs-tn',
    'obs-tq': languageId + '_obs-tq',
    'obs-sn': languageId + '_obs-sn',
    'obs-sq': languageId + '_obs-sq',
    ult: languageId + '_ult',
    ust: languageId + '_ust',
    irv: languageId + '_irv',
    ulb: languageId + '_ulb',
    udb: languageId + '_udb',
    tn: languageId + '_tn',
    ta: languageId + '_ta',
    tw: languageId + '_tw',
    ugnt: 'el-x-koine_ugnt',
    uhb: 'hbo_uhb',
    ugl: languageId + '_ugl',
    uhal: languageId + '_uhal',
  };
};
*/

/*
async function fetchResourceManifests({username, languageId}) {
  let manifests = {};
  const _resourceRepositories = resourceRepositories({languageId});
  const resourceIds = Object.keys(_resourceRepositories);
  const promises = resourceIds.map(resourceId => {
    const repository = _resourceRepositories[resourceId];
    const _username = ['ugnt','uhb'].includes(resourceId) ? 'unfoldingword' : username;
    return fetchManifest({username: _username, repository})
  });
  const manifestArray = await Promise.all(promises);
  resourceIds.forEach((resourceId, index) => {
    manifests[resourceId] = manifestArray[index];
  });
  return manifests;
};


async function fetchManifest({username, repository}) {
  console.log(`fetchManifest(${username}, ${repository})…`);
  const yaml = await getFile({username, repository, path: 'manifest.yaml'});
  const json = (yaml) ? YAML.safeLoad(yaml) : null;
  return json;
};
*/

// https://git.door43.org/unfoldingword/en_ult/raw/branch/master/manifest.yaml
export async function fetchFileFromServer({username, repository, path, branch='master'}) {
  console.log(`fetchFileFromServer(${username}, ${repository}, ${path}, ${branch})…`);
  const repoExists = await repositoryExists({username, repository});
  if (repoExists) {
    const uri = Path.join(username, repository, 'raw/branch', branch, path);
    try {
      //console.log("URI=",uri);
      const data = await get({uri});
      return data;
    }
    catch(error) {
      return null;
    }
  } else {
    //console.log("REPO does not exist!", repository)
    return null;
  }
};

export async function getFile({username, repository, path, branch}) {
  console.log(`getFile(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  file = await getFileFromZip({username, repository, path, branch});
  if (!file) {
    file = await fetchFileFromServer({username, repository, path, branch});
  }
  return file;
}


async function getUID({username}) {
  console.log(`getUID(${username})…`);
  const uri = Path.join(apiPath, 'users', username);
  const user = await get({uri});
  const {id: uid} = user;
  console.log(`  returning: ${uid}`);
  return uid;
}
async function repositoryExists({username, repository}) {
  console.log(`repositoryExists(${username}, ${repository})…`);
  const uid = await getUID({username});
  const params = { q: repository, uid };
  const uri = Path.join(apiPath, 'repos', `search`);
  const {data: repos} = await get({uri, params});
  const repo = repos.filter(repo => repo.name === repository)[0];
  console.log(`  returning: ${!!repo}`);
  return !!repo;
};


export async function get({uri, params}) {
  console.log(`get(${uri}, ${params})…`);
  const {data} = await Door43Api.get(baseURL+uri, { params });
  // console.log(`  returning: ${data}`);
  return data;
};

export async function getURL({uri, params}) {
  console.log(`getURL(${uri}, ${params})…`);
  const {data} = await Door43Api.get(uri, { params });
  // console.log(`  returning: ${data}`);
  return data;
};


/*
function fetchRepositoriesZipFiles({username, languageId, branch}) {
  const repositories = resourceRepositories({languageId});
  const promises = Object.values(repositories).map(repository => {
    return fetchRepositoryZipFile({username, repository, branch});
  });
  const zipArray = await Promise.all(promises);
  return zipArray;
};
*/

/*
// https://git.door43.org/unfoldingWord/en_ult/archive/master.zip
function fetchRepositoryZipFile({username, repository, branch}) {
  const repoExists = await repositoryExists({username, repository});
  if (!repoExists) {
    return null;
  }
  const uri = zipUri({username, repository, branch});
  const response = await fetch(uri);
  if (response.status === 200 || response.status === 0) {
    const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
    await zipStore.setItem(uri, zipArrayBuffer);
    return true;
  } else {
    return false;
  }
};
*/

async function getFileFromZip({username, repository, path, branch}) {
  console.log(`getFileFromZip(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  const uri = zipUri({username, repository, branch});
  const zipBlob = await zipStore.getItem(uri);
  try {
    if (zipBlob) {
      console.log("  Got zipBlob");
      const zip = await JSZip.loadAsync(zipBlob);
      const zipPath = Path.join(repository.toLowerCase(), path);
      file = await zip.file(zipPath).async('string');
      console.log(`    Got zipBlob ${file}`);
    }
    else console.log("  No zipBlob");
  } catch(error) {
    console.log(`  Nope: ${error}`);
    file = null;
  }
  return file;
};


function zipUri({username, repository, branch='master'}) {
  console.log(`zipUri(${username}, ${repository}, ${branch})…`);
  const zipPath = Path.join(username, repository, 'archive', `${branch}.zip`);
  const zipUri = baseURL + zipPath;
  return zipUri;
};


export async function fetchTree({username, repository, sha='master'}) {
  console.log(`fetchTree(${username}, ${repository}, ${sha})…`);
  try {
    const uri = Path.join('api/v1/repos', username, repository, 'git/trees', sha);
    console.log(`  uri='${uri}'`);
    const data = await get({uri});
    console.log(`  data (${typeof data})`);
    return data;
    const tree = JSON.parse(data); // RJH: Why was this here???
    console.log(`  tree (${typeof tree})`);
    return tree;
  } catch(error) {
    console.log(`fetchTree ERROR: ${error}`);
    console.log(`  Data was: ${JSON.stringify(data)}`);
    return null;
  }
};


/*
async function recursiveTree({username, repository, path, sha}) {
  console.log("recurse tree args:",username,repository,path,sha)
  let tree = {};
  const pathArray = path.split();
  const results = fetchTree({username, repository, sha});
  const result = results.tree.filter(item => item.path === pathArray[0])[0];
  if (result) {
    if (result.type === 'tree') {
      const childPath = pathArray.slice(1).join('/');
      const children = recursiveTree({username, repository, path: childPath, sha: result.sha});
      tree[result.path] = children;
    } else if (result.type === 'blob') {
      tree[result.path] = true;
    }
  }
};

async function fileExists({username, repository, path, branch}) {
  // get root listing
  recursiveTree()
  // get recursive path listing
}
*/