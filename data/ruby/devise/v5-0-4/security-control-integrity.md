# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: security control integrity

## security control integrity

### Use Integration Tests to Verify Warden Authentication Callbacks

**Use when**

Testing authentication behaviors, security hooks, session lifecycles, and Warden callbacks instead of relying solely on isolated controller tests.

**Secure rules**

**Rule 1: Avoid relying solely on controller test helpers for security callback verification**

Devise controller test helpers such as `Devise::Test::ControllerHelpers#sign_in` and `#sign_out` bypass Warden authentication and logout callbacks by injecting stubbed user data. Ensure that all security controls, lockout rules, session tracking, and Warden hooks are fully tested using integration or system tests where actual Warden callbacks execute.

```ruby
class AuthenticationTest < ActionDispatch::IntegrationTest
  test 'user sign in triggers warden callbacks and trackable' do
    post user_session_path, params: { user: { email: 'alice@example.com', password: 'password' } }
    assert_redirected_to root_path
  end
end
```
