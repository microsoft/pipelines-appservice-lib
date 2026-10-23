# File request retries

Path-backed `fs.ReadStream` bodies are reopened before each retry. A partially consumed
stream can remain readable after an early HTTP response or connection failure, so retrying
it must start from the original byte range. Retries retain the stream's encoding and read
buffer size, and retire the previous stream. The configured retry statuses, errors,
backoff and attempt budget continue to apply.

# Publishing new version

Update the package version in package.json and run `npm run dist`.