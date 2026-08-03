# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: input driven boundary selection

## input driven boundary selection

### Validate and Restrict FastCGI SplitPath Configurations to ASCII

**Use when**

Configuring FastCGI script execution boundaries and split paths where untrusted input or Unicode characters could lead to boundary confusion.

**Secure rules**

**Rule 1: Specify pure ASCII substrings for FastCGI split_path configurations.**

When configuring `split_path` for FastCGI script execution, ensure you only specify pure ASCII substrings such as `.php`. Non-ASCII code points are rejected during module provisioning because Unicode equivalence and case folding can lead to misidentified script boundaries and potential remote code execution.

```json
{
	"transport": {
		"protocol": "fastcgi",
		"split_path": [".php"]
	}
}
```
