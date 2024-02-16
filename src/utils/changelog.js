import open from 'open';
// eslint-disable-next-line import/no-unresolved
import { got } from 'got';

import { strong } from './colors.js';
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

export const fetchRemoteDb = async (url = DEFAULT_REMOTE_CHANGELOGS_DB_URL) => {
  try {
    const response = await got(url);
    const result = await response.json();

    console.dir(result);

    return result;
  } catch (err) {
    return null;
  }
};

export async function findModuleChangelogUrl(
  moduleName,
  remoteChangelogUrlsDbUrl = DEFAULT_REMOTE_CHANGELOGS_DB_URL
) {
  let changelogUrls;

  if (remoteChangelogUrlsDbUrl) {
    changelogUrls = await fetchRemoteDb(remoteChangelogUrlsDbUrl);
  }

  // todo: fix this
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

    console.dir(fileUrlBuilder);

    if (fileUrlBuilder) {
      const possibleChangelogUrls = COMMON_CHANGELOG_FILES.map(fileUrlBuilder);

      try {
        const [url] = (
          await Promise.allSettled(
            possibleChangelogUrls.map((url) =>
              got(url)
                .json()
                .then(() => url)
            )
          )
        )
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);

        if (url) {
          return url;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (releasesPageUrl) {
      try {
        // Checking `releasesUrl`...
        await got(releasesPageUrl).text();
        // `releasesUrl` is fine
        return releasesPageUrl;
      } catch (err) {
        // `releasesPageUrl` is broken
        console.error(err);
      }
    }
  }

  return null;
}

export const openAndFindChangelog = async (packageName) => {
  console.log(`Trying to find changelog URL for ${strong(packageName)}...`);
  try {
    const changelogUrl = await findModuleChangelogUrl(packageName);

    if (!changelogUrl) {
      console.log('No URL found, giving up!');
      process.exit(1);
    }

    console.log(`Opening ${strong(changelogUrl)}...`);
    try {
      open(changelogUrl);

      return changelogUrl;
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  } catch (err) {
    if (err.code === 'E404') {
      console.log("Couldn't find info about this module in npm registry");
      process.exit(404);
    } else {
      console.log(
        `Sorry, we haven't found any changelog URL for this module.
        It would be great if you could fill an issue about this here: ${strong(pkg.bugs.url)}
        Thanks a lot!`
      );
    }
  }

  return null;
};
