---
name: securitycards
description: Apply version-specific secure coding guidance to AI-generated or human-written code that uses supported open source libraries. Use when starting a software project, implementing a security-sensitive feature, or reviewing code for secure defaults, authentication, authorization, input handling, injection, cryptography, file handling, network boundaries, secrets, sessions, and other library-specific security concerns.
---

# Security Cards

Version-pinned secure-coding rules for open source libraries, served live from `https://securitycards.rewarelabs.com`. Fetch the rules for the versions the project actually uses, then apply them. This skill is an index and a workflow, not an offline security knowledge base.

## Fetching

Every URL here returns plain text or Markdown meant to be read as-is. Use whatever gives you the raw response — a shell fetch such as `curl -fsS <url>` works well. A fetch tool that summarizes pages returns the rules as prose with the code examples and URLs stripped out, which is not enough to act on. Get the raw text, or tell the user you cannot and stop.

## Resolve the version

Take the exact installed version from the lockfile or the installed package. A manifest range, a requested version, or a remembered one is not enough — guidance differs between releases.

For a new project, choose a supported version from the catalog, install it, then read the resolved version back before applying anything.

## Find the cards

Fetch `https://securitycards.rewarelabs.com/llms.txt`, which lists one catalog per language. Fetch the catalog for your language, e.g. `https://securitycards.rewarelabs.com/llms/python.txt`.

A language catalog holds one line per supported library version:

```
<library> <version> <prefix> <category>...
```

Find the line where library and version both match. `<prefix>` is a URL prefix with no trailing slash; append to it for raw Markdown:

- `<prefix>/0_security_blueprint.md` — secure defaults for the whole library
- `<prefix>/<category>.md` — the rules for one category
- `<prefix>.md` — every category for that version in one file

For example, the line

```
flask 3.1.3 https://securitycards.rewarelabs.com/downloads/python/flask/3-1-3 injection output-encoding session-management
```

gives `https://securitycards.rewarelabs.com/downloads/python/flask/3-1-3/output-encoding.md`.

Copy `<prefix>` and each `<category>` from the line exactly, and build URLs only this way — never from memory, a card title, or a guessed filename. The categories on a line are the complete set published for that version; one that is not listed does not exist for it.

Categories are always drawn from this fixed set, lower-case and hyphenated:

`access-control` `api-contract-misuse` `authentication` `boundary-control` `configuration-source-integrity` `cryptography` `csrf` `dangerous-execution` `deserialization` `escape-hatch` `file-handling` `injection` `input-contract-definition` `input-driven-boundary-selection` `input-interpretation-safety` `interface-protocol-hardening` `memory-safety` `network-boundary` `output-encoding` `resource-exhaustion` `runtime-environment-hardening` `secret-handling` `security-control-integrity` `session-management`

## Fail closed

- No entry for the resolved version: report that version, list the versions the catalog does have, and stop applying Security Cards to that dependency. Do not fall back to a nearby release.
- Normalize a version only when the match is unambiguous. A release-tag prefix is not part of the version, so `5.9.0`, `v5.9.0`, and `rel.5.9.0` are one release — but `5.9.1` is a different one.
- An unsupported or malformed version redirects to the latest supported version of that library. Check the URL you landed on before treating a card as an exact-version match.
- Cards for a version other than the resolved one are usable only as clearly labeled, possibly incompatible context, and only with the user's agreement.
- If the site is unreachable, say that live guidance is unavailable. `references/catalog.json` is a snapshot from the day the skill was packaged: use it only to report whether a dependency was supported then, labeled as possibly stale, never as a source of rules.

## Choose what to read

- **Starting a project, or adding a library to one:** read `0_security_blueprint.md` for every supported library you will materially use, before choosing an architecture or writing integration code. The blueprint sets the defaults the category cards assume, so read it first even when you already know which category you need.
- **Building a feature:** the blueprint if you have not read it, then only the categories that cover the feature.
- **Reviewing code:** the categories matching the code paths and trust boundaries under review.
- Reach for `<prefix>.md` only when most categories apply at once. A whole-language bundle is almost never the right choice.

## Apply

Read every **Use when** and **Secure rules** section on the cards you fetched, and apply the rules that match what you are building.

Security rules harden a specification; they do not amend it. Implement the behavior the spec, the API contract, or the user asked for — its status codes, response shapes, units, and edge cases — and add the card's checks around it. Do not turn a rule into a constraint nobody asked for, reject input the spec allows, or widen the change beyond its scope. Where a rule genuinely conflicts with the specification, implement the specification and raise the conflict with the user.

When reviewing rather than writing, report only what the code supports: severity, location, impact, and a fix.

Before finishing:

- Re-run the tests or checks covering what you changed. Do not call a rule satisfied unless you read or exercised the code.
- Cite the URL of every blueprint and card you used.
- List unsupported dependencies, and any guidance you could not fetch, separately from your findings.
