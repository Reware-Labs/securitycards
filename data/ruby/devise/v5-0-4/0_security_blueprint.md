# Security blueprint

Repository: `https://github.com/heartcombo/devise#v5.0.4`

## Security posture

The library establishes a comprehensive authentication and session management framework that relies on Warden to secure application boundaries by default. Developers must assume responsibility for correctly configuring scoping, credential verification, token lifecycles, and input bounds, as misconfigurations can lead to session fixation, open redirects, or timing vulnerabilities. Security-sensitive surfaces include authentication endpoints, parameter parsing, token verification, and redirection handlers, all of which should fail closed when presented with unvalidated or malformed inputs.

## Essential implementation rules

1. **Enforce Role and Scope Authentication Filters**

Protect administrative and sensitive controller actions by declaring `before_action` filters using `authenticate_<mapping>!` to interrupt unauthorized access. Use routing helpers like `authenticate` and `authenticated` to enforce role-based access directly at the routing boundary, and isolate authentication scopes using `config.sign_out_all_scopes`.

2. **Configure Account Confirmation and Token Parameters**

Keep `config.reconfirmable = true` enabled to require confirmation on email address changes. Set strict expiration time limits using `config.confirm_within` and process confirmation tokens safely via `confirm_by_token` to handle corrupted or expired inputs without throwing unhandled exceptions.

3. **Prevent Enumeration and Restrict Parameter Authentication**

Enable paranoid mode (`config.paranoid = true`) to prevent user enumeration during authentication and recovery flows. Restrict parameter-based authentication exclusively to dedicated request handlers by calling `allow_params_authentication!` instead of triggering it globally or during GET requests.

4. **Verify Passwords and Compare Digests Securely**

Perform password verification using the model-level `resource.valid_password?(password)` method rather than strategy-level checks. When writing custom authentication logic or validating sensitive tokens, use constant-time comparisons via `Devise::Encryptor.compare` or `Devise.secure_compare` to mitigate timing side-channel attacks.

5. **Sanitize and Revalidate Untrusted Redirect Locations**

Pass untrusted return destination strings into `store_location_for` or extract safe relative local paths using `extract_path_from_location` in custom failure apps rather than directly trusting raw parameters or request headers, thereby preventing open redirect vulnerabilities.

6. **Configure Robust Hashing and Input Validation Bounds**

Configure an adequate bcrypt work factor via `config.stretches` in production environments and explicitly set password length bounds using `config.password_length` and the `:validatable` module to prevent hashing resource exhaustion and reject weak credentials.

7. **Harden CSRF Protection and Request Methods**

Ensure `config.clean_up_csrf_token_on_authentication = true` is set, restrict sign-out routes to restrictive HTTP methods like `:delete` or `:post`, enforce POST requests for OmniAuth initiation, and call `super` when overriding `handle_unverified_request` in application controllers.

8. **Normalize Identity Inputs and Permit Conditions**

Configure `case_insensitive_keys` and `strip_whitespace_keys` for uniform identity lookup, validate custom email fields against `Devise.email_regexp`, and strictly permit condition hashes before calling `find_for_database_authentication` manually.

9. **Disable Unexpected Extension Formats on Routes**

Pass `format: false` to `devise_for` when authentication routes are strictly intended for HTML views, preventing generated routes from matching paths with format extensions like `.json` and avoiding format confusion.

10. **Protect Sensitive Attributes, Tokens, and Memory**

Omit sensitive attributes such as confirmation tokens and password hashes from API response payloads by explicitly scoping fields in custom serializers. Store cryptographic digests of tokens using `Devise.token_generator.digest`, retain `@token` assignments in custom mailers without logging them, and clear plain text passwords from memory using `clean_up_passwords`.

11. **Manage Session State and Credential Updates Securely**

Rely on Devise to rotate session identifiers and refresh CSRF tokens upon authentication. Invalidate persistent remember-me tokens by maintaining `config.expire_all_remember_me_on_sign_out = true`, use `bypass_sign_in` when updating credentials like passwords, and configure session inactivity timeouts via `config.timeout_in`.

12. **Verify Security Callbacks Using Integration Tests**

Avoid relying solely on isolated controller test helpers like `sign_in` and `sign_out` which bypass Warden callbacks. Test security controls, lockout rules, session tracking, and Warden hooks comprehensively using integration or system tests.
