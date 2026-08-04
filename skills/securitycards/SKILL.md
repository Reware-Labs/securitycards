---
name: securitycards
description: Use version-specific Security Cards guidance when starting a software project, building a security-sensitive feature, or reviewing code that uses supported open source libraries. Use it for secure defaults, authentication, authorization, input handling, injection, cryptography, file handling, network boundaries, secrets, sessions, and other security concerns that need library-specific rules.
---

# Security Cards

Use live, version-pinned guidance from `https://securitycards.rewarelabs.com` as the source of truth. Inspect and cite the guidance; do not treat this skill as an offline security knowledge base.

## Resolve dependencies

1. Inspect the project before selecting guidance. Identify the language, library, and exact resolved version from lockfiles or another reliable source for installed dependencies.
2. For a new project with no resolved dependencies, use the live catalog to show the supported versions. After the user selects a version, generate the lockfile or equivalent and verify the resolved version before applying its guidance.
3. Do not rely on a manifest range, requested version, or guessed version when a resolved version is available.
4. Fetch `https://securitycards.rewarelabs.com/catalog.json`. If that endpoint is unavailable, fetch `https://securitycards.rewarelabs.com/llms.txt` instead. Find an exact language, library, and version match. Normalize the version only when the match is unambiguous, such as treating `5.9.0` and `v5.9.0` as equal. Never select a nearby release. Use the URLs from the matched catalog entry instead of constructing download URLs from memory.

## Fail closed

- Do not follow an HTTP redirect from an unsupported or malformed version to the latest version and then apply that guidance as an exact match.
- Verify the final response URL and the selected catalog entry before using any card.
- When the exact version is absent, report the detected version and list the versions present in the live catalog. Stop applying Security Cards guidance for that dependency.
- Offer guidance for a different version only as clearly labeled, potentially incompatible context and only after the user approves it.
- When the live catalog or selected card cannot be fetched, do not make claims from the bundled snapshot. Read `references/catalog.json` only to report whether the dependency existed when the skill was packaged, label the snapshot as potentially stale, and state that live security guidance is unavailable.

## Select the narrowest guidance

- **Starting a project:** Fetch the exact version's `blueprintUrl` for every materially used supported library. Establish secure defaults from the blueprints before choosing architecture or writing integration code.
- **Implementing a feature:** Fetch only the category URLs that cover the feature. Use the exact version's `bundleUrl` only when several categories apply and reading them together is more reliable than individual cards.
- **Reviewing code:** Fetch the blueprint for overall posture when needed, then fetch category cards matching the reviewed code paths and threat boundaries.
- Prefer a single category card, then a blueprint, then a library bundle. Do not fetch a language bundle unless the task genuinely spans many libraries.

## Apply and verify

1. Read every applicable **Use when** and **secure rules** section.
2. For implementation, apply all relevant secure rules without weakening existing behavior or expanding the user's requested scope.
3. For review, compare the actual code against every applicable secure rule. Report only findings supported by the code, with the severity, affected code, impact, and a suggested fix.
4. Re-run relevant tests, static checks, or targeted verification after changes. Do not claim a rule is satisfied unless the relevant code was inspected or tested.
5. Include the canonical URL of every blueprint or card used. Mention unsupported dependencies and unavailable live guidance separately from confirmed findings.

## Completion checklist

- Read exact resolved dependency versions from the project.
- Confirm exact matches in the live catalog.
- Fetch the narrowest applicable live guidance.
- Apply the secure rules and verify the final code against them.
- Verify changes or findings against the final code.
- Cite every canonical Security Cards source used.
