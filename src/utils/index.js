import inquirer from 'inquirer';

const { prompt } = inquirer;

export function toSentence(items) {
  if (items.length <= 1) {
    return items[0] || '';
  }

  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

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

export function getRepositoryInfo(repositoryUrl) {
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
}

export async function askUser(question) {
  return (await prompt([{ ...question, name: 'answer' }])).answer;
}

export function sortObjectKeysAlphabetically(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b))
  );
}
