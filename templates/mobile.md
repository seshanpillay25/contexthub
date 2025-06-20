# {{PROJECT_NAME}} - Mobile AI Context Configuration

## Project Overview
{{PROJECT_DESCRIPTION}}

**Mobile Stack:**
- **Framework:** {{MOBILE_FRAMEWORK}} (e.g., React Native, Flutter, Native iOS/Android)
- **Language:** {{LANGUAGE}} (e.g., TypeScript, Dart, Swift, Kotlin)
- **State Management:** {{STATE_MANAGEMENT}} (e.g., Redux, MobX, Provider, Bloc)
- **Navigation:** {{NAVIGATION_LIBRARY}} (e.g., React Navigation, Flutter Navigator)
- **Backend Integration:** {{API_CLIENT}} (e.g., REST, GraphQL, Firebase)
- **Testing:** {{TESTING_FRAMEWORK}} (e.g., Jest, Detox, Flutter Test)
- **Build Tools:** {{BUILD_TOOLS}} (e.g., Metro, Gradle, Xcode)

## Project Structure
```
{{PROJECT_NAME}}/
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API services
│   ├── stores/            # State management
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom hooks (React Native)
│   ├── assets/            # Images, fonts, etc.
│   └── types/             # Type definitions
├── {{PLATFORM_SPECIFIC}}/  # Platform-specific code
├── tests/                 # Test files
└── {{CONFIG_FILES}}       # Configuration files
```

## Component Architecture

### Screen Component Template
```{{LANGUAGE_EXTENSION}}
// Screen component structure
interface {{SCREEN_NAME}}Props {
  navigation: {{NAVIGATION_TYPE}};
  route: {{ROUTE_TYPE}};
}

export const {{SCREEN_NAME}}Screen: React.FC<{{SCREEN_NAME}}Props> = ({
  navigation,
  route
}) => {
  // State management
  const {{STATE_HOOKS}}

  // Effects
  useEffect(() => {
    {{SCREEN_INITIALIZATION}}
  }, []);

  // Handlers
  const {{EVENT_HANDLERS}}

  // Render methods
  const {{RENDER_METHODS}}

  return (
    <{{CONTAINER_COMPONENT}} style={styles.container}>
      {{SCREEN_CONTENT}}
    </{{CONTAINER_COMPONENT}}>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    {{CONTAINER_STYLES}}
  },
  {{ADDITIONAL_STYLES}}
});
```

### Reusable Component Template
```{{LANGUAGE_EXTENSION}}
// Reusable component
interface {{COMPONENT_NAME}}Props {
  {{PROP_DEFINITIONS}}
  style?: {{STYLE_TYPE}};
  onPress?: () => void;
}

export const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({
  {{PROP_DESTRUCTURING}},
  style,
  onPress
}) => {
  return (
    <{{BASE_COMPONENT}}
      style={[styles.{{COMPONENT_STYLE}}, style]}
      onPress={onPress}
      {{ADDITIONAL_PROPS}}
    >
      {{COMPONENT_CONTENT}}
    </{{BASE_COMPONENT}}>
  );
};

const styles = StyleSheet.create({
  {{COMPONENT_STYLE}}: {
    {{STYLE_DEFINITIONS}}
  }
});
```

## Navigation Setup

### {{NAVIGATION_LIBRARY}} Configuration
```{{LANGUAGE_EXTENSION}}
// Navigation structure
const {{STACK_NAME}}Stack = createStackNavigator<{{STACK_PARAM_LIST}}>();
const {{TAB_NAME}}Tab = createBottomTabNavigator<{{TAB_PARAM_LIST}}>();

// Main navigator
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <{{STACK_NAME}}Stack.Navigator
        initialRouteName="{{INITIAL_ROUTE}}"
        screenOptions={{
          {{SCREEN_OPTIONS}}
        }}
      >
        <{{STACK_NAME}}Stack.Screen
          name="{{SCREEN_NAME}}"
          component={{{SCREEN_COMPONENT}}}
          options={{
            {{SCREEN_SPECIFIC_OPTIONS}}
          }}
        />
      </{{STACK_NAME}}Stack.Navigator>
    </NavigationContainer>
  );
};

// Type definitions for navigation
export type {{STACK_PARAM_LIST}} = {
  {{ROUTE_DEFINITIONS}}
};
```

### Deep Linking
```{{LANGUAGE_EXTENSION}}
// Deep link configuration
const linking: LinkingOptions<{{ROOT_PARAM_LIST}}> = {
  prefixes: ['{{APP_SCHEME}}://', 'https://{{APP_DOMAIN}}'],
  config: {
    screens: {
      {{SCREEN_LINKS}}
    }
  }
};
```

## State Management

