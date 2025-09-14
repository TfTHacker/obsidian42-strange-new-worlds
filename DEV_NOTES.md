# Updating the version

1. update package.json version number
2. npm run version (updates the manifest and version file)
3. npm install (updates package-lock.json)
4. commit repo
5. npm run githubaction (commits the version number tag to the repo and pushes it, which kicks of the github action to prepare the release)
