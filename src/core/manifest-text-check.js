// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { checkYAMLText } from './yaml-text-check';
import { cachedGetFile, getFileListFromZip } from './getApi';
import { BibleBookData, testament } from './books/books'
import Ajv from 'ajv';
import { removeDisabledNotices } from './disabled-notices';
// eslint-disable-next-line no-unused-vars
import { debugLog, functionLog, parameterAssert, logicAssert } from './utilities';


const MANIFEST_VALIDATOR_VERSION_STRING = '0.4.6';

// Pasted in 2020-10-02 from https://raw.githubusercontent.com/unfoldingWord/dcs/master/options/schema/rc.schema.json
// Updated 2021-02-19
// Now March 2021 it's moved to https://github.com/unfoldingWord/rc-schema/blob/master/rc.schema.json
// TODO: Load the latest one dynamically
const MANIFEST_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema",
    "$id": "https://resource-container.readthedocs.io/schema/rc.schema.json",
    "$$target": [
        "rc.schema.json#/definitions/languageTag",
        "rc.schema.json#/definitions/localizedText"
    ],
    "title": "Root",
    "type": "object",
    "required": [
        "dublin_core",
        "checking",
        "projects"
    ],
    "properties": {
        "dublin_core": {
            "$id": "#root/dublin_core",
            "title": "Dublin_core",
            "type": "object",
            "required": [
                "conformsto",
                "contributor",
                "creator",
                "description",
                "format",
                "identifier",
                "issued",
                "language",
                "modified",
                "publisher",
                "relation",
                "rights",
                "source",
                "subject",
                "title",
                "type",
                "version"
            ],
            "properties": {
                "conformsto": {
                    "$id": "#root/dublin_core/conformsto",
                    "title": "Conformsto",
                    "type": "string",
                    "default": "rc0.2",
                    "enum": [
                        "rc0.2"
                    ]
                },
                "contributor": {
                    "$id": "#root/dublin_core/contributor",
                    "title": "Contributor",
                    "type": "array",
                    "default": [],
                    "items": {
                        "$id": "#root/dublin_core/contributor/items",
                        "title": "Items",
                        "type": "string",
                        "default": "",
                        "examples": [
                            "Alrick G. Headley, M.Div., Th.M."
                        ]
                    }
                },
                "creator": {
                    "$id": "#root/dublin_core/creator",
                    "title": "Creator",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "unfoldingWord"
                    ]
                },
                "description": {
                    "$id": "#root/dublin_core/description",
                    "title": "Description",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "An open-licensed update of the ASV, intended to provide a 'form-centric' understanding of the Bible. It increases the translator's understanding of the lexical and grammatical composition of the underlying text by adhering closely to the word order and structure of the originals."
                    ]
                },
                "format": {
                    "$id": "#root/dublin_core/format",
                    "$ref": "#/definitions/mimeType",
                    "title": "Format",
                    "default": ""
                },
                "identifier": {
                    "$id": "#root/dublin_core/identifier",
                    "title": "Identifier",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "ult"
                    ],
                    "pattern": "^[a-z][a-z0-9-]"
                },
                "issued": {
                    "$id": "#root/dublin_core/issued",
                    "$ref": "#/definitions/timestamp",
                    "title": "Issued",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "2020-03-25"
                    ]
                },
                "modified": {
                    "$id": "#root/dublin_core/modified",
                    "$ref": "#/definitions/timestamp",
                    "title": "Modified",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "2020-03-25"
                    ]
                },
                "publisher": {
                    "$id": "#root/dublin_core/publisher",
                    "title": "Publisher",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "unfoldingWord"
                    ]
                },
                "language": {
                    "$id": "#root/dublin_core/language",
                    "title": "Language",
                    "type": "object",
                    "required": [
                        "direction",
                        "identifier",
                        "title"
                    ],
                    "properties": {
                        "identifier": {
                            "$id": "#root/dublin_core/language/identifier",
                            "$ref": "#/definitions/languageTag",
                            "title": "Identifier",
                            "examples": ["en", "hi", "es-419"]
                        },
                        "title": {
                            "$id": "#root/dublin_core/language/title",
                            "title": "Title",
                            "type": "string",
                            "default": ""
                        },
                        "direction": {
                            "$id": "#root/dublin_core/language/direction",
                            "title": "Direction",
                            "type": "string",
                            "default": "ltr",
                            "enum": ["ltr", "rtl"]
                        }
                    }
                },
                "relation": {
                    "$id": "#root/dublin_core/relation",
                    "title": "Relation",
                    "type": "array",
                    "default": [],
                    "items": {
                        "$id": "#root/dublin_core/relation/items",
                        "$ref": "#/definitions/relationItem",
                        "title": "Items",
                        "default": "",
                        "examples": [
                            "en/tw"
                        ]
                    }
                },
                "rights": {
                    "$id": "#root/dublin_core/rights",
                    "title": "Rights",
                    "type": "string",
                    "default": "CC BY-SA 4.0",
                    "enum": [
                        "CC BY 3.0",
                        "CC BY-SA 3.0",
                        "CC BY-SA 4.0",
                        "Free Translate 2.0 International Public License",
                        "Public Domain"
                    ]
                },
                "source": {
                    "$id": "#root/dublin_core/source",
                    "title": "Source",
                    "type": "array",
                    "default": [],
                    "items": {
                        "$id": "#root/dublin_core/source/items",
                        "title": "Items",
                        "type": "object",
                        "required": [
                            "identifier",
                            "language",
                            "version"
                        ],
                        "properties": {
                            "identifier": {
                                "$id": "#root/dublin_core/source/items/identifier",
                                "title": "Identifier",
                                "type": "string",
                                "default": "",
                                "examples": [
                                    "asv"
                                ],
                                "pattern": "^[a-z][a-z0-9-]"
                            },
                            "language": {
                                "$id": "#root/dublin_core/source/items/language",
                                "$ref": "#/definitions/languageTag",
                                "title": "Language",
                                "default": "",
                                "examples": [
                                    "en"
                                ]
                            },
                            "version": {
                                "$id": "#root/dublin_core/source/items/version",
                                "title": "Version",
                                "type": "string",
                                "default": "",
                                "examples": [
                                    "1901"
                                ]
                            }
                        }
                    }

                },
                "subject": {
                    "$id": "#root/dublin_core/subject",
                    "title": "Subject",
                    "type": "string",
                    "enum": [
                        "Aligned Bible",
                        "Bible",
                        "Bible stories",
                        "Greek New Testament",
                        "Hebrew Old Testament",
                        "OBS Study Notes",
                        "OBS Study Questions",
                        "OBS Translation Notes",
                        "OBS Translation Questions",
                        "Open Bible Stories",
                        "Study Notes",
                        "Study Questions",
                        "Translation Academy",
                        "Translation Notes",
                        "Translation Questions",
                        "Translation Words",
                        "TSV Study Notes",
                        "TSV Study Questions",
                        "TSV Translation Notes",
                        "TSV Translation Questions",
                        "TSV Translation Words Links",
                        "TSV OBS Study Notes",
                        "TSV OBS Study Questions",
                        "TSV OBS Translation Notes",
                        "TSV OBS Translation Questions",
                        "TSV OBS Translation Words Links",
                    ]
                },
                "title": {
                    "$id": "#root/dublin_core/title",
                    "title": "Title",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "unfoldingWord® Literal Text"
                    ]
                },
                "type": {
                    "$id": "#root/dublin_core/type",
                    "title": "Type",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "bundle"
                    ],
                    "enum": ["book", "bundle", "dict", "help", "man"]
                },
                "version": {
                    "$id": "#root/dublin_core/version",
                    "title": "Version",
                    "type": "string",
                    "default": "",
                    "examples": [
                        "10"
                    ]
                }
            }
        },
        "checking": {
            "$id": "#root/checking",
            "title": "Checking",
            "type": "object",
            "required": [
                "checking_entity",
                "checking_level"
            ],
            "properties": {
                "checking_entity": {
                    "$id": "#root/checking/checking_entity",
                    "title": "Checking_entity",
                    "type": "array",
                    "default": [],
                    "items": {
                        "$id": "#root/checking/checking_entity/items",
                        "title": "Items",
                        "type": "string",
                        "default": "",
                        "examples": [
                            "unfoldingWord"
                        ]
                    }
                },
                "checking_level": {
                    "$id": "#root/checking/checking_level",
                    "title": "Checking_level",
                    "type": ["integer", "string"],
                    "default": "1",
                    "enum": [
                        "1",
                        "2",
                        "3"
                    ]
                }
            }
        },
        "projects": {
            "$id": "#root/projects",
            "title": "Projects",
            "type": "array",
            "default": [],
            "items": {
                "$id": "#root/projects/items",
                "title": "Items",
                "type": "object",
                "required": [
                    "title",
                    "identifier",
                    "path"
                ],
                "properties": {
                    "title": {
                        "$id": "#root/projects/items/title",
                        "title": "Title",
                        "type": "string",
                        "default": "",
                        "examples": [
                            "Genesis"
                        ]
                    },
                    "versification": {
                        "$id": "#root/projects/items/versification",
                        "title": "Versification",
                        "type": ["string", "null"],
                        "default": null,
                        "examples": [
                            "ufw"
                        ],
                        "enum": ["avd", "odx", "odx-hr", "other", "rsc", "ufw", "ufw-bn", "ufw-ml", "ufw-odx", "ufw-rev", "obs", "", null]
                    },
                    "identifier": {
                        "$id": "#root/projects/items/identifier",
                        "$ref": "#/definitions/projectIdentifier",
                        "title": "Identifier",
                        "default": ""
                    },
                    "sort": {
                        "$id": "#root/projects/items/sort",
                        "title": "Sort",
                        "type": "integer",
                        "default": 0
                    },
                    "path": {
                        "$id": "#root/projects/items/path",
                        "$ref": "#/definitions/path",
                        "title": "Path",
                        "examples": [
                            "./01-GEN.usfm"
                        ]
                    },
                    "categories": {
                        "$id": "#root/projects/items/categories",
                        "title": "Categories",
                        "type": ["array", "null"],
                        "default": [],
                        "items": {
                            "$id": "#root/projects/items/categories/items",
                            "title": "Items",
                            "type": "string",
                            "enum": [
                                "bible-ot",
                                "bible-nt",
                                "ta"
                            ]
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "languageTag": {
            "type": "string",
            "pattern": "^(((en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((([A-Za-z]{2,3}(-([A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-([A-Za-z]{4}))?(-([A-Za-z]{2}|[0-9]{3}))?(-([A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-([0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(x(-[A-Za-z0-9]{1,8})+))?)|(x(-[A-Za-z0-9]{1,8})+))$",
            "minLength": 2,
            "description": "A valid IETF language tag as specified by BCP 47."
        },
        "localizedText": {
            "type": "object",
            "additionalProperties": {
                "$ref": "#/definitions/trimmedText"
            },
            "propertyNames": {
                "$ref": "#/definitions/languageTag"
            },
            "minProperties": 1,
            "description": "A textual string specified in one or multiple languages, indexed by IETF language tag."
        },
        "mimeType": {
            "type": "string",
            "pattern": "^[\\-a-z0-9]+/[\\-a-z0-9+]+$",
            "description": "An IANA media type (also known as MIME type)"
        },
        "path": {
            "type": "string",
            "pattern": "^[^\\/:?*\"><|]+(/[^\\/:?*\"><|]+)*$",
            "description": "A file path, delimited by forward slashes."
        },
        "projectIdentifier": {
            "type": "string",
            "enum": [
                "gen",
                "exo",
                "lev",
                "num",
                "deu",
                "jos",
                "jdg",
                "rut",
                "1sa",
                "2sa",
                "1ki",
                "2ki",
                "1ch",
                "2ch",
                "ezr",
                "neh",
                "est",
                "job",
                "psa",
                "pro",
                "ecc",
                "sng",
                "isa",
                "jer",
                "lam",
                "ezk",
                "dan",
                "hos",
                "jol",
                "amo",
                "oba",
                "jon",
                "mic",
                "nam",
                "hab",
                "zep",
                "hag",
                "zec",
                "mal",
                "mat",
                "mrk",
                "luk",
                "jhn",
                "act",
                "rom",
                "1co",
                "2co",
                "gal",
                "eph",
                "php",
                "col",
                "1th",
                "2th",
                "1ti",
                "2ti",
                "tit",
                "phm",
                "heb",
                "jas",
                "1pe",
                "2pe",
                "1jn",
                "2jn",
                "3jn",
                "jud",
                "rev",
                "obs",
                "obs-sn",
                "obs-sq",
                "obs-tn",
                "obs-tq",
                "intro",
                "process",
                "translate",
                "checking",
                "bible"
            ]
        },
        "relationItem": {
            "type": "string",
            "pattern": "^(((en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((([A-Za-z]{2,3}(-([A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-([A-Za-z]{4}))?(-([A-Za-z]{2}|[0-9]{3}))?(-([A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-([0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(x(-[A-Za-z0-9]{1,8})+))?)|(x(-[A-Za-z0-9]{1,8})+))/[a-z][a-z0-9-]*(\\?v=[0-9][a-z0-9\\._-]*)*$",
            "minLength": 4,
            "description": "A relation has valid IETF language tag as specified by BCP 47 and a valid resource, separated with a slash."
        },
        "timestamp": {
            "type": "string",
            "pattern": "^[12][0-9]{3}(-[01][0-9](-[0123][0-9])?)?$"
        },
        "trimmedText": {
            "type": "string",
            "pattern": "^\\S(.*\\S)?$",
            "description": "A string without surrounding whitespace characters."
        },
        "url": {
            "type": "string",
            "pattern": "^((http(s)?|ftp)://)[^\\s$]+$",
            "minLength": 1,
            "description": "A valid **Uniform Resource Locator**.",
            "examples": ["https://example.com"]
        }
    }
};


const ajv = new Ajv();
const validate = ajv.compile(MANIFEST_SCHEMA);


/**
 *
 * @param {string} languageCode -- language of main thing being checked -- normally the same as the first part of the repoName, e.g., 'en', but may differ for original language repos
 * @param {string} repoCode -- e.g., 'UHB', 'LT', 'TN', 'SQ2'
 * @param {string} username -- or orgname -- owner of DCS repo
 * @param {string} repoName -- e.g., 'en_tn'
 * @param {string} repoBranch -- e.g., 'master'
 * @param {string} manifestText -- contents of manifest.yaml
 * @param {string} givenLocation -- optional description of location of manifest
 * @param {Object} checkingOptions -- optional option key:value pairs
 */
export async function checkManifestText(languageCode, repoCode, username, repoName, repoBranch, manifestText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    See the specification at https://resource-container.readthedocs.io/en/latest/manifest.html.

    Returns a result object containing a successList and a noticeList
    */
    // functionLog(`checkManifestText(${languageCode}, ${repoCode}, ${username}, ${repoName}, ${repoBranch}, ${manifestText.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkManifestText: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkManifestText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(repoCode !== undefined, "checkManifestText: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkManifestText: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkManifestText: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(username !== undefined, "checkManifestText: 'username' parameter should be defined");
    //parameterAssert(typeof username === 'string', `checkManifestText: 'username' parameter should be a string not a '${typeof username}': ${username}`);
    //parameterAssert(repoName !== undefined, "checkManifestText: 'repoName' parameter should be defined");
    //parameterAssert(typeof repoName === 'string', `checkManifestText: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
    if (repoCode !== 'UHB' && repoCode !== 'UGNT') { //parameterAssert(repoName.startsWith(languageCode), `checkManifestText: 'repoName' parameter '${repoName}' should start with language code: '${languageCode}_'`);
    }
    //parameterAssert(repoBranch !== undefined, "checkManifestText: 'repoBranch' parameter should be defined");
    //parameterAssert(typeof repoBranch === 'string', `checkManifestText: 'repoBranch' parameter should be a string not a '${typeof repoBranch}': ${repoBranch}`);
    //parameterAssert(manifestText !== undefined, "checkManifestText: 'manifestText' parameter should be defined");
    //parameterAssert(typeof manifestText === 'string', `checkManifestText: 'manifestText' parameter should be a string not a '${typeof manifestText}': ${manifestText}`);
    //parameterAssert(givenLocation !== undefined, "checkManifestText: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkManifestText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    //parameterAssert(givenLocation.indexOf('true') === -1, `checkManifestText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkManifestText: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkManifestText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (mfcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const cmtResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkManifestText success: ${successString}`);
        cmtResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // functionLog(`checkManifestText Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cManT addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cManT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cManT addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cManT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cManT addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cManT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cManT addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cManT addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cManT addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cManT addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        if (repoName) noticeObject.repoName = repoName;
        if (noticeObject.debugChain) noticeObject.debugChain = `checkManifestText ${noticeObject.debugChain}`;
        cmtResult.noticeList.push(noticeObject);
    }


    function ourYAMLTextChecks(textName, manifestText, givenLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cManT ourYAMLTextChecks(${textName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        //parameterAssert(textName !== undefined, "cManT ourYAMLTextChecks: 'textName' parameter should be defined");
        //parameterAssert(typeof textName === 'string', `cManT ourYAMLTextChecks: 'textName' parameter should be a string not a '${typeof textName}'`);
        //parameterAssert(manifestText !== undefined, "cManT ourYAMLTextChecks: 'manifestText' parameter should be defined");
        //parameterAssert(typeof manifestText === 'string', `cManT ourYAMLTextChecks: 'manifestText' parameter should be a string not a '${typeof manifestText}'`);
        // //parameterAssert( allowedLinks===true || allowedLinks===false, "cManT ourYAMLTextChecks: allowedLinks parameter must be either true or false");

        const cYtResultObject = checkYAMLText('en', repoCode, textName, manifestText, givenLocation, checkingOptions);

        // Concat is faster if we don’t need to process each notice individually
        cmtResult.successList = cmtResult.successList.concat(cYtResultObject.successList);
        cmtResult.noticeList = cmtResult.noticeList.concat(cYtResultObject.noticeList);
        return cYtResultObject.formData;
    }
    // end of ourYAMLTextChecks function


    // Main code for checkManifestText function
    const formData = ourYAMLTextChecks(repoName, manifestText, ourLocation, checkingOptions);
    if (formData) {
        // debugLog("formData", JSON.stringify(formData));
        const formDataKeys = Object.keys(formData);
        // debugLog("formData keys", JSON.stringify(formDataKeys));

        if (formDataKeys.indexOf('dublin_core') < 0)
            addNotice({ priority: 928, message: "'dublin_core' key is missing", location: ourLocation });
        if (formDataKeys.indexOf('projects') < 0)
            addNotice({ priority: 929, message: "'projects' key is missing", location: ourLocation });
        if (formDataKeys.indexOf('checking') < 0)
            addNotice({ priority: 148, message: "'checking' key is missing", location: ourLocation });

        // Check Dublin Core stuff
        // const DublinCoreData = formData.dublin_core
        // debugLog("checkManifestText DublinCoreData", JSON.stringify(DublinCoreData));


        try {
            const languageIdentifier = formData['dublin_core']['language']['identifier'];
            if ((repoCode === 'UHB' && languageIdentifier !== 'hbo')
                || (repoCode === 'UGNT' && languageIdentifier !== 'el-x-koine')
                || (repoCode !== 'UHB' && repoCode !== 'UGNT' && languageIdentifier !== languageCode)) // for most repos
                addNotice({ priority: 933, message: "Manifest' language' 'identifier' doesn't match", details: `expected '${languageCode}' but manifest has '${languageIdentifier}'`, location: ourLocation });
        } catch (e) {
            debugLog(`checkManifestText got error ${e.message} while loading 'language' 'identifier'`);
            addNotice({ priority: 934, message: "'language' key or 'idenfier' subkey is missing", location: ourLocation });
        }

        // TODO: We could add a lot more checking here
        // for (const mainKey in formData) {
        //     userLog("mainKey", typeof mainKey, mainKey);
        //     const mainSection = formData[mainKey];
        //     userLog("mainSection", typeof mainSection, JSON.stringify(mainSection));
        //     for (const key2 in mainSection) {
        //         userLog(mainKey, "key2", typeof key2, key2);
        //         const section2 = mainSection[key2];
        //         userLog(mainKey, "section2", typeof section2, JSON.stringify(section2));

        //     }
        // }

        // Validate Resource Container manifest against the schema
        //  using AJV from https://www.npmjs.com/package/ajv
        const valid = validate(formData);
        if (!valid) {
            // debugLog("checkManifestText validationResult", valid, JSON.stringify(validate.errors));
            // Here's a typical error entry:
            //  {"keyword":"pattern",
            //   "dataPath":".dublin_core.source[0].identifier",
            //   "schemaPath":"#/properties/dublin_core/properties/source/items/properties/identifier/pattern",
            //   "params":{"pattern":"^[a-z][a-z0-9-]"},
            //   "message":"should match pattern \"^[a-z][a-z0-9-]\""}
            for (const errorObject of validate.errors) {
                // debugLog("checkManifestText schema validation errorObject", JSON.stringify(errorObject));
                // Can’t give a lineNumber unfortunately
                addNotice({ priority: 985, message: `Field does not match schema ${errorObject.keyword}`, details: errorObject.message, fieldName: errorObject.dataPath, location: ourLocation });
            }
        }

        // Check that the project files in the manifest actually exist
        const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
        let haveOTbooks = false, haveNTbooks = false;
        const ourProjectPathList = []; // Make a list for the next check
        for (const projectEntry of formData['projects']) {
            // debugLog(`Manifest project: ${JSON.stringify(projectEntry)}`);
            const projectKeys = Object.keys(projectEntry); // Expect title, versification, identifier, sort, path, categories
            // debugLog("Project keys", JSON.stringify(projectKeys));
            for (const keyName of ['identifier', 'path', 'sort'])
                // TODO: What about 'title', 'versification', 'categories' -- are they not compulsory
                if (projectKeys.indexOf(keyName) === -1)
                    addNotice({ priority: 939, message: "Key is missing for project", details: keyName, excerpt: JSON.stringify(projectEntry), location: ourLocation });
            let whichTestament;
            try {
                whichTestament = testament(projectEntry['identifier']); // returns 'old' or 'new' for valid Bible books
            } catch { }
            if (whichTestament === 'old') haveOTbooks = true;
            else if (whichTestament === 'new') haveNTbooks = true;


            const projectFilepath = projectEntry['path'];
            ourProjectPathList.push(projectFilepath);
            if (repoName
                && projectFilepath !== './content' // Ignore this common folder path
                && projectFilepath !== './bible' // Ignore this common folder path
                && projectFilepath !== './intro' && projectFilepath !== './process' && projectFilepath !== './translate' && projectFilepath !== './checking') { // Ignore these TA folder paths
                if (!checkingOptions || checkingOptions?.disableAllLinkFetchingFlag !== true) { // Try fetching the file maybe
                    let isBookFolder = false;
                    for (const thisBookID of Object.keys(BibleBookData))
                        if (projectFilepath === `./${thisBookID.toLowerCase()}`) { isBookFolder = true; break; }
                    if (!isBookFolder) {
                        let projectFileContent;
                        try {
                            projectFileContent = await getFile_({ username, repository: repoName, path: projectFilepath, branch: repoBranch });
                            // debugLog("Fetched manifest project fileContent for", repoName, projectFilepath, typeof projectFileContent, projectFileContent.length);
                            if (!projectFileContent)
                                addNotice({ priority: 938, message: `Unable to find project file mentioned in manifest`, excerpt: projectFilepath, location: ourLocation });
                            else if (projectFileContent.length < 10)
                                addNotice({ priority: 937, message: `Linked project file seems empty`, excerpt: projectFilepath, location: ourLocation });
                        } catch (trcGCerror) {
                            addNotice({ priority: 936, message: `Error loading manifest project link`, details: trcGCerror, excerpt: projectFilepath, location: ourLocation });
                        }
                    }
                }
            }
        }

        // Check that the project files in the repo are included in the manifest
        // Use ourProjectPathList created by the above check
        // debugLog(`checkManifestText got projectPathList: (${ourProjectPathList.length}) ${ourProjectPathList}`);
        const repoFileList = await getFileListFromZip({ username, repository: repoName, branchOrRelease: repoBranch }); // not using optionalPrefix
        // debugLog(`checkManifestText got repoFileList: (${repoFileList.length}) ${repoFileList}`);
        for (const repoFilepath of repoFileList)
            if (repoFilepath.endsWith('.tsv')
                || repoFilepath.endsWith('.usfm')
                || (repoFilepath.endsWith('.md') && repoFilepath !== 'LICENSE.md' && repoFilepath !== 'README.md')) {
                const adjRepoFilepath = `./${repoFilepath.split('/')[0]}`; // TQ manifest only lists folders so change '1co/01/02.md' to './1co'
                // debugLog(`  Checking ${adjRepoFilepath} from repoFileList`);
                if (ourProjectPathList.indexOf(repoFilepath) === -1 && ourProjectPathList.indexOf(adjRepoFilepath) === -1) {
                    // debugLog(`    Seems we couldn't find ${repoFilepath} in the manifest`);
                    addNotice({ priority: 832, message: `Seems filename is missing from the manifest project list`, excerpt: repoFilepath, location: ourLocation });
                }
            }

        if (repoCode === 'TWL' || repoCode === 'TN' || repoCode === 'TN2') {
            // Check that the necessary relation fields are present
            const relationList = []; // Make a list for the next check
            let haveUHB = false, haveUGNT = false;
            try {
                for (const relation of formData['dublin_core']['relation']) {
                    // debugLog(`${repoCode} manifest relation: ${relation}`);
                    relationList.push(relation);
                    if (relation.startsWith('hbo/uhb')) haveUHB = true;
                    if (relation.startsWith('el-x-koine/ugnt')) haveUGNT = true;
                }
            } catch (e) {
                debugLog(`checkManifestText got error ${e.message} while loading 'relation' fields`);
                addNotice({ priority: 930, message: "'relation' key is missing", location: ourLocation });
            }
            if (haveOTbooks && !haveUHB)
                addNotice({ priority: 817, message: `UHB 'relation' is missing`, details: JSON.stringify(relationList), location: ourLocation });
            if (haveNTbooks && !haveUGNT)
                addNotice({ priority: 816, message: `UGNT 'relation' is missing`, details: JSON.stringify(relationList), location: ourLocation });
        }
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkManifestText: calling removeDisabledNotices(${cmtResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        cmtResult.noticeList = removeDisabledNotices(cmtResult.noticeList);
    }

    // addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}${ourLocation}.`);
    if (cmtResult.noticeList.length)
        addSuccessMessage(`checkManifestText v${MANIFEST_VALIDATOR_VERSION_STRING} finished with ${cmtResult.noticeList.length ? cmtResult.noticeList.length.toLocaleString() : "zero"} notice${cmtResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkManifestText v${MANIFEST_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkManifestText returning with ${cmtResult.successList.length.toLocaleString()} success(es), ${cmtResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkManifestText result is", JSON.stringify(cmtResult));
    return cmtResult;
}
// end of checkManifestText function