### {{STATE_MANAGEMENT}} Setup
```{{LANGUAGE_EXTENSION}}
// Store configuration
{{STATE_STORE_SETUP}}

// Slice/Reducer example
const {{SLICE_NAME}}Slice = createSlice({
  name: '{{SLICE_NAME}}',
  initialState: {{INITIAL_STATE}},
  reducers: {
    {{REDUCER_ACTIONS}}
  },
  extraReducers: (builder) => {
    {{ASYNC_ACTIONS}}
  }
});

// Async actions
export const {{ASYNC_ACTION_NAME}} = createAsyncThunk(
  '{{SLICE_NAME}}/{{ACTION_NAME}}',
  async ({{ACTION_PARAMS}}, { rejectWithValue }) => {
    try {
      const response = await {{API_CALL}};
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Selectors
export const {{SELECTOR_NAME}} = (state: RootState) => state.{{SLICE_NAME}}.{{PROPERTY}};
```

### Local State Management
```{{LANGUAGE_EXTENSION}}
// Custom hooks for local state
export const use{{FEATURE_NAME}} = () => {
  const [{{STATE_VARIABLES}}] = useState({{INITIAL_VALUES}});

  const {{METHODS}} = useCallback(() => {
    {{METHOD_IMPLEMENTATION}}
  }, [{{DEPENDENCIES}}]);

  useEffect(() => {
    {{SIDE_EFFECTS}}
  }, [{{EFFECT_DEPENDENCIES}}]);

  return {
    {{RETURN_VALUES}}
  };
};
```

## Styling & Theming

### Theme Configuration
```{{LANGUAGE_EXTENSION}}
// Theme definition
export const theme = {
  colors: {
    primary: '{{PRIMARY_COLOR}}',
    secondary: '{{SECONDARY_COLOR}}',
    background: '{{BACKGROUND_COLOR}}',
    surface: '{{SURFACE_COLOR}}',
    error: '{{ERROR_COLOR}}',
    success: '{{SUCCESS_COLOR}}',
    warning: '{{WARNING_COLOR}}',
    text: {
      primary: '{{PRIMARY_TEXT}}',
      secondary: '{{SECONDARY_TEXT}}',
      disabled: '{{DISABLED_TEXT}}'
    }
  },
  spacing: {
    xs: {{XS_SPACING}},
    sm: {{SM_SPACING}},
    md: {{MD_SPACING}},
    lg: {{LG_SPACING}},
    xl: {{XL_SPACING}}
  },
  typography: {
    {{TYPOGRAPHY_DEFINITIONS}}
  },
  borderRadius: {
    sm: {{SM_RADIUS}},
    md: {{MD_RADIUS}},
    lg: {{LG_RADIUS}}
  }
};

// Theme context
export const ThemeContext = createContext(theme);
export const useTheme = () => useContext(ThemeContext);
```

### Responsive Design
```{{LANGUAGE_EXTENSION}}
// Responsive utilities
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    isTablet: dimensions.width >= 768,
    isPhone: dimensions.width < 768,
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait'
  };
};

// Responsive styles
export const createResponsiveStyles = (baseStyles: any, tabletStyles: any = {}) => {
  return StyleSheet.create({
    ...baseStyles,
    ...Platform.select({
      ios: {
        ...baseStyles,
        ...(DeviceInfo.isTablet() ? tabletStyles : {})
      },
      android: {
        ...baseStyles,
        ...(DeviceInfo.isTablet() ? tabletStyles : {})
      }
    })
  });
};
```

## API Integration

### HTTP Client Setup
```{{LANGUAGE_EXTENSION}}
// API client configuration
class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      {{DEFAULT_HEADERS}}
    };
  }

  setAuthToken(token: string) {
    this.headers.Authorization = `Bearer ${token}`;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...this.headers,
        ...options.headers
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }

  // HTTP methods
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}
```

### Service Layer
```{{LANGUAGE_EXTENSION}}
// Service implementation
export class {{SERVICE_NAME}}Service {
  constructor(private apiClient: ApiClient) {}

  async {{METHOD_NAME}}({{PARAMETERS}}): Promise<{{RETURN_TYPE}}> {
    try {
      const response = await this.apiClient.{{HTTP_METHOD}}<{{RESPONSE_TYPE}}>(
        '{{ENDPOINT}}',
        {{REQUEST_BODY}}
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new {{SERVICE_NAME}}Error(error.message);
      }
      throw error;
    }
  }
}
```

## Device Features Integration

### Camera & Image Handling
```{{LANGUAGE_EXTENSION}}
// Camera utilities
export const useCameraPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  return hasPermission;
};

export const useImagePicker = () => {
  const pickImage = async (): Promise<ImageResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  };

  const takePhoto = async (): Promise<ImageResult | null> => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  };

  return { pickImage, takePhoto };
};
```

