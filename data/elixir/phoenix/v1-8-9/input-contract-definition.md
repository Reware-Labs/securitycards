# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: input contract definition

## input contract definition

### Validate and Cast Input Parameters Securely with Ecto Changesets

**Use when**

When handling external user input maps, form submissions, or API parameters in Ecto changesets before application processing and database operations.

**Secure rules**

**Rule 1: Explicitly specify allowed input parameters and exclude administrative or sensitive fields in Ecto changeset casting.**

Strictly specify allowed parameter keys in `Ecto.Changeset.cast/3` calls. Never cast administrative, privilege-related, or sensitive server-managed fields to prevent mass assignment vulnerabilities.

```elixir
def registration_changeset(user, attrs, opts \\ []) do
  user
  |> cast(attrs, [:email, :password]) # Exclude :is_admin
  |> validate_email()
  |> validate_password(opts)
end
```

**Rule 2: Enforce strict length and numeric bound validations on user input attributes.**

Apply explicit constraint validations such as `validate_length/3` and `validate_number/3` to enforce required character limits and numeric bounds on input fields.

```elixir
def password_changeset(user, attrs) {
  user
  |> cast(attrs, [:password])
  |> validate_length(:password, min: 12, max: 72)
}
```
