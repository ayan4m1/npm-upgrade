import _ from 'lodash';
import { resolve } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import detectIndent from 'detect-indent';

import { loadPackageJson } from './package.js';

const PROJECT_CONFIG_FILENAME = '.npm-upgrade.json';

const path = Symbol('path');
const storedData = Symbol('storedData');
const read = Symbol('read');
const getData = Symbol('getData');

export default class Config {
  constructor(opts) {
    const { projectRoot } = opts || {};
    this[path] = resolve(projectRoot || process.cwd(), PROJECT_CONFIG_FILENAME);
    this[storedData] = this[read]();
    _.assign(this, _.cloneDeep(this[storedData]));
  }

  save() {
    const data = this[getData]();

    if (_.isEqual(data, this[storedData])) return;

    try {
      if (_.isEmpty(data)) {
        this.remove();
      } else {
        const { source: packageSource } = loadPackageJson();
        const { indent } = detectIndent(packageSource);

        writeFileSync(this[path], JSON.stringify(data, null, indent));
      }
    } catch (err) {
      err.message = `Unable to update npm-upgrade config file: ${err.message}`;
      throw err;
    }
  }

  remove() {
    try {
      if (existsSync(this[path])) {
        unlinkSync(this[path]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  [read]() {
    try {
      return require(this[path]);
    } catch {
      return {};
    }
  }

  [getData]() {
    const data = { ...this };
    return cleanDeep(data);
  }
}

function cleanDeep(obj) {
  _.each(obj, (val, key) => {
    if (_.isObjectLike(val)) {
      cleanDeep(val);
      if (_.isEmpty(val)) {
        delete obj[key];
      }
    } else if (val === null || val === undefined) {
      delete obj[key];
    }
  });

  return obj;
}
