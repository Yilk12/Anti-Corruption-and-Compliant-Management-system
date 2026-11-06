# Enhanced Text Input Components

This document provides comprehensive documentation for the enhanced text input components built for the ECSC Help-Desk and Knowledge Base System.

## Components Overview

### 1. Enhanced Chat Text Box (`components/chat/chat-text-box.tsx`)

A feature-rich chat input component with emoji support, voice recording, file attachments, and auto-resize functionality.

#### Features:
- ✅ Auto-resizing textarea
- ✅ Emoji picker with common emojis
- ✅ Voice recording toggle
- ✅ File attachment button
- ✅ Character count display
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- ✅ Disabled state support
- ✅ Customizable placeholder text

#### Usage:
```tsx
import ChatTextBox from "@/components/chat/chat-text-box";

function ChatInterface() {
  const handleSend = (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <ChatTextBox 
      onSend={handleSend}
      placeholder="Type your message..."
      maxLength={1000}
      showEmoji={true}
      showAttachment={true}
      showVoice={true}
    />
  );
}
```

#### Props:
- `onSend: (message: string) => void` - Callback when message is sent
- `placeholder?: string` - Placeholder text (default: "Type your message...")
- `disabled?: boolean` - Disable the input (default: false)
- `maxLength?: number` - Maximum character limit (default: 1000)
- `showEmoji?: boolean` - Show emoji picker (default: true)
- `showAttachment?: boolean` - Show attachment button (default: true)
- `showVoice?: boolean` - Show voice recording button (default: true)

### 2. Enhanced Text Input (`components/ui/enhanced-text-input.tsx`)

A comprehensive, reusable text input component that supports various input types, validation, and styling options.

#### Features:
- ✅ Multiple input types (text, email, password, search, textarea, number)
- ✅ Auto-resize for textarea
- ✅ Password visibility toggle
- ✅ Clear button
- ✅ Icon support (left/right positioning)
- ✅ Validation with error/success states
- ✅ Character counting
- ✅ Multiple sizes (sm, md, lg)
- ✅ Multiple variants (default, filled, outlined)
- ✅ Disabled state
- ✅ Required field indicator
- ✅ Helper text support

#### Usage:
```tsx
import { EnhancedTextInput } from "@/components/ui/enhanced-text-input";
import { User, Mail, Lock } from "lucide-react";

function UserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="space-y-4">
      <EnhancedTextInput
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
        icon={<Mail className="h-4 w-4" />}
        required
        error={error}
        helperText="We'll never share your email"
      />

      <EnhancedTextInput
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
        icon={<Lock className="h-4 w-4" />}
        showPasswordToggle
        required
        helperText="Must be at least 8 characters"
      />
    </div>
  );
}
```

#### Props:
- `type?: 'text' | 'email' | 'password' | 'search' | 'textarea' | 'number'` - Input type
- `value?: string` - Current value
- `onChange?: (value: string) => void` - Change handler
- `label?: string` - Label text
- `placeholder?: string` - Placeholder text
- `helperText?: string` - Helper text below input
- `error?: string` - Error message
- `success?: string` - Success message
- `disabled?: boolean` - Disable input
- `required?: boolean` - Mark as required
- `maxLength?: number` - Maximum character limit
- `minLength?: number` - Minimum character limit
- `autoResize?: boolean` - Auto-resize textarea (default: false)
- `showCharacterCount?: boolean` - Show character count (default: false)
- `showPasswordToggle?: boolean` - Show password visibility toggle (default: false)
- `showClearButton?: boolean` - Show clear button (default: false)
- `icon?: React.ReactNode` - Icon component
- `iconPosition?: 'left' | 'right'` - Icon position (default: 'left')
- `size?: 'sm' | 'md' | 'lg'` - Input size (default: 'md')
- `variant?: 'default' | 'filled' | 'outlined'` - Visual variant (default: 'default')
- `rows?: number` - Number of rows for textarea (default: 3)
- `cols?: number` - Number of columns for textarea

## Examples

### Basic Form
```tsx
function BasicForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form className="space-y-4">
      <EnhancedTextInput
        type="text"
        label="Name"
        value={name}
        onChange={setName}
        required
      />
      
      <EnhancedTextInput
        type="email"
        label="Email"
        value={email}
        onChange={setEmail}
        required
      />
    </form>
  );
}
```

### Search Interface
```tsx
function SearchInterface() {
  const [query, setQuery] = useState('');

  return (
    <EnhancedTextInput
      type="search"
      placeholder="Search..."
      value={query}
      onChange={setQuery}
      icon={<Search className="h-4 w-4" />}
      showClearButton
    />
  );
}
```

### Textarea with Auto-resize
```tsx
function MessageInput() {
  const [message, setMessage] = useState('');

  return (
    <EnhancedTextInput
      type="textarea"
      label="Message"
      value={message}
      onChange={setMessage}
      autoResize
      showCharacterCount
      maxLength={500}
      rows={4}
    />
  );
}
```

### Password Input
```tsx
function PasswordInput() {
  const [password, setPassword] = useState('');

  return (
    <EnhancedTextInput
      type="password"
      label="Password"
      value={password}
      onChange={setPassword}
      showPasswordToggle
      required
    />
  );
}
```

## Styling

The components use Tailwind CSS classes and can be customized through the `className` and `inputClassName` props. The components follow the design system established in the project.

### Size Variants:
- **Small (sm)**: `h-8 text-sm` - Compact inputs for dense layouts
- **Medium (md)**: `h-10 text-base` - Standard size for most use cases
- **Large (lg)**: `h-12 text-lg` - Prominent inputs for important forms

### Style Variants:
- **Default**: Standard border with focus states
- **Filled**: Background color with subtle borders
- **Outlined**: Thicker borders for emphasis

## Accessibility

The components include proper accessibility features:
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Error announcements

## Browser Support

The components are built with modern web standards and support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Demo Page

Visit `/text-input-demo` to see all components in action with various configurations and examples.

## Integration

These components are designed to work seamlessly with:
- React Hook Form
- Formik
- Custom validation libraries
- The existing UI component library
- The project's design system

## Performance

The components are optimized for performance with:
- Minimal re-renders
- Efficient event handling
- Lazy loading of optional features
- Proper cleanup of event listeners

