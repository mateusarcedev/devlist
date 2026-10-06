# Security Policy

## Supported version

Tools4.tech is currently maintained from the latest version of the `main` branch.

## Reporting a vulnerability

Please do **not** disclose exploitable vulnerabilities in a public issue.

Use GitHub's private vulnerability reporting / Security Advisory flow for this repository when available. Include:

- affected route, component, or package;
- steps to reproduce;
- expected impact;
- any proof-of-concept needed to understand the issue;
- suggested remediation, if you have one.

Please avoid accessing data that does not belong to you, disrupting the service, or testing against third-party systems without authorization.

## Scope

Security-sensitive areas include:

- GitHub OAuth;
- JWT access and refresh token handling;
- HTTP-only cookies;
- admin authorization;
- API ownership checks;
- PostgreSQL access;
- Docker and production environment configuration.

Dependencies are also monitored through the normal dependency and CI workflow.
