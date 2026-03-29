import type { Contributor } from '@/types'

interface GitHubContributorsResponse {
  data?: {
    repository?: {
      defaultBranchRef?: {
        target: {
          history: {
            edges: Array<{
              node: {
                author?: {
                  user?: {
                    login: string
                    avatarUrl: string
                    name: string | null
                    followers: { totalCount: number }
                    repositories: { totalCount: number }
                  }
                }
              }
            }>
          }
        }
      }
    }
  }
}

export default async function getContributors(
  owner: string,
  repo: string,
): Promise<Contributor[] | null> {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100) {
                edges {
                  node {
                    author {
                      user {
                        login
                        avatarUrl
                        name
                        followers {
                          totalCount
                        }
                        repositories {
                          totalCount
                        }
                      }
                    }
                  }
                }
              }
            }
          }
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

  const result: GitHubContributorsResponse = await response.json()

  if (!result.data?.repository?.defaultBranchRef) {
    return null
  }

  const commits = result.data.repository.defaultBranchRef.target.history.edges
  const contributionsMap = new Map<string, Contributor>()

  commits.forEach(({ node }) => {
    if (node.author?.user) {
      const { login, avatarUrl, name, followers, repositories } = node.author.user
      if (!contributionsMap.has(login)) {
        contributionsMap.set(login, {
          login,
          avatar_url: avatarUrl,
          name: name ?? login,
          followers: followers.totalCount,
          public_repos: repositories.totalCount,
          contributions: 0,
        })
      }
      contributionsMap.get(login)!.contributions += 1
    }
  })

  return Array.from(contributionsMap.values())
}
