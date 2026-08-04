# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: output encoding

## output encoding

### Safely compose external class names using cx helper

**Use when**

When combining styled utility classes with dynamic or external class strings in Hono applications.

**Secure rules**

**Rule 1: Compose class attributes using Hono's cx() helper to encode attribute-breaking characters and sanitize CSS selectors.**

Pass dynamic user inputs through the `cx()` helper from `hono/css` to ensure proper HTML attribute escaping and CSS selector sanitization, preventing Cross-Site Scripting (XSS) and HTML element breakouts.

```typescript
import { css, cx, Style } from 'hono/css'

const baseButton = css`
  padding: 0.5rem 1rem;
`

export const CustomButton = ({ userClass }: { userClass?: string }) => {
  return (
    <>
      <Style />
      <button class={cx(baseButton, userClass)}>Click Me</button>
    </>
  )
}
```
