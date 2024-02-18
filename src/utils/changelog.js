import open from 'open';
// eslint-disable-next-line import/no-unresolved
import { got } from 'got';
import jsonfile from 'jsonfile';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { colors } from './index.js';
import { getModuleInfo } from './package.js';

const { strong } = colors;
const { readFile } = jsonfile;

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = await readFile(resolve(__dirname, '..', '..', 'package.json'));
const COMMON_CHANGELOG_FILES = [
  'CHANGELOG.md',
  'History.md',
  'HISTORY.md',
  'CHANGES.md',
  'CHANGELOG'
];
const KNOWN_REPOSITORIES = {
  'github.com': (parsedRepositoryUrl) => {
    const repositoryId = /^(.+?\/.+?)(?:\/|\.git$|$)/.exec(
      parsedRepositoryUrl.pathname.slice(1)
    )[1];
    const rootUrl = `https://github.com/${repositoryId}`;

    return {
      repositoryId,
      fileUrlBuilder: (filename) => `${rootUrl}/blob/master/${filename}`,
      releasesPageUrl: `${rootUrl}/releases`
    };
  },
  'gitlab.com': (parsedRepositoryUrl) => {
    const repositoryId = /test/.exec(parsedRepositoryUrl.pathname.slice(1))[1];
    const rootUrl = `https://gitlab.com/${repositoryId}`;

    return {
      repositoryId,
      fileUrlBuilder: (filename) => `${rootUrl}/-/blob/master/${filename}`,
      releasesPageUrl: `${rootUrl}/-/releases`
    };
  },
  'bitbucket.org': (parsedRepositoryUrl) => {
    const repositoryId = /test/.exec(parsedRepositoryUrl.pathname.slice(1))[1];
    const rootUrl = `https://gitlab.com/${repositoryId}`;

    return {
      repositoryId,
      fileUrlBuilder: (filename) => `${rootUrl}/src/master/${filename}`,
      releasesPageUrl: `${rootUrl}/downloads?tab=tags`
    };
  }
};

export const getRepositoryInfo = (repositoryUrl) => {
  try {
    const parsedUrl = new URL(repositoryUrl);
    const { hostname } = parsedUrl;

    return KNOWN_REPOSITORIES[hostname]
      ? KNOWN_REPOSITORIES[hostname](parsedUrl)
      : null;
  } catch (error) {
    console.error(error);
  }

  return null;
};

const DEFAULT_REMOTE_CHANGELOGS_DB_URL = `https://raw.githubusercontent.com/${
  getRepositoryInfo(pkg.repository.url).repositoryId
}/master/db/changelogUrls.json`;

export const overridesPath = resolve(
  __dirname,
  '..',
  '..',
  'db',
  'changelogUrls.json'
);

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

export const findModuleChangelogUrl = async (
  moduleName,
  remoteChangelogUrlsDbUrl = DEFAULT_REMOTE_CHANGELOGS_DB_URL
) => {
  let changelogUrls;

  if (remoteChangelogUrlsDbUrl) {
    changelogUrls = await fetchRemoteDb(remoteChangelogUrlsDbUrl);
  }

  // todo: fix this
  changelogUrls = changelogUrls || (await readFile(overridesPath));

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
};

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
