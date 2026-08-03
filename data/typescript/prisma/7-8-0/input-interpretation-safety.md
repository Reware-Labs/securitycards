# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: input interpretation safety

## input interpretation safety

### Ensure Accurate Type Matching for Query Parameters

**Use when**

When manually constructing query plans or extensions in Prisma Client, especially when dealing with specialized data types.

**Secure rules**

**Rule 1: Validate that parameter types used in query plans precisely match their expected runtime types to prevent data corruption or misinterpretation.**

When building custom query logic or extensions, always confirm that the types of parameters, particularly for specialized types like `DateTime`, `Decimal`, `BigInt`, and JSON/JSONB, align with what the database driver and Prisma expect. Use Prisma's built-in type constructors to ensure correct serialization.

```typescript
import { Prisma } from '@prisma/client';

const decimalValue = new Prisma.Decimal('10.5');
const bigIntValue = BigInt('9007199254740991');

// Example usage within a Prisma client operation (conceptual)
// await prisma.myModel.findMany({
//   where: {
//     decimalField: decimalValue,
//     bigIntField: bigIntValue
//   }
// });
```


**Source files**

- [`docs/plans/benchmark-improvements/004-review-interpreter-benchmarks.md`](https://github.com/prisma/prisma/blob/7.8.0/docs/plans/benchmark-improvements/004-review-interpreter-benchmarks.md)
