# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: output encoding

## output encoding

### Escape dynamic user content before inserting into HTML templates

**Use when**

Rendering dynamic user content or API responses into the browser DOM using properties like innerHTML.

**Secure rules**

**Rule 1: HTML-escape untrusted data before inserting it into HTML layout templates to prevent Cross-Site Scripting (XSS).**

Ensure that any dynamic content received from API endpoints or real-time events is properly HTML-escaped using utility functions that replace special characters such as `&`, `<`, and `>` before rendering them via `innerHTML` or similar properties.

```javascript
const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const addMessage = (message) => {
  const chat = document.querySelector('#chat')
  const text = escapeHTML(message.text || '')
  if (chat) {
    chat.innerHTML += `<div class="chat-bubble">${text}</div>`
  }
}
```
