# {{PROJECT_NAME}} - Backend AI Context Configuration

## Project Overview
{{PROJECT_DESCRIPTION}}

**Backend Stack:**
- **Runtime:** {{RUNTIME}} (e.g., Node.js, Python, Go, Java)
- **Framework:** {{FRAMEWORK}} (e.g., Express, FastAPI, Gin, Spring Boot)
- **Database:** {{DATABASE}} (e.g., PostgreSQL, MongoDB, MySQL)
- **ORM/ODM:** {{ORM}} (e.g., Prisma, SQLAlchemy, GORM)
- **Authentication:** {{AUTH_STRATEGY}} (e.g., JWT, OAuth, Passport)
- **Caching:** {{CACHING_SOLUTION}} (e.g., Redis, Memcached)
- **Message Queue:** {{MESSAGE_QUEUE}} (e.g., RabbitMQ, Apache Kafka)

## Architecture Patterns

### Layered Architecture
```
{{PROJECT_NAME}}/
├── src/
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic layer
│   ├── repositories/      # Data access layer
│   ├── models/           # Data models/entities
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   ├── utils/            # Utility functions
│   └── types/            # Type definitions
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docs/                 # API documentation
└── {{CONFIG_FILES}}      # Configuration files
```

### Dependency Injection
```{{LANGUAGE_EXTENSION}}
// Service container setup
class Container {
  private services = new Map();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  get<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }
    return factory();
  }
}

// Usage
container.register('userRepository', () => new UserRepository(database));
container.register('userService', () => new UserService(container.get('userRepository')));
```

## API Design Standards

### RESTful API Design
```{{LANGUAGE_EXTENSION}}
// Controller template
export class {{RESOURCE_NAME}}Controller {
  constructor(private {{RESOURCE_NAME_LOWER}}Service: {{RESOURCE_NAME}}Service) {}

  // GET /{{RESOURCE_PLURAL}}
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {{RESOURCE_PLURAL}} = await this.{{RESOURCE_NAME_LOWER}}Service.findAll(req.query);
      res.json({
        success: true,
        data: {{RESOURCE_PLURAL}},
        meta: {{PAGINATION_META}}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /{{RESOURCE_PLURAL}}/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Service.findById(req.params.id);
      if (!{{RESOURCE_NAME_LOWER}}) {
        return res.status(404).json({
          success: false,
          error: '{{RESOURCE_NAME}} not found'
        });
      }
      res.json({
        success: true,
        data: {{RESOURCE_NAME_LOWER}}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /{{RESOURCE_PLURAL}}
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Service.create(req.body);
      res.status(201).json({
        success: true,
        data: {{RESOURCE_NAME_LOWER}}
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /{{RESOURCE_PLURAL}}/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Service.update(req.params.id, req.body);
      res.json({
        success: true,
        data: {{RESOURCE_NAME_LOWER}}
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE /{{RESOURCE_PLURAL}}/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.{{RESOURCE_NAME_LOWER}}Service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}
```

