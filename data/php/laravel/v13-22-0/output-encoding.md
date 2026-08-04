# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: output encoding

## output encoding

### Verify HTML output encoding in HTTP response tests

**Use when**

Writing feature tests to verify that rendered response content is properly HTML-escaped by default in Laravel applications.

**Secure rules**

**Rule 1: Use assertSee to verify that dynamic content is properly HTML-escaped by default.**

When writing feature tests for rendered response content using `TestResponse`, use `assertSee` and `assertSeeText` to verify that dynamic content is properly HTML-escaped by default. Reserve `assertSeeHtml` specifically for testing intended unescaped HTML structure.

```php
$response = $this->get('/profile');

// Asserts that 'Alice & Bob' is rendered as 'Alice &amp; Bob' in the response HTML
$response->assertSee('Alice & Bob');

// Use assertSeeHtml only when asserting expected unescaped raw HTML markup
$response->assertSeeHtml('<span class="badge">Active</span>');
```
