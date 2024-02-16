import _ from 'lodash';
import got from 'got';

import { getModuleInfo } from './package.js';
import { getRepositoryInfo } from './index.js';

const pkg = await import('../../package.json');

const COMMON_CHANGELOG_FILES = [
  'CHANGELOG.md',
  'History.md',
  'HISTORY.md',
  'CHANGES.md',
  'CHANGELOG'
];
const CURRENT_REPOSITORY_ID = getRepositoryInfo(
  pkg.repository.url
).repositoryId;
const DEFAULT_REMOTE_CHANGELOGS_DB_URL = `https://raw.githubusercontent.com/${CURRENT_REPOSITORY_ID}/master/db/changelogUrls.json`;

export const fetchRemoteDb = _.memoize(
  async (url = DEFAULT_REMOTE_CHANGELOGS_DB_URL) => {
    try {
      const response = await got(url, { json: true });

      return response.body;
    } catch (err) {
      return null;
    }
  }
);

export async function findModuleChangelogUrl(
  moduleName,
  remoteChangelogUrlsDbUrl = DEFAULT_REMOTE_CHANGELOGS_DB_URL
) {
  let changelogUrls;

  if (remoteChangelogUrlsDbUrl) {
    changelogUrls = await fetchRemoteDb(remoteChangelogUrlsDbUrl);
  }

  changelogUrls =
    changelogUrls || (await import('../../db/changelogUrls.json'));

  if (changelogUrls[moduleName]) {
    return changelogUrls[moduleName];
  }

  const { changelog, repository } = await getModuleInfo(moduleName);

  if (changelog) {
    return changelog;
  }

  if (repository && repository.url) {
    // If repository is located on one of known hostings, then we will try to request
    // some common changelog files from there or return URL for "Releases" page
    const { fileUrlBuilder, releasesPageUrl } =
      getRepositoryInfo(repository.url) || {};

    if (fileUrlBuilder) {
      const possibleChangelogUrls = _.map(
        COMMON_CHANGELOG_FILES,
        fileUrlBuilder
      );

      try {
        const rawResults = await Promise.allSettled(
          possibleChangelogUrls.map((url) => got(url))
        )
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value.json);
        const rawResponses = await Promise.allSettled(rawResults);
        const url = rawResponses.find(
          (responseResult) => responseResult.status === 'fulfilled'
        );

        return url;
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }

    if (releasesPageUrl) {
      try {
        // Checking `releasesUrl`...
        await got(releasesPageUrl);
        // `releasesUrl` is fine
        return releasesPageUrl;
      } catch (err) {
        // `releasesPageUrl` is broken
      }
    }
  }

  return null;
}