### Push Notifications
```{{LANGUAGE_EXTENSION}}
// Push notification setup
export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token || '');
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      {{HANDLE_NOTIFICATION_RESPONSE}}
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return {
    expoPushToken,
    notification
  };
};

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token || null;
}
```

## Performance Optimization

### Memory Management
```{{LANGUAGE_EXTENSION}}
// Image caching and optimization
export const useOptimizedImage = (uri: string) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedUri = await ImageCache.get(uri);
        if (cachedUri) {
          setImageUri(cachedUri);
          setLoading(false);
          return;
        }

        // Load and cache image
        const optimizedUri = await ImageCache.cache(uri, {
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 600
        });
        
        setImageUri(optimizedUri);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [uri]);

  return { imageUri, loading, error };
};
```

### List Performance
```{{LANGUAGE_EXTENSION}}
// Optimized list component
interface OptimizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const OptimizedList = <T,>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  refreshing,
  onRefresh
}: OptimizedListProps<T>) => {
  const renderOptimizedItem = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => {
      return renderItem(item, index);
    },
    [renderItem]
  );

  const getItemLayout = useCallback(
    (data: T[] | null | undefined, index: number) => ({
      length: {{ITEM_HEIGHT}},
      offset: {{ITEM_HEIGHT}} * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderOptimizedItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};
```

## Testing Strategy

### Component Testing
```{{LANGUAGE_EXTENSION}}
// Component test example
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { {{COMPONENT_NAME}} } from '../{{COMPONENT_NAME}}';

describe('{{COMPONENT_NAME}}', () => {
  test('renders correctly', () => {
    const { getByText } = render(
      <{{COMPONENT_NAME}} {{TEST_PROPS}} />
    );
    
    expect(getByText('{{EXPECTED_TEXT}}')).toBeTruthy();
  });

  test('handles user interaction', async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <{{COMPONENT_NAME}} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByTestId('{{TEST_ID}}'));
    
    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalled();
    });
  });
});
```

### E2E Testing
```{{LANGUAGE_EXTENSION}}
// E2E test example
describe('{{FEATURE_NAME}} Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('should {{TEST_DESCRIPTION}}', async () => {
    // Navigate to screen
    await element(by.id('{{SCREEN_ID}}')).tap();
    
    // Perform actions
    await element(by.id('{{INPUT_ID}}')).typeText('{{TEST_INPUT}}');
    await element(by.id('{{BUTTON_ID}}')).tap();
    
    // Verify results
    await expect(element(by.text('{{EXPECTED_RESULT}}'))).toBeVisible();
  });
});
```

## Platform-Specific Considerations

### iOS Specific
```{{LANGUAGE_EXTENSION}}
// iOS-specific implementations
if (Platform.OS === 'ios') {
  {{IOS_SPECIFIC_CODE}}
}

// iOS safe area handling
const iosStyles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  }
});
```

### Android Specific
```{{LANGUAGE_EXTENSION}}
// Android-specific implementations
if (Platform.OS === 'android') {
  {{ANDROID_SPECIFIC_CODE}}
}

// Android hardware back button
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    {{BACK_BUTTON_LOGIC}}
    return true; // Prevent default behavior
  });

  return () => backHandler.remove();
}, []);
```

<!-- Tool-specific instructions -->

<!-- AI:CLAUDE -->
Focus on mobile-specific patterns and cross-platform considerations.
Help with performance optimization and memory management.
Suggest improvements for user experience and accessibility.
Provide guidance on platform-specific implementations.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Navigate efficiently between screens and components.
Focus on rapid prototyping and UI development.
Help with platform-specific configurations and debugging.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive test cases for mobile scenarios.
Suggest security best practices for mobile applications.
Help with deployment and store submission processes.
<!-- /AI:COPILOT -->

<!-- AI:CODEIUM -->
Provide context-aware suggestions for mobile development.
Help with navigation patterns and state management.
Suggest optimizations for mobile performance and battery usage.
<!-- /AI:CODEIUM -->

## Build & Deployment

### Build Configuration
```{{CONFIG_EXTENSION}}
// Build configuration
{{BUILD_CONFIG}}
```

### App Store Deployment
```{{SCRIPT_EXTENSION}}
# iOS deployment script
{{IOS_DEPLOYMENT_SCRIPT}}

# Android deployment script
{{ANDROID_DEPLOYMENT_SCRIPT}}
```

### Code Signing
```{{CONFIG_EXTENSION}}
# Code signing configuration
{{CODE_SIGNING_CONFIG}}
```

---

*This configuration is managed by ContextHub. Edit this file to update all AI tool configurations.*