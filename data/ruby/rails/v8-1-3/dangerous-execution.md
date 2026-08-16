# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: dangerous execution

## dangerous execution

### Keep Untrusted Input Out of Code Evaluation and Dynamic Dispatch

**Use when**

Handling request parameters that could influence code evaluation, method or class resolution, or template rendering.

**Secure rules**

**Rule 1: Never pass request data to runtime code evaluation.**

Do not send user-supplied values to `eval`, `instance_eval`, `class_eval`, or `binding.eval`. Interpret structured input with an explicit parser or a fixed set of operations rather than executing it as Ruby.

```ruby
# Unsafe: eval(params[:expression])
ALLOWED_OPS = { "add" => ->(a, b) { a + b }, "sub" => ->(a, b) { a - b } }
op = ALLOWED_OPS.fetch(params[:op]) { raise ActionController::BadRequest }
result = op.call(Integer(params[:a]), Integer(params[:b]))
```

**Rule 2: Resolve methods and classes through an allowlist, not from parameters.**

Never call `send`, `public_send`, `constantize`, `safe_constantize`, or `Object.const_get` with a method or class name taken from user input. Map approved identifiers to fixed methods or classes so callers cannot reach arbitrary code.

```ruby
ACTIONS = { "publish" => :publish!, "archive" => :archive! }
method_name = ACTIONS.fetch(params[:action]) { raise ActionController::BadRequest }
article.public_send(method_name)
```

**Rule 3: Render fixed templates and pass untrusted data as locals instead of compiling input.**

Do not build templates from user input with `ERB.new(...).result` or `render inline:`; render predefined templates and supply untrusted values through locals or assigns so they are handled as data rather than executable code.

```ruby
# Unsafe: ERB.new(params[:template]).result(binding)
render :show, locals: { name: params[:name] }
```
