import fetch from 'node-fetch'

// Get target version from command line argument
const specifiedVersion = process.argv[2]

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const fetchOptions = GITHUB_TOKEN
  ? { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  : {}

// Show help if requested
if (specifiedVersion === '--help' || specifiedVersion === '-h') {
  console.log(`
Usage: node scripts/generate-release-log.mjs [version|range]

Generate a changelog for canary releases.

Arguments:
  version   Optional. The version to generate changelog for.
            Can be specified as:
            - "13.4.15" - generates for all 13.4.15 canaries
            - "v13.4.15" - same as above
            - "13.4.15:13.4.20" - generates from 13.4.15-canary.0 to latest 13.4.20 canary
            - "15.3.1:15.4.0-canary.130" - generates from 15.3.1-canary.0 to 15.4.0-canary.130
            If not specified, uses the latest canary version.

Environment Variables:
  GITHUB_TOKEN   Optional. GitHub personal access token for higher rate limits.

Examples:
  node scripts/generate-release-log.mjs                          # Use latest canary version
  node scripts/generate-release-log.mjs 13.4.15                  # Generate for 13.4.15 canaries
  node scripts/generate-release-log.mjs 15.3.1:15.4.0            # Generate from 15.3.1 to 15.4.0
  node scripts/generate-release-log.mjs 15.3.1:15.4.0-canary.130 # Generate up to specific canary
  
  # With authentication for higher rate limits:
  GITHUB_TOKEN=your_token node scripts/generate-release-log.mjs 15.3.1:15.4.0
`)
  process.exit(0)
}

// Helper function to normalize release data
function normalizeReleases(releases) {
  return releases.map(({ id, tag_name, created_at, body }) => ({
    id,
    tag_name,
    created_at,
    body: body
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((e) => e.trim()),
  }))
}

async function fetchReleasesUntilCanaryZero(targetVersionPrefix) {
  const allReleases = []
  let page = 1
  let hasMore = true
  let targetVersion = targetVersionPrefix || null
  let foundCanaryZero = false
  let latestRelease = null

  console.log('Fetching releases from GitHub...')
  if (GITHUB_TOKEN) {
    console.log('Using GitHub authentication for higher rate limits')
  }
  if (targetVersion) {
    console.log(`Looking for releases with version: ${targetVersion}`)
  }

  while (hasMore && !foundCanaryZero) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/vercel/next.js/releases?per_page=100&page=${page}`,
        fetchOptions
      )

      if (!response.ok) {
        throw new Error(
          `GitHub API returned ${response.status}: ${response.statusText}`
        )
      }

      const releases = await response.json()

      if (releases.length === 0) {
        hasMore = false
      } else {
        // Log the latest release on first page
        if (page === 1 && releases.length > 0 && !latestRelease) {
          latestRelease = releases[0]
          console.log(`Latest release: ${latestRelease.tag_name}`)
        }

        // Process releases to find target version and check for canary.0
        for (const release of releases) {
          allReleases.push(release)

          // Find the latest canary version pattern on first page (only if not specified)
          if (!targetVersion && /v.*?-canary/.test(release.tag_name)) {
            const match = /v(.*?-)/.exec(release.tag_name)
            if (match) {
              targetVersion = match[1]
              console.log(`Target version found: ${targetVersion}`)
            }
          }

          // Check if we've reached canary.0 for our target version
          if (
            targetVersion &&
            release.tag_name === `v${targetVersion}canary.0`
          ) {
            console.log(`Found ${release.tag_name} - stopping fetch`)
            foundCanaryZero = true
            break
          }
        }

        console.log(
          `Fetched page ${page} (${releases.length} releases, total: ${allReleases.length})`
        )
        page++

        // Check if we've hit the last page by looking at the Link header
        const linkHeader = response.headers.get('link')
        if (linkHeader && !linkHeader.includes('rel="next"')) {
          hasMore = false
        }

        // Add a small delay to be respectful to GitHub's API rate limits
        if (hasMore && !foundCanaryZero) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message)
      throw error
    }
  }

  console.log(`Finished fetching. Total releases: ${allReleases.length}`)
  return { allReleases, targetVersion }
}

async function fetchReleasesForRange(startVersion, endVersion) {
  const allReleases = []
  let page = 1
  let hasMore = true
  let foundStart = false
  let foundEnd = false
  let collectingReleases = false
  let latestRelease = null

  console.log('Fetching releases from GitHub...')
  if (GITHUB_TOKEN) {
    console.log('Using GitHub authentication for higher rate limits')
  }
  console.log(
    `Looking for releases from ${startVersion} to ${endVersion || 'latest'}`
  )

  while (hasMore && !foundStart) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/vercel/next.js/releases?per_page=100&page=${page}`,
        fetchOptions
      )

      if (!response.ok) {
        // GitHub returns 422 when pagination limit is reached
        if (response.status === 422) {
          console.log(`Reached GitHub API pagination limit at page ${page}`)
          hasMore = false
          break
        }
        throw new Error(
          `GitHub API returned ${response.status}: ${response.statusText}`
        )
      }

      const releases = await response.json()

      if (releases.length === 0) {
        hasMore = false
      } else {
        // Log the latest release on first page
        if (page === 1 && releases.length > 0 && !latestRelease) {
          latestRelease = releases[0]
          console.log(`Latest release: ${latestRelease.tag_name}`)
        }

        // Process releases to find our range
        for (const release of releases) {
          // Check if we've found our end point (newest release in range)
          if (
            !foundEnd &&
            endVersion &&
            release.tag_name === `v${endVersion}`
          ) {
            console.log(`Found end release: ${release.tag_name}`)
            foundEnd = true
            collectingReleases = true
          }

          // Collect releases if we're within the range
          if (collectingReleases) {
            allReleases.push(release)
          }

          // Check if this is our start point (oldest release in range)
          // Support various formats: 15.3.1, 15.3.1-canary.0, v15.3.1, etc.
          const normalizedStart = startVersion.startsWith('v')
            ? startVersion
            : `v${startVersion}`

          if (release.tag_name === normalizedStart) {
            console.log(`Found start release: ${release.tag_name}`)
            foundStart = true
            if (!collectingReleases) {
              // If we haven't started collecting yet, add this release
              allReleases.push(release)
            }
            break
          }
        }

        console.log(
          `Fetched page ${page} (${releases.length} releases, total collected: ${allReleases.length})`
        )
        page++

        // Check if we've hit the last page by looking at the Link header
        const linkHeader = response.headers.get('link')
        if (linkHeader && !linkHeader.includes('rel="next"')) {
          hasMore = false
        }

        // Add a small delay to be respectful to GitHub's API rate limits
        if (hasMore && !foundStart) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message)
      throw error
    }
  }

  if (!foundStart) {
    const normalizedStart = startVersion.startsWith('v')
      ? startVersion
      : `v${startVersion}`
    console.warn(
      `Warning: Did not find start release ${normalizedStart} (may have hit API limit)`
    )
    console.warn(`Generating changelog with available releases only`)
    console.warn(
      `\nTip: For large version ranges, consider breaking them into smaller chunks:`
    )
    console.warn(
      `  - First run: node scripts/generate-release-log.mjs 15.3.1-canary.0:15.3.5`
    )
    console.warn(
      `  - Then run: node scripts/generate-release-log.mjs 15.3.5:15.4.0-canary.130`
    )
    console.warn(`  - Manually combine the results`)
  }
  if (endVersion && !foundEnd) {
    console.warn(`Warning: Did not find end release v${endVersion}`)
  }

  // Reverse the array since we collected from newest to oldest
  allReleases.reverse()

  console.log(
    `Finished fetching. Total releases collected: ${allReleases.length}`
  )
  return allReleases
}

