interface GitHubStarsResponse {
  data?: {
    repository?: {
      stargazers: {
        totalCount: number
      }
    }
  }
}

export default async function getRepoStars(
  owner: string,
  repo: string,
): Promise<number | null> {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        stargazers {
          totalCount
        }
      }
    }
  `

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  })

  const result: GitHubStarsResponse = await response.json()

  if (!result.data?.repository) {
    return null
  }

  return result.data.repository.stargazers.totalCount
}
