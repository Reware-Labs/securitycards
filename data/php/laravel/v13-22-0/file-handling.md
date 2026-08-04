# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: file handling

## file handling

### Secure Static File Storage, Access Control, and Delivery

**Use when**

Configuring, storing, publishing, or serving static files and assets to ensure they remain protected against unauthorized disclosure, traversal, or modification.

**Secure rules**

**Rule 1: Restrict direct public access to sensitive static files by storing them with private visibility or serving them using temporary signed URLs.**

Explicitly define and manage visibility attributes for static files using `setVisibility()` or passing visibility options when writing files to prevent unauthorized direct web access. For sensitive assets, generate time-limited URLs using `Storage::temporaryUrl()` rather than exposing permanent public links.

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->put('user-docs/id.pdf', $fileContents, 'private');

$temporaryUrl = Storage::disk('s3')->temporaryUrl(
    'confidential/statement.pdf',
    now()->addMinutes(15)
);
```

**Rule 2: Store user-provided static files using randomized hashes and restrict storage directories to designated paths.**

Store user-provided static files using `Storage::putFile()` rather than user-supplied filenames directly to avoid path traversal, overwrites, and predictable file path guessing. Additionally, ensure custom public path configurations point strictly to isolated public directories and never to root or application configuration folders.

```php
$path = Storage::disk('uploads')->putFile('avatars', $request->file('avatar'));
```

**Rule 3: Enforce read-only mode and secure streamed responses for static file disks and controller downloads.**

Configure `'read-only' => true` on filesystem disk instances dedicated to serving immutable static files and public assets to prevent unauthorized mutations or file deletion. When serving files through controller endpoints, use `Storage::response()` or `Storage::download()` to automatically sanitize headers, handle MIME types, and apply safe ASCII fallback filtering.

```php
$staticDisk = $filesystemManager->build([
    'driver' => 'local',
    'read-only' => true,
    'root' => storage_path('app/public/static'),
    'url' => config('app.url').'/storage/static',
    'visibility' => 'public',
]);

return Storage::disk('local')->download('exports/report.pdf', 'user_report.pdf');
```


### Validate Uploaded Files with Strict Constraints

**Use when**

Handling file uploads from user requests to ensure proper file size and type validation.

**Secure rules**

**Rule 1: Apply explicit validation rules to uploaded files to check size and allowed types.**

Use validation rules such as `file`, `mimes`, `mimetypes`, `max`, or `dimensions` on uploaded files to automatically verify `UploadedFile::isValid()` and handle PHP upload size limits correctly.

```php
$validator = Validator::make($request->all(), [
    'avatar' => 'required|file|mimes:jpeg,png|max:2048',
]);

if ($validator->fails()) {
    return response()->json($validator->errors(), 422);
}
```
