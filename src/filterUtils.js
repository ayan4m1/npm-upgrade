import _ from 'lodash';
import fp from 'lodash/fp.js';

const { flow, split, compact, partition } = fp;

export function globToRegexp(glob, flags) {
  const regexp = glob.split(/\*+/).map(_.escapeRegExp).join('.*?');

  return new RegExp(`^${regexp}$`, flags);
}

export function makeFilterFunction(filterStr = '') {
  let [excludeFilters, includeFilters] = flow(
    split(/\s+/),
    compact,
    partition((filter) => filter[0] === '!')
  )(filterStr);

  if (!includeFilters.length) {
    includeFilters.push('*');
  }

  includeFilters = includeFilters
    .map((filter) => globToRegexp(filter, 'i'))
    .map((filterRegexp) => (str) => filterRegexp.test(str));

  excludeFilters = excludeFilters
    .map((filter) => globToRegexp(filter.slice(1), 'i'))
    .map((filterRegexp) => (str) => filterRegexp.test(str));

  return (str) =>
    excludeFilters.every((filter) => !filter(str)) &&
    includeFilters.some((filter) => filter(str));
}
