# {{PROJECT_NAME}} - Frontend AI Context Configuration

## Project Overview
{{PROJECT_DESCRIPTION}}

**Frontend Stack:**
- **Framework:** {{FRONTEND_FRAMEWORK}} (e.g., React, Vue, Angular)
- **Language:** {{LANGUAGE}} (e.g., TypeScript, JavaScript)
- **Styling:** {{STYLING_SOLUTION}} (e.g., Tailwind CSS, styled-components, CSS Modules)
- **Build Tool:** {{BUILD_TOOL}} (e.g., Vite, Webpack, Parcel)
- **State Management:** {{STATE_MANAGEMENT}} (e.g., Redux, Zustand, Pinia)
- **Testing:** {{TESTING_FRAMEWORK}} (e.g., Vitest, Jest, Cypress)

## Project Structure
```
{{PROJECT_NAME}}/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── stores/            # State management
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── tests/                 # Test files
└── {{CONFIG_FILES}}       # Configuration files
```

## Component Architecture

### Component Standards
```{{LANGUAGE_EXTENSION}}
// Component template
interface {{COMPONENT_NAME}}Props {
  {{PROP_DEFINITION}}
}

export const {{COMPONENT_NAME}}: {{COMPONENT_TYPE}} = ({
  {{PROP_DESTRUCTURING}}
}) => {
  {{COMPONENT_LOGIC}}

  return (
    {{COMPONENT_JSX}}
  );
};
```

### Naming Conventions
- **Components:** PascalCase (e.g., `UserProfile`, `NavigationBar`)
- **Files:** PascalCase for components, camelCase for utilities
- **Props:** camelCase with descriptive names
- **Handlers:** Start with `handle` (e.g., `handleSubmit`, `handleChange`)

## State Management

### {{STATE_MANAGEMENT}} Patterns
```{{LANGUAGE_EXTENSION}}
// Store template
interface {{STORE_NAME}}State {
  {{STATE_PROPERTIES}}
}

interface {{STORE_NAME}}Actions {
  {{ACTION_DEFINITIONS}}
}

export const use{{STORE_NAME}}Store = {{STORE_CREATION_PATTERN}}
```

### Component State
```{{LANGUAGE_EXTENSION}}
// Local state management
const [{{STATE_NAME}}, set{{STATE_NAME}}] = useState({{INITIAL_VALUE}});

// Effect for side effects
useEffect(() => {
  {{EFFECT_LOGIC}}
}, [{{DEPENDENCIES}}]);
```

## Styling Guidelines

### {{STYLING_SOLUTION}} Standards
```{{STYLE_EXTENSION}}
/* Component styles */
{{STYLE_EXAMPLE}}
```

### Responsive Design
- **Mobile First:** Start with mobile styles, then scale up
- **Breakpoints:** {{BREAKPOINT_DEFINITIONS}}
- **Grid System:** {{GRID_SYSTEM_APPROACH}}

## API Integration

### Service Layer
```{{LANGUAGE_EXTENSION}}
// API service template
export class {{SERVICE_NAME}}Service {
  private baseURL = {{API_BASE_URL}};

  async {{METHOD_NAME}}({{PARAMETERS}}): Promise<{{RETURN_TYPE}}> {
    try {
      const response = await fetch(`${this.baseURL}/{{ENDPOINT}}`, {
        method: '{{HTTP_METHOD}}',
        headers: {
          'Content-Type': 'application/json',
          {{ADDITIONAL_HEADERS}}
        },
        body: JSON.stringify({{REQUEST_BODY}})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('{{SERVICE_NAME}} error:', error);
      throw error;
    }
  }
}
```

### Error Handling
```{{LANGUAGE_EXTENSION}}
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### Code Splitting
```{{LANGUAGE_EXTENSION}}
// Lazy loading components
const {{COMPONENT_NAME}} = lazy(() => import('./{{COMPONENT_PATH}}'));

// Route-based splitting
const {{PAGE_NAME}} = lazy(() => import('../pages/{{PAGE_PATH}}'));
```

### Memoization
```{{LANGUAGE_EXTENSION}}
// Memoized component
const {{COMPONENT_NAME}} = React.memo(({ {{PROPS}} }) => {
  {{COMPONENT_LOGIC}}
});

