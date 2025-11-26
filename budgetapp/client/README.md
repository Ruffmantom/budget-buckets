# Component structure

```bash
client/
└── src/
    └── components/
        ├── common/              # Generic, reusable UI components (buttons, cards, modals)
        ├── layout/              # Layout pieces like Navbar, Footer, Sidebar
        ├── auth/                # Login, Register, ForgotPassword, etc.
        ├── forms/               # Form elements or custom form controls
        ├── dashboard/           # Dashboard widgets or sections (StatsCard, UserTable, etc.)
        ├── modals/              # All modal dialogs
        ├── protected/           # Auth wrappers (PrivateRoute, RoleBasedRoute)
        └── shared/              # Components shared across pages but not truly "common"
```


# common/
Reusable, UI-focused, stateless components (no business logic):

```bash
Button.jsx
Input.jsx
Card.jsx
Modal.jsx
Spinner.jsx
Tooltip.jsx
```
These components are styled and flexible — think "UI building blocks."

layout/
Used to compose the structure of your app or pages:

```bash
Header.jsx
Footer.jsx
Sidebar.jsx
MainLayout.jsx
AuthLayout.jsx
```

Useful for wrapping routes or sections.

# auth/
All components related to authentication:

```bash
LoginForm.jsx
RegisterForm.jsx
PasswordReset.jsx
OAuthButtons.jsx
```

You may later move logic here or refactor it into separate hooks/services.

# forms/
Reusable form components or custom controls:

```bash
FormInput.jsx
FormSelect.jsx
FormTextarea.jsx
CheckboxGroup.jsx
DatePicker.jsx
```
Helps avoid repetition in forms.

# dashboard/
If your app has a dashboard or internal views, keep domain-specific widgets here:

```bash
UserTable.jsx
StatsCard.jsx
NotificationPanel.jsx
ActivityFeed.jsx
```
This is especially useful if you're building an admin panel or logged-in experience.

# modals/
If you use modal windows often, keep them modular here:
```bash
ConfirmDeleteModal.jsx
UserDetailsModal.jsx
FeedbackModal.jsx
protected/
```
Route guards or wrappers like:

```bash
PrivateRoute.jsx
RoleBasedRoute.jsx
```
You may also store HOCs or RequireAuth components here.

# shared/
This is useful for:

Semi-reusable components used across multiple pages.

Too specific for common/ but used more than once.

```bash
UserAvatar.jsx
TagList.jsx
ProductCard.jsx
```

# 🧠 Naming Conventions
Use PascalCase for component files: LoginForm.jsx, UserCard.jsx

Match folder and component names for self-contained structure (if you prefer atomic style):

```bash
components/
  Button/
    index.jsx
    styles.css
    Button.test.jsx
```
# ✨ Optional Pro Tips
If components get too complex, break into:

components/ComponentName/ComponentName.jsx

components/ComponentName/ComponentName.module.css

components/ComponentName/index.js

Use index exports to simplify imports:

```js
// components/common/index.js
export { default as Button } from './Button';
export { default as Spinner } from './Spinner';
```