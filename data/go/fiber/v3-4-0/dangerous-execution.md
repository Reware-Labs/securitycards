# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: dangerous execution

## dangerous execution

### Parse templates from your own files, never from request data

**Use when**

A handler renders a template, or accepts template text, a formula, or another expression from the caller.

**Secure rules**

**Rule 1: Parse templates from your own files and pass request data in only as data.**

`template.New("t").Parse(userInput)` compiles the caller's text into an executable template. Template actions traverse whatever you pass to `Execute` and can call exported methods on it, so a caller controlling the body reads that data. `text/template` also applies no escaping, making its output unsafe in an HTML response. Parse templates once at startup — or register a view engine on `fiber.Config` — and supply untrusted values as the data argument, where `html/template` escapes them per context.

```go
// Authored by us, parsed once at startup.
var profileTmpl = template.Must(template.ParseFiles("templates/profile.tmpl"))

app.Get("/profile/:name", func(c fiber.Ctx) error {
    var buf bytes.Buffer
    // The caller controls the value, never the template body.
    if err := profileTmpl.Execute(&buf, map[string]string{"Name": c.Params("name")}); err != nil {
        return c.SendStatus(fiber.StatusInternalServerError)
    }
    c.Set("Content-Type", "text/html; charset=utf-8")
    return c.Send(buf.Bytes())
})
```

**Rule 2: Run external programs without a shell, and keep request data out of the program slot.**

`exec.Command("sh", "-c", cmd)` hands the string to a shell, so `;`, `|`, backticks, and `$(...)` in a request value start further programs. `exec.Command(name, args...)` passes the arguments straight to the kernel with no shell to reinterpret them, so a value containing shell metacharacters stays one literal argument. Keep the program name a constant your code chose — resolving it from the request turns an argument problem into an arbitrary-execution one — and select from a fixed map when the caller must influence which tool runs. Separate arguments from a filename with `--` so a value beginning with `-` cannot be read as a flag.

```go
// Approved tools, chosen by us. The caller picks a key, never a program name.
var converters = map[string][]string{
    "png": {"convert", "-strip"},
    "jpg": {"convert", "-strip", "-quality", "85"},
}

app.Post("/convert/:format", func(c fiber.Ctx) error {
    base, ok := converters[c.Params("format")]
    if !ok {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unsupported format"})
    }
    // No shell: srcPath stays a single argument whatever it contains.
    args := append(append([]string{}, base[1:]...), "--", srcPath, dstPath)
    if err := exec.Command(base[0], args...).Run(); err != nil {
        return c.SendStatus(fiber.StatusInternalServerError)
    }
    return c.SendStatus(fiber.StatusOK)
})
```

**Rule 3: Evaluate arithmetic and filter expressions with a parser, not a code evaluator.**

A feature that accepts an expression invites reaching for something that executes it. Go has no `eval`, so the equivalent risk arrives through an embedded interpreter or a plugin loaded with `plugin.Open`: both run caller-supplied logic inside your process, with your file handles and network access. Parse the expression into a tree you walk yourself, permitting only the operators and identifiers the feature needs, and bound the work — depth, node count, input length — so a small expression cannot become an expensive one.

```go
// Only the operations this endpoint exists to offer.
var allowedOps = map[string]func(a, b float64) float64{
    "+": func(a, b float64) float64 { return a + b },
    "-": func(a, b float64) float64 { return a - b },
    "*": func(a, b float64) float64 { return a * b },
}

func evaluate(node Node, depth int) (float64, error) {
    if depth > 32 {
        return 0, errors.New("expression too deeply nested")
    }
    op, ok := allowedOps[node.Op]
    if !ok {
        return 0, fmt.Errorf("unsupported operator")
    }
    left, err := evaluate(node.Left, depth+1)
    if err != nil {
        return 0, err
    }
    right, err := evaluate(node.Right, depth+1)
    if err != nil {
        return 0, err
    }
    return op(left, right), nil
}
```
