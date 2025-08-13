DEV_NOTES.MD

# Updating the version

1. update package.json version number
2. npm run version (updates the manifest and version file)
3. commit repo
4. npm run githubaction (commits the version number tag to the repo and pushes it, which kicks of the github action to prepare the release)

# Development environment with Nix

If you are using Nix, a Flake file is provided which can be used to setup your development environment.
To enter the environment, run `nix develop`
Alternatively, you can install the `direnv` tool, which will enter the environment automatically using the `.envrc` configuration.