### Request/Response Standards
```{{LANGUAGE_EXTENSION}}
// Standardized API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error.stack);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

## Data Layer

### Database Models
```{{LANGUAGE_EXTENSION}}
// Model definition
{{MODEL_DEFINITION}}
```

### Repository Pattern
```{{LANGUAGE_EXTENSION}}
// Repository interface
interface {{RESOURCE_NAME}}Repository {
  findAll(options?: FindOptions): Promise<{{RESOURCE_NAME}}[]>;
  findById(id: string): Promise<{{RESOURCE_NAME}} | null>;
  findByEmail(email: string): Promise<{{RESOURCE_NAME}} | null>;
  create(data: Create{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}>;
  update(id: string, data: Update{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}>;
  delete(id: string): Promise<void>;
}

// Repository implementation
export class {{RESOURCE_NAME}}RepositoryImpl implements {{RESOURCE_NAME}}Repository {
  constructor(private db: DatabaseConnection) {}

  async findAll(options: FindOptions = {}): Promise<{{RESOURCE_NAME}}[]> {
    const query = this.buildQuery(options);
    return this.db.query(query);
  }

  async findById(id: string): Promise<{{RESOURCE_NAME}} | null> {
    return this.db.findOne({
      where: { id },
      include: {{INCLUDE_RELATIONS}}
    });
  }

  async create(data: Create{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}> {
    return this.db.create({
      data: {
        ...data,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(id: string, data: Update{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}> {
    return this.db.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete({
      where: { id }
    });
  }

  private buildQuery(options: FindOptions): QueryBuilder {
    let query = this.db.createQueryBuilder();

    if (options.search) {
      query = query.where('name ILIKE :search', { search: `%${options.search}%` });
    }

    if (options.sortBy) {
      query = query.orderBy(options.sortBy, options.sortOrder || 'ASC');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return query;
  }
}
```

## Business Logic Layer

### Service Pattern
```{{LANGUAGE_EXTENSION}}
// Service implementation
export class {{RESOURCE_NAME}}Service {
  constructor(
    private {{RESOURCE_NAME_LOWER}}Repository: {{RESOURCE_NAME}}Repository,
    private eventEmitter: EventEmitter,
    private logger: Logger
  ) {}

  async findAll(options: FindAllOptions): Promise<{{RESOURCE_NAME}}[]> {
    this.logger.info('Fetching {{RESOURCE_PLURAL_LOWER}}', { options });
    
    const {{RESOURCE_PLURAL_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Repository.findAll(options);
    
    this.logger.info('Fetched {{RESOURCE_PLURAL_LOWER}}', { count: {{RESOURCE_PLURAL_LOWER}}.length });
    
    return {{RESOURCE_PLURAL_LOWER}};
  }

  async findById(id: string): Promise<{{RESOURCE_NAME}} | null> {
    this.logger.info('Fetching {{RESOURCE_NAME_LOWER}} by ID', { id });
    
    const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Repository.findById(id);
    
    if (!{{RESOURCE_NAME_LOWER}}) {
      this.logger.warn('{{RESOURCE_NAME}} not found', { id });
    }
    
    return {{RESOURCE_NAME_LOWER}};
  }

  async create(data: Create{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}> {
    this.logger.info('Creating {{RESOURCE_NAME_LOWER}}', { data });
    
    // Validation
    await this.validateCreateData(data);
    
    // Business logic
    const processedData = await this.processCreateData(data);
    
    // Create record
    const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Repository.create(processedData);
    
    // Emit event
    this.eventEmitter.emit('{{RESOURCE_NAME_LOWER}}.created', {{RESOURCE_NAME_LOWER}});
    
    this.logger.info('{{RESOURCE_NAME}} created', { id: {{RESOURCE_NAME_LOWER}}.id });
    
    return {{RESOURCE_NAME_LOWER}};
  }

  async update(id: string, data: Update{{RESOURCE_NAME}}Data): Promise<{{RESOURCE_NAME}}> {
    this.logger.info('Updating {{RESOURCE_NAME_LOWER}}', { id, data });
    
    // Check if exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('{{RESOURCE_NAME}} not found');
    }
    
    // Validation
    await this.validateUpdateData(id, data);
    
    // Business logic
    const processedData = await this.processUpdateData(existing, data);
    
    // Update record
    const {{RESOURCE_NAME_LOWER}} = await this.{{RESOURCE_NAME_LOWER}}Repository.update(id, processedData);
    
    // Emit event
    this.eventEmitter.emit('{{RESOURCE_NAME_LOWER}}.updated', {{RESOURCE_NAME_LOWER}});
    
    this.logger.info('{{RESOURCE_NAME}} updated', { id });
    
    return {{RESOURCE_NAME_LOWER}};
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting {{RESOURCE_NAME_LOWER}}', { id });
    
    // Check if exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('{{RESOURCE_NAME}} not found');
    }
    
    // Business logic validations
    await this.validateDelete(existing);
    
    // Delete record
    await this.{{RESOURCE_NAME_LOWER}}Repository.delete(id);
    
    // Emit event
    this.eventEmitter.emit('{{RESOURCE_NAME_LOWER}}.deleted', { id });
    
    this.logger.info('{{RESOURCE_NAME}} deleted', { id });
  }

  private async validateCreateData(data: Create{{RESOURCE_NAME}}Data): Promise<void> {
    {{VALIDATION_LOGIC}}
  }

  private async validateUpdateData(id: string, data: Update{{RESOURCE_NAME}}Data): Promise<void> {
    {{UPDATE_VALIDATION_LOGIC}}
  }

  private async validateDelete({{RESOURCE_NAME_LOWER}}: {{RESOURCE_NAME}}): Promise<void> {
    {{DELETE_VALIDATION_LOGIC}}
  }

  private async processCreateData(data: Create{{RESOURCE_NAME}}Data): Promise<Create{{RESOURCE_NAME}}Data> {
    {{PROCESSING_LOGIC}}
    return data;
  }

  private async processUpdateData(existing: {{RESOURCE_NAME}}, data: Update{{RESOURCE_NAME}}Data): Promise<Update{{RESOURCE_NAME}}Data> {
    {{UPDATE_PROCESSING_LOGIC}}
    return data;
  }
}
```

## Authentication & Authorization

### JWT Authentication
```{{LANGUAGE_EXTENSION}}
// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Role-based authorization
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRoles = req.user.roles || [];
    const hasPermission = roles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

## Error Handling

### Custom Error Classes
```{{LANGUAGE_EXTENSION}}
// Base error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
```

## Testing Strategy

### Unit Testing
```{{LANGUAGE_EXTENSION}}
// Service unit test
describe('{{RESOURCE_NAME}}Service', () => {
  let {{RESOURCE_NAME_LOWER}}Service: {{RESOURCE_NAME}}Service;
  let {{RESOURCE_NAME_LOWER}}Repository: jest.Mocked<{{RESOURCE_NAME}}Repository>;
  let eventEmitter: jest.Mocked<EventEmitter>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    {{RESOURCE_NAME_LOWER}}Repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    {{RESOURCE_NAME_LOWER}}Service = new {{RESOURCE_NAME}}Service(
      {{RESOURCE_NAME_LOWER}}Repository,
      eventEmitter,
      logger
    );
  });

  describe('create', () => {
    test('should create {{RESOURCE_NAME_LOWER}} successfully', async () => {
      const createData = {{MOCK_CREATE_DATA}};
      const created{{RESOURCE_NAME}} = {{MOCK_CREATED_RESOURCE}};

      {{RESOURCE_NAME_LOWER}}Repository.create.mockResolvedValue(created{{RESOURCE_NAME}});

      const result = await {{RESOURCE_NAME_LOWER}}Service.create(createData);

      expect({{RESOURCE_NAME_LOWER}}Repository.create).toHaveBeenCalledWith(createData);
      expect(eventEmitter.emit).toHaveBeenCalledWith('{{RESOURCE_NAME_LOWER}}.created', created{{RESOURCE_NAME}});
      expect(result).toEqual(created{{RESOURCE_NAME}});
    });

    test('should throw validation error for invalid data', async () => {
      const invalidData = {{MOCK_INVALID_DATA}};

      await expect({{RESOURCE_NAME_LOWER}}Service.create(invalidData)).rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Testing
```{{LANGUAGE_EXTENSION}}
// Integration test
describe('{{RESOURCE_NAME}} API', () => {
  let app: Application;
  let database: TestDatabase;

  beforeAll(async () => {
    database = new TestDatabase();
    await database.connect();
    app = createApp(database);
  });

  afterAll(async () => {
    await database.disconnect();
  });

  beforeEach(async () => {
    await database.clear();
  });

  describe('POST /{{RESOURCE_PLURAL_LOWER}}', () => {
    test('should create {{RESOURCE_NAME_LOWER}} successfully', async () => {
      const createData = {{MOCK_CREATE_DATA}};

      const response = await request(app)
        .post('/{{RESOURCE_PLURAL_LOWER}}')
        .send(createData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          {{EXPECTED_RESPONSE_FIELDS}}
        }
      });
    });

    test('should return validation error for invalid data', async () => {
      const invalidData = {{MOCK_INVALID_DATA}};

      const response = await request(app)
        .post('/{{RESOURCE_PLURAL_LOWER}}')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringMatching(/validation/i)
      });
    });
  });
});
```

## Logging & Monitoring

### Structured Logging
```{{LANGUAGE_EXTENSION}}
// Logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: '{{SERVICE_NAME}}',
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Health Checks
```{{LANGUAGE_EXTENSION}}
// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalAPI: await checkExternalAPI()
  };

  const isHealthy = Object.values(checks).every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  });
};
```

<!-- Tool-specific instructions -->

<!-- AI:CLAUDE -->
Focus on clean architecture patterns and SOLID principles.
Help with complex business logic and data modeling.
Suggest improvements for scalability and maintainability.
Provide guidance on testing strategies and error handling.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Navigate efficiently between layers (controllers, services, repositories).
Focus on API design and database optimization.
Help with configuration management and environment setup.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive test suites and API documentation.
Suggest security best practices and performance optimizations.
Help with deployment and infrastructure configuration.
<!-- /AI:COPILOT -->

<!-- AI:CODEIUM -->
Provide context-aware suggestions for business logic.
Help maintain consistency across service implementations.
Suggest patterns for common backend challenges.
<!-- /AI:CODEIUM -->

## Security Best Practices

### Input Validation
```{{LANGUAGE_EXTENSION}}
// Request validation middleware
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details
      });
    }
    
    req.body = value;
    next();
  };
};
```

### Rate Limiting
```{{LANGUAGE_EXTENSION}}
// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
```

## Deployment

### Environment Configuration
```{{CONFIG_EXTENSION}}
# Environment variables
{{ENV_CONFIGURATION}}
```

### Docker Configuration
```dockerfile
# Dockerfile
{{DOCKER_CONFIG}}
```

---

*This configuration is managed by ContextHub. Edit this file to update all AI tool configurations.*