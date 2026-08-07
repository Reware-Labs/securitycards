# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: dangerous execution

## dangerous execution

### Prevent arbitrary code evaluation and command execution with untrusted input

**Use when**

Handling dynamic input that should be evaluated as code or passed to system execution functions.

**Secure rules**

**Rule 1: Never pass untrusted user input to dynamic code evaluation or operating system command execution functions.**

Avoid passing dynamic user strings to functions such as `Code.eval_string/3`, `Code.eval_file/2`, `Code.eval_quoted/3`, `EEx.eval_string/3`, `EEx.eval_file/3`, `:os.cmd/2`, `System.cmd/3`, or `System.shell/2`. Instead, perform safe pattern matching or explicit function lookup.

```elixir
def process_data(data) do
  # Avoid passing dynamic user string to Code.eval_string/3 or System.shell/2
  # Perform safe pattern matching or explicit function lookup instead
  case data do
    "action_a" -> ActionModule.action_a()
    "action_b" -> ActionModule.action_b()
  end
end
```
