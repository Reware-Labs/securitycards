# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: file handling

## file handling

### Configure Multipart Encoding and Validate File Uploads

**Use when**

Developing HTML forms or remote functions that accept file uploads to ensure binary payloads are correctly transmitted and validated.

**Secure rules**

**Rule 1: Explicitly set multipart encoding on forms containing file inputs and validate file fields on the server.**

Ensure that any HTML form handling file uploads includes `enctype="multipart/form-data"` to prevent the browser from silently dropping uploaded files during submission. Validate file inputs on the server using appropriate schema validators such as `v.file()`.

```svelte
<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
	<input type="file" name="document" />
	<button type="submit">Upload Document</button>
</form>
```
