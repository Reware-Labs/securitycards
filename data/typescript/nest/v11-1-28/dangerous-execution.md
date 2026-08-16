# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: dangerous execution

## dangerous execution

### Evaluate Submitted Expressions with a Parser, Not the JavaScript Engine

**Use when**

A request supplies an expression, formula, filter, or template that a controller, service, or pipe computes a result from.

**Secure rules**

**Rule 1: Never pass request data to `eval`, `new Function`, or `node:vm`.**

Each of these compiles its argument as JavaScript with the process's full authority, so an endpoint that evaluates arithmetic also runs `require('node:child_process')`. `node:vm` does not close the gap: it isolates trusted code for convenience and its context is escapable, so it is not a boundary against hostile input. Accept only the grammar the feature needs, then evaluate the parsed tree yourself. A custom `PipeTransform` is the natural place for the check, because it rejects before the handler is entered.

```typescript
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const ARITHMETIC = /^[0-9+\-*/(). ]{1,100}$/;

@Injectable()
export class ArithmeticExpressionPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !ARITHMETIC.test(value)) {
      throw new BadRequestException('unsupported expression');
    }
    return value;
  }
}
```

**Rule 2: Bound the work a submitted expression is allowed to perform.**

An expression can be syntactically harmless and still expensive: deep nesting, a very large exponent, or a repetition count consumes CPU for as long as the evaluator runs, and one request then occupies the event loop for every other. Cap the accepted length and the nesting depth, and reject rather than truncate so the caller receives a clear error instead of a silently different answer.

```typescript
const MAX_DEPTH = 16;

function parseExpression(tokens: string[], depth = 0): Node {
  if (depth > MAX_DEPTH) {
    throw new BadRequestException('expression nested too deeply');
  }
  return parseTerm(tokens, depth + 1);
}
```

**Rule 3: Resolve dynamic behavior through a fixed map, never by loading a named module or class.**

An identifier taken from a request and passed to `require()`, a dynamic `import()`, or a container lookup lets the caller choose which code runs, and the reachable set is every module on disk rather than the handful the feature intends. Map the approved identifiers to implementations explicitly and reject anything absent from the map, so adding a capability is a code change rather than a request parameter.

```typescript
const EXPORTERS: Record<string, () => Exporter> = {
  csv: () => new CsvExporter(),
  json: () => new JsonExporter(),
};

const createExporter = (format: string): Exporter => {
  const factory = EXPORTERS[format];
  if (!factory) {
    throw new BadRequestException('unsupported format');
  }
  return factory();
};
```


**Source files**

- [`content/pipes.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/pipes.md) _(documentation repository)_
- [`content/techniques/validation.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/validation.md) _(documentation repository)_
