# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: input contract definition

## input contract definition

### Enforce Strict Input Validation Contracts and Filter Unvalidated Request Attributes

**Use when**

Handling incoming HTTP requests and processing user input data against defined validation rules and contracts.

**Secure rules**

**Rule 1: Obtain request data exclusively via validated methods to reject unvalidated attributes and prevent mass assignment vulnerabilities.**

Always use `$validator->validated()` or `$request->validate()` to retrieve request data rather than accessing unvalidated input via `$request->all()`. The validated method guarantees that only fields defined in the validation rules array are returned, dropping undeclared attributes and preventing unexpected database modifications.

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'name' => 'required|string',
    'email' => 'required|email',
]);

if ($validator->fails()) {
    throw new \Illuminate\Validation\ValidationException($validator);
}

$safeData = $validator->validated();
User::create($safeData);
```

**Rule 2: Define complete validation contracts for precognitive and standard request submissions.**

Ensure complete server-side validation contracts are defined within `FormRequest` classes or request validation calls. Normal non-precognitive submissions must process the full validation rule set to prevent invalid or malicious payloads from bypassing validation during execution.

```php
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
        ];
    }
}
```

**Rule 3: Configure strict RFC validation to reject ambiguous email formats.**

Use `rfcCompliant(strict: true)` or `strict()` to enforce rigid RFC email validation and reject ambiguous input structures like comments, quoted spaces, or non-TLD domain literals, preventing parser differentials.

```php
$request->validate([
    'email' => ['required', Rule::email()->rfcCompliant(strict: true)],
]);
```

**Rule 4: Use array format for validation rules containing regex pipe characters.**

When defining validation rules that contain regular expressions with pipe characters, supply the rules as an array rather than a pipe-delimited string to prevent the `ValidationRuleParser` from splitting the regular expression and corrupting validation logic.

```php
$rules = [
    'type' => ['required', 'regex:/^(foo|bar)$/i'],
];
```
