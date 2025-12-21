import fs from 'fs';
import pathToReg from 'path-to-regexp';
import { validTypes } from './constants.js';
function normalizeName(name) {
    return name.replace(/[^\w\.-@]/g, '');
}
function normalizeValue(value) {
    const ret = value
        .replace(/(\*\/$|\s*$)/g, '')
        .trim()
        .replace(/(^"|"$)/g, '');
    switch (ret) {
        case 'true':
            return true;
        case 'false':
            return false;
        case '0':
            return 0;
        case '1':
            return 1;
        default:
            return ret;
    }
}
function isValidType(type) {
    return Boolean(type && validTypes.includes(type));
}
function fixRoutePath(str) {
    // console.log('testPath', path);
    const arr = str
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
        .filter(path => pathToReg.match(path))
        .map(x => '/' + x.replace(/(^\/|\/$)/g, ''));
    return arr.length > 1 ? arr : arr.pop();
}
const extractor = {
    '@type'(acc, value) {
        acc.type = normalizeValue(value);
    },
    path(acc, value) {
        acc.path = fixRoutePath(value);
    },
    depends(acc, value) {
        acc.depends = value.split(',').map(x => x.trim());
    }
};
function fixBooleanValue(end, defaultValue = false) {
    switch (end) {
        case '0':
            return false;
        case 'false':
            return false;
        case 'no':
            return false;
        default:
            return defaultValue;
    }
}
export default function getCommentedInfo(filename) {
    const lines = fs.readFileSync(filename, { encoding: 'utf8' }).split('\n');
    const candidates = [];
    let found = false;
    for (let i = 0; i < lines.length; ++i) {
        if (!lines[i]) {
            // avoid empty line
        }
        else if (lines[i].startsWith('/*')) {
            found = true;
            candidates.push(lines[i]);
            if (/\*\/\s*$/.test(lines[i]))
                break;
        }
        else if (found) {
            candidates.push(lines[i]);
            if (/\*\/\s*$/.test(lines[i]))
                break;
        }
        else {
            break;
        }
    }
    if (!candidates.length)
        return false;
    const result = {};
    for (let i = 0; i < candidates.length; i++) {
        const line = candidates[i];
        const position = line.indexOf(':');
        if (position < 1)
            continue;
        const key = normalizeName(line.substring(0, position));
        const value = line.substring(position + 1);
        if (extractor[key]) {
            extractor[key](result, value);
        }
        else {
            result[key] = normalizeValue(value);
        }
    }
    if (!result.type || !isValidType(result.type)) {
        return false;
    }
    return result;
}