// Memoized values
const {{MEMOIZED_VALUE}} = useMemo(() => {
  return {{EXPENSIVE_CALCULATION}};
}, [{{DEPENDENCIES}}]);
```

## Testing Strategy

### Component Testing
```{{LANGUAGE_EXTENSION}}
// Component test template
import { render, screen, fireEvent } from '@testing-library/{{FRAMEWORK}}';
import { {{COMPONENT_NAME}} } from './{{COMPONENT_NAME}}';

describe('{{COMPONENT_NAME}}', () => {
  test('{{TEST_DESCRIPTION}}', () => {
    render(<{{COMPONENT_NAME}} {{TEST_PROPS}} />);
    
    {{TEST_ASSERTIONS}}
  });

  test('{{INTERACTION_TEST_DESCRIPTION}}', () => {
    const {{MOCK_HANDLER}} = jest.fn();
    render(<{{COMPONENT_NAME}} {{HANDLER_PROP}}={{{MOCK_HANDLER}}} />);
    
    fireEvent.{{EVENT_TYPE}}(screen.getBy{{SELECTOR}}('{{SELECTOR_VALUE}}'));
    
    expect({{MOCK_HANDLER}}).toHaveBeenCalledWith({{EXPECTED_ARGS}});
  });
});
```

### Integration Testing
```{{LANGUAGE_EXTENSION}}
// Integration test example
test('{{INTEGRATION_TEST_DESCRIPTION}}', async () => {
  render(<{{APP_COMPONENT}} />);
  
  // User interactions
  {{USER_INTERACTIONS}}
  
  // Assertions
  await waitFor(() => {
    {{ASYNC_ASSERTIONS}}
  });
});
```

## Accessibility Guidelines

### ARIA Standards
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Maintain focus management

```{{LANGUAGE_EXTENSION}}
// Accessible component example
<button
  aria-label="{{BUTTON_DESCRIPTION}}"
  aria-pressed={{{PRESSED_STATE}}}
  disabled={{{DISABLED_STATE}}}
  onClick={{{CLICK_HANDLER}}}
>
  {{BUTTON_CONTENT}}
</button>
```

## Security Best Practices

### Input Validation
```{{LANGUAGE_EXTENSION}}
// Input sanitization
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

// XSS prevention
const SafeHtml = ({ content }: { content: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
};
```

### Authentication
```{{LANGUAGE_EXTENSION}}
// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

<!-- Tool-specific instructions -->

<!-- AI:CLAUDE -->
Focus on component architecture and React/Vue best practices.
Help with complex state management and data flow.
Suggest performance optimizations and accessibility improvements.
Provide guidance on testing strategies and error handling.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Use autocomplete for component patterns and styling.
Focus on rapid prototyping and UI development.
Help with responsive design and CSS frameworks.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive component tests and stories.
Suggest modern frontend patterns and optimizations.
Help with TypeScript types and API integration.
<!-- /AI:COPILOT -->

<!-- AI:CODEIUM -->
Provide context-aware suggestions for component props and state.
Help with CSS-in-JS and styling solutions.
Suggest accessibility improvements and semantic HTML.
<!-- /AI:CODEIUM -->

## Build Configuration

### {{BUILD_TOOL}} Setup
```{{CONFIG_EXTENSION}}
// Build configuration
{{BUILD_CONFIG}}
```

### Environment Variables
```bash
# Environment configuration
{{ENV_VARIABLES}}
```

## Deployment

### Build Process
```bash
# Production build
{{BUILD_COMMAND}}

# Preview build
{{PREVIEW_COMMAND}}

# Development server
{{DEV_COMMAND}}
```

### Performance Monitoring
- **Bundle Analysis:** {{BUNDLE_ANALYZER}}
- **Core Web Vitals:** {{VITALS_MONITORING}}
- **Error Tracking:** {{ERROR_TRACKING}}

---

*This configuration is managed by ContextHub. Edit this file to update all AI tool configurations.*