async function main() {
  let startVersion = null
  let endVersion = null
  let releases = []

  if (specifiedVersion) {
    // Check if it's a range (e.g., "15.3.1:15.4.0-canary.130")
    if (specifiedVersion.includes(':')) {
      const [start, end] = specifiedVersion.split(':')
      // Only remove the leading 'v' if present, preserve everything else
      startVersion = start.replace(/^v/, '')
      endVersion = end.replace(/^v/, '')

      console.log(
        `Generating changelog for range: ${startVersion} to ${endVersion}`
      )
      const allReleases = await fetchReleasesForRange(startVersion, endVersion)

      // Map the releases to the expected format (already in chronological order)
      releases = normalizeReleases(allReleases)
    } else {
      // Single version specified - use original logic
      let targetVersionPrefix = specifiedVersion
        .replace(/^v/, '')
        .replace(/-$/, '')
      targetVersionPrefix += '-'

      console.log(`Using specified version: ${targetVersionPrefix}`)
      const { allReleases: releasesArray, targetVersion } =
        await fetchReleasesUntilCanaryZero(targetVersionPrefix)

      releases = normalizeReleases(releasesArray)
        .filter((v) => v.tag_name.includes(targetVersion))
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    }
  } else {
    // No version specified - use latest canary series
    const { allReleases: releasesArray, targetVersion } =
      await fetchReleasesUntilCanaryZero(null)

    releases = normalizeReleases(releasesArray)
      .filter((v) => v.tag_name.includes(targetVersion))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  if (releases.length === 0) {
    console.error('No releases found for the specified criteria')
    process.exit(1)
  }

  const lineItems = {
    '### Core Changes': [],
    '### Minor Changes': [],
    '### Documentation Changes': [],
    '### Example Changes': [],
    '### Misc Changes': [],
    '### Patches': [],
    '### Credits': [],
  }

  // Pre-compile regex for better performance
  const githubUsernameRegex = /@[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}/gi

  Object.keys(lineItems).forEach((header) => {
    releases.forEach((release) => {
      const headerIndex = release.body.indexOf(header)

      if (headerIndex === -1) return

      let headerLastIndex = release.body
        .slice(headerIndex + 1)
        .findIndex((v) => v.startsWith('###'))

      if (headerLastIndex !== -1) {
        headerLastIndex = headerLastIndex + headerIndex
      } else {
        headerLastIndex = release.body.length - 1
      }

      if (header === '### Credits') {
        release.body.slice(headerIndex, headerLastIndex + 1).forEach((e) => {
          let m
          // Reset regex lastIndex for each new string
          githubUsernameRegex.lastIndex = 0

          do {
            m = githubUsernameRegex.exec(e)

            if (m) {
              lineItems[header].push(m.pop())
            }
          } while (m)
        })
      } else {
        release.body.slice(headerIndex, headerLastIndex + 1).forEach((e) => {
          if (!e.startsWith('-')) {
            return
          }
          lineItems[header].push(e)
        })
      }
    })
  })

  let finalMessage = []

  Object.keys(lineItems).forEach((header) => {
    let items = lineItems[header]

    if (!items.length) {
      return
    }
    finalMessage.push(header)
    finalMessage.push('')

    if (header === '### Credits') {
      items = [...new Set(items)]
      let creditsMessage = `Huge thanks to `

      if (items.length > 1) {
        creditsMessage += items.slice(0, items.length - 1).join(`, `)
        creditsMessage += `, and `
      }
      creditsMessage += items[items.length - 1]
      creditsMessage += ` for helping!`

      finalMessage.push(creditsMessage)
    } else {
      items.forEach((e) => finalMessage.push(e))
    }

    finalMessage.push('')
  })

  return {
    version:
      releases.length > 0
        ? `${releases[0].tag_name.replace(/^v/, '')} to ${releases[releases.length - 1].tag_name.replace(/^v/, '')}`
        : 'Unknown',
    firstVersion: releases.length > 0 ? releases[0].tag_name : 'Unknown',
    lastVersion:
      releases.length > 0 ? releases[releases.length - 1].tag_name : 'Unknown',
    content: finalMessage.join('\n'),
  }
}

main()
  .then((result) => {
    console.log(`\n=== Changelog for Next.js ${result.version} ===`)
    console.log(`From ${result.firstVersion} to ${result.lastVersion}\n`)
    console.log(result.content)
  })
  .catch((error) => {
    console.error('Error generating changelog:', error)
    process.exit(1)
  })
