## 2024-03-18 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Many icon-only buttons in the application were relying entirely on visual icons or `title` attributes. While `title` helps on hover, it doesn't provide semantic meaning for screen readers.
**Action:** When adding new icon-only buttons (like toggle buttons or quick action buttons), always include a descriptive `aria-label` to ensure accessibility for non-visual users.
