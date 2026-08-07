# Security Cards

[![Install Security Cards](https://skills.sh/b/Reware-Labs/securitycards)](https://skills.sh/Reware-Labs/securitycards)

Security Cards is an open source collection of library-specific security guidance for developers and AI coding agents. The cards are tied to specific library versions, so developers and agents can use guidance that matches the code they are working on.

Each card says when it applies, then gives secure rules and code examples. You can browse the cards by language, library, version, and security category.

The cards are available at [securitycards.rewarelabs.com](https://securitycards.rewarelabs.com).

> [!IMPORTANT]
> Security Cards can help with security work, but it is not a replacement for a professional security review. Read the [disclaimer](https://securitycards.rewarelabs.com/disclaimer/) for details.

## Use Security Cards as a skill

The `securitycards` skill lets a coding agent look up and apply cards while it works. Install it with either `npx` or the GitHub CLI.

The skill is instruction-only: it contains no executable scripts and requires no API keys. It fetches guidance from the public Security Cards catalog and cites the cards it applies.

With `npx`:

```bash
npx skills add Reware-Labs/securitycards --skill securitycards -g
```

With the GitHub CLI:

```bash
gh skill install Reware-Labs/securitycards securitycards --scope user
```

Remove `-g` from the `npx` command if you only want the skill in the current project.

Once installed, mention the skill in your prompt. It reads the project's lockfiles to find the dependency versions in use, looks for matching cards, and cites any guidance it applies. If the site does not have cards for that exact version, the skill stops instead of quietly using a different one.

## Example use cases

### Establish secure defaults for a new project

```text
Use Security Cards to set secure defaults for this project.
```

### Implement a security-sensitive feature

```text
Use Security Cards while implementing this file-upload endpoint. Apply the relevant rules and link to the cards you used.
```

### Review existing code

```text
Review this authentication service using Security Cards. Only report issues you can verify in the code, and link to each card you used.
```

The [agent usage guide](https://securitycards.rewarelabs.com/agent-usage.md) describes the full workflow and lists the machine-readable resources available to agents.

## Local development

To run the website locally or contribute changes, you will need Node.js 22.12 or later and npm.

```bash
git clone https://github.com/Reware-Labs/securitycards.git
cd securitycards
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

Run the full set of checks with:

```bash
npm run validate
```
