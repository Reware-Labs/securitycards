# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: input interpretation safety

## input interpretation safety

### Handle Scalar Encoding Divergence in AST Value Conversions for `GraphQLID`

**Use when**

When converting runtime JavaScript values to GraphQL AST literals using `astFromValue` with `GraphQLID` to ensure downstream consumers safely process varying literal node kinds.

**Secure rules**

**Rule 1: Handle both `IntValue` and `StringValue` AST node kinds explicitly when processing AST literals produced for `GraphQLID` types to prevent encoding confusion.**

When generating AST literals from external or runtime values using `astFromValue`, account for scalar type conversion rules where numeric strings without leading zeros are coerced into `IntValue` AST literals while others remain `StringValue` AST literals. Update your downstream query generators and AST consumers to explicitly handle both node kinds.

```typescript
import { GraphQLID } from 'graphql';
import { astFromValue } from 'graphql/utilities';

const astNode = astFromValue('123', GraphQLID);
// astNode is { kind: 'IntValue', value: '123' }
// Handle both 'IntValue' and 'StringValue' kinds safely in AST processing
```


### Safely Parse and Normalize Untrusted GraphQL Inputs and Query Strings

**Use when**

When decoding, parsing, normalizing, and canonicalizing untrusted representations and query strings so security decisions use one unambiguous interpretation.

**Secure rules**

**Rule 1: Allow the lexer and parser to handle input validation and properly catch GraphQLError exceptions when processing untrusted query strings.**

Pass untrusted query strings to the GraphQL parser or lexer and handle resulting GraphQLError syntax errors gracefully rather than manually altering token boundaries.

```typescript
import { parse, Source, GraphQLError } from 'graphql';

function safeParseQuery(queryString: string) {
  try {
    const source = new Source(queryString, 'GraphQL-Request');
    return parse(source);
  } catch (error) {
    if (error instanceof GraphQLError) {
      return { errors: [error.toJSON()] };
    }
    throw error;
  }
}
```

**Rule 2: Safely normalize GraphQL query strings using stripIgnoredCharacters to preserve token boundaries.**

Rely on stripIgnoredCharacters to remove comments, commas, BOM, and unneeded whitespace while strictly preserving string literal contents and required spaces between non-punctuator tokens.

```typescript
import { stripIgnoredCharacters } from 'graphql';

const rawQuery = `
  query GetUser {
    user(id: "123 # not a comment") {
      name
      role
    }
  }
`;

const normalizedQuery = stripIgnoredCharacters(rawQuery);
```

**Rule 3: Handle syntax errors when normalizing GraphQL documents with stripIgnoredCharacters.**

Wrap calls to stripIgnoredCharacters in error handling to catch lexer syntax errors when processing untrusted query strings.

```typescript
import { stripIgnoredCharacters } from 'graphql';

try {
  const minifiedQuery = stripIgnoredCharacters(untrustedQueryString);
} catch (error) {

}
```
