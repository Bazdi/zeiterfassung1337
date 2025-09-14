# BookingsMonthView Component

A comprehensive, modular React component for displaying and managing monthly time entries with advanced features for performance, accessibility, and maintainability.

## 🚀 Features

- **📅 Monthly Time Tracking**: Display and edit time entries for an entire month
- **✨ Inline Editing**: Click-to-edit functionality for time entries
- **📊 Weekly & Monthly Summaries**: Automatic calculation of working hours
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS
- **♿ Accessibility**: Full keyboard navigation and screen reader support
- **⚡ Performance**: Optimized rendering with memoization and virtual scrolling
- **🛡️ Error Handling**: Comprehensive error boundaries and recovery
- **🔄 Real-time Updates**: Live data synchronization
- **📱 Mobile Friendly**: Responsive design for all devices

## 🏗️ Architecture

### Modular Structure

```
bookings-month-view/
├── index.tsx                 # Main orchestrator component
├── types.ts                  # TypeScript definitions
├── hooks/                    # Custom React hooks
│   ├── use-time-entries.ts   # Data management
│   ├── use-editing-state.ts  # UI state management
│   └── use-holidays.ts       # Holiday data
├── components/               # Reusable UI components
│   ├── month-selector.tsx    # Month navigation
│   ├── table-header.tsx      # Table headers
│   ├── day-row.tsx           # Individual day row
│   ├── week-summary-row.tsx  # Weekly totals
│   └── month-summary-row.tsx # Monthly totals
├── cells/                    # Editable cell components
│   ├── editable-time-cell.tsx # Time input cell
│   ├── editable-pause-cell.tsx # Pause input cell
│   └── notes-cell.tsx        # Notes/category cell
└── utils/                    # Utility functions
    ├── time-helpers.ts       # Time formatting & calculations
    ├── date-helpers.ts       # Date manipulation
    └── validation.ts         # Input validation
```

## 📖 Usage

### Basic Usage

```tsx
import BookingsMonthView from '@/components/bookings-month-view';

function MyPage() {
  return (
    <BookingsMonthView
      initialYear={2024}
      initialMonth={9}
    />
  );
}
```

### Advanced Usage with Custom Props

```tsx
<BookingsMonthView
  initialYear={2024}
  initialMonth={9}
  // Additional props can be added as needed
/>
```

## 🔧 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialYear` | `number?` | `current year` | Initial year to display |
| `initialMonth` | `number?` | `current month` | Initial month to display (1-12) |

### Custom Hooks

#### `useTimeEntries(year, month)`

Manages time entries data with CRUD operations.

```tsx
const {
  entries,      // TimeEntry[]
  loading,      // boolean
  error,        // string | null
  refetch,      // () => void
  createEntry,  // (entry) => Promise<boolean>
  updateEntry,  // (id, updates) => Promise<boolean>
  deleteEntry   // (id) => Promise<boolean>
} = useTimeEntries(year, month);
```

#### `useEditingState()`

Manages inline editing state.

```tsx
const {
  editing,        // EditingState | null
  startEditing,   // (day, field, value) => void
  stopEditing,    // () => void
  updateValue,    // (value) => void
  isEditing       // (day, field) => boolean
} = useEditingState();
```

## 🎨 Styling

The component uses Tailwind CSS classes and follows the project's design system. Key styling features:

- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Dark Mode Support**: Automatic dark mode detection
- **Customizable Colors**: Semantic color tokens for different states
- **Animation**: Smooth transitions and loading states

### CSS Custom Properties

```css
:root {
  --bookings-border-color: #e5e7eb;
  --bookings-hover-color: #f9fafb;
  --bookings-error-color: #ef4444;
  --bookings-success-color: #10b981;
}
```

## ♿ Accessibility

### Keyboard Navigation

- **Tab**: Navigate through focusable elements
- **Enter**: Activate buttons or start editing
- **Escape**: Cancel editing or close dialogs
- **Arrow Keys**: Navigate table cells (future enhancement)

### Screen Reader Support

- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Announcements for dynamic content updates
- **Semantic HTML**: Proper table structure with headers
- **Focus Management**: Logical tab order and focus trapping

### WCAG Compliance

- **Level AA** compliance for color contrast
- **Keyboard-only** operation support
- **Screen reader** compatibility
- **Reduced motion** respect for animations

## ⚡ Performance

### Optimizations

- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Caches expensive calculations
- **useCallback**: Stable function references
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Debouncing**: Prevents excessive API calls

### Performance Monitoring

```tsx
import { usePerformanceMonitoring } from './hooks/use-performance-monitoring';

function MyComponent() {
  const { trackInteraction } = usePerformanceMonitoring('MyComponent');

  const handleClick = () => {
    trackInteraction('button_click');
    // ... handle click
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test time-helpers.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Structure

```
__tests__/
├── utils/
│   ├── time-helpers.test.ts
│   ├── date-helpers.test.ts
│   └── validation.test.ts
├── hooks/
│   ├── use-time-entries.test.ts
│   └── use-editing-state.test.ts
└── components/
    ├── day-row.test.tsx
    └── editable-time-cell.test.tsx
```

## 🔧 Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 📋 Error Handling

### Error Boundary

The component includes a comprehensive error boundary that:

- Catches JavaScript errors anywhere in the component tree
- Displays user-friendly error messages
- Provides recovery options (retry, reset)
- Logs errors for debugging

### API Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Validation Errors**: User-friendly error messages
- **Authentication Errors**: Redirect to login
- **Server Errors**: Graceful degradation with offline mode

## 🔮 Future Enhancements

### Planned Features

- **Virtual Scrolling**: For large datasets
- **Drag & Drop**: Reschedule entries
- **Bulk Operations**: Select and edit multiple entries
- **Export/Import**: CSV and Excel support
- **Calendar View**: Alternative calendar layout
- **Time Tracking**: Real-time clock integration
- **Notifications**: Browser notifications for reminders

### Performance Improvements

- **Service Worker**: Offline functionality
- **Web Workers**: Heavy calculations off main thread
- **Code Splitting**: Lazy load advanced features
- **Bundle Analysis**: Optimize bundle size

## 🤝 Contributing

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with React rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

### Commit Convention

```bash
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: add tests
chore: maintenance
```

## 📄 License

This component is part of the larger application and follows the same license terms.

## 🆘 Support

For issues and questions:

1. Check the [troubleshooting guide](./TROUBLESHOOTING.md)
2. Search existing [GitHub issues](../../issues)
3. Create a new issue with detailed reproduction steps
4. Contact the development team

---

**Last Updated**: December 2024
**Version**: 2.0.0
**Maintainer**: Development Team