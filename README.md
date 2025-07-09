# 🧠 Dont-Forget MCP Server

A Model Context Protocol (MCP) server that provides AI programming agents with persistent memory capabilities, allowing them to remember past mistakes, successful changes, and build contextual knowledge over time.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)  
- [Usage & Configuration](#usage--configuration)
- [Agent Rules by Language](#agent-rules-by-language)
- [Tool Reference](#tool-reference)
- [Web Debug Interface](#web-debug-interface)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## 🎯 Overview

The Dont-Forget MCP server helps AI agents:

- **Remember Mistakes**: Store summaries of errors with correct solutions
- **Track Changes**: Maintain history of successful modifications  
- **Build Context**: Search relevant past experiences before starting new tasks
- **Learn Patterns**: Identify recurring issues and solutions across components

### Key Features

- ✅ **Persistent Memory**: SQLite + Vector database storage
- ✅ **Contextual Search**: Vector-based similarity search for relevant history
- ✅ **Web Debug Interface**: Browse data and test tools via web UI
- ✅ **Language Agnostic**: Works with any programming language
- ✅ **Component Tracking**: Track changes by files, classes, functions, etc.

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18.19.0 or higher
- npm or yarn package manager

### Install

```bash
npm install -g dont-forget
```

### Start Server

```bash
# Basic MCP server
dont-forget

# With web debugging interface  
dont-forget --debug-server

# Custom configuration
dont-forget --debug-server --web-port 3001 --data-dir ./my-data
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--debug-server` | Start web debugging interface | Off |
| `--web-port <port>` | Web server port | 3001 |
| `--data-dir <path>` | Database storage directory | `./data` |

## 🛠 Usage & Configuration

### MCP Client Integration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "dont-forget": {
      "command": "dont-forget",
      "args": ["--debug-server"]
    }
  }
}
```

### Environment Variables

```bash
export DONT_FORGET_DATA_DIR="/path/to/data"  # Override data directory
```

## 📝 Agent Rules by Language

### JavaScript/TypeScript

**Component Definition**: A component is any of:
- **File/Module**: `src/utils/validation.ts`, `components/Button.jsx`
- **Class**: `UserService`, `ApiClient`, `ComponentName`
- **Function**: `validateEmail()`, `fetchUserData()`, `useCustomHook()`
- **React Component**: `<UserProfile>`, `<DataTable>`, `<LoginForm>`
- **npm Package**: `lodash`, `react-router`, `@types/node`

**Agent Rules**:
```markdown
# Remembering Work and Mistakes (JavaScript/TypeScript)

- A component is defined as a file/module, class, function, React component, or npm package
- Always when you make a mistake use the remember-mistake tool summarizing the mistake, the correct action, and the components (files/classes/functions/packages) involved.
  - Example: "TypeError in user validation" → Components: ["src/utils/validation.ts", "validateEmail()", "UserService"]
- Always when you finish a task provide a summary and detailed description with the remember-change tool. List components and summaries of what changed.
  - Example: "Added user authentication" → Components: ["src/auth/AuthService.ts", "components/LoginForm.tsx", "middleware/auth.js"]
- Before beginning work use get-potential-context tool, passing in the task summary and any relevant components.
  - Example: Task "Fix login bug" → Components: ["AuthService", "LoginForm", "JWT validation"]
```

### Go

**Component Definition**: A component is any of:
- **Package**: `main`, `user`, `auth`, `github.com/gin-gonic/gin`
- **Module**: `go.mod` module name, `github.com/myorg/myproject`
- **Struct**: `User`, `HTTPClient`, `DatabaseConnection`
- **Interface**: `UserRepository`, `Logger`, `HTTPHandler`
- **Function**: `ValidateInput()`, `ProcessRequest()`, `main()`

**Agent Rules**:
```markdown
# Remembering Work and Mistakes (Go)

- A component is defined as a package, module, struct, interface, or function
- Always when you make a mistake use the remember-mistake tool summarizing the mistake, the correct action, and the components (packages/structs/functions) involved.
  - Example: "Nil pointer dereference in user service" → Components: ["user package", "User struct", "GetUserByID()"]
- Always when you finish a task provide a summary and detailed description with the remember-change tool. List components and summaries of what changed.
  - Example: "Implemented user authentication" → Components: ["auth package", "UserService struct", "ValidateToken()", "main.go"]
- Before beginning work use get-potential-context tool, passing in the task summary and any relevant components.
  - Example: Task "Fix database connection" → Components: ["database package", "Connection struct", "Connect()"]
```

### Rust

**Component Definition**: A component is any of:
- **Crate**: `serde`, `tokio`, `my_project`, binary/library crates
- **Module**: `mod auth`, `mod utils`, `std::collections`
- **Struct**: `User`, `Config`, `DatabasePool`
- **Trait**: `Serialize`, `Display`, `UserRepository`
- **Function**: `validate_input()`, `process_request()`, `main()`
- **Macro**: `println!`, `vec!`, custom derive macros

**Agent Rules**:
```markdown
# Remembering Work and Mistakes (Rust)

- A component is defined as a crate, module, struct, trait, function, or macro
- Always when you make a mistake use the remember-mistake tool summarizing the mistake, the correct action, and the components (crates/modules/structs/traits/functions) involved.
  - Example: "Borrow checker error in user validation" → Components: ["validation module", "User struct", "validate_user()", "String ownership"]
- Always when you finish a task provide a summary and detailed description with the remember-change tool. List components and summaries of what changed.
  - Example: "Added async HTTP client" → Components: ["tokio crate", "http module", "Client struct", "async fn fetch_data()"]
- Before beginning work use get-potential-context tool, passing in the task summary and any relevant components.
  - Example: Task "Fix lifetime issues" → Components: ["User struct", "borrow checker", "lifetime annotations"]
```

### C#

**Component Definition**: A component is any of:
- **Namespace**: `MyApp.Services`, `System.Collections.Generic`, `Microsoft.AspNetCore`
- **Class**: `UserService`, `ApiController`, `DatabaseContext`
- **Method**: `ValidateUser()`, `ProcessRequest()`, `Main()`
- **Interface**: `IUserRepository`, `ILogger`, `IServiceCollection`
- **Project/Assembly**: `MyApp.Web.dll`, `MyApp.Core`, `MyApp.Data`
- **NuGet Package**: `Newtonsoft.Json`, `EntityFramework`, `AutoMapper`

**Agent Rules**:
```markdown
# Remembering Work and Mistakes (C#)

- A component is defined as a namespace, class, method, interface, project/assembly, or NuGet package
- Always when you make a mistake use the remember-mistake tool summarizing the mistake, the correct action, and the components (namespaces/classes/methods/packages) involved.
  - Example: "NullReferenceException in user service" → Components: ["MyApp.Services", "UserService class", "GetUserById() method"]
- Always when you finish a task provide a summary and detailed description with the remember-change tool. List components and summaries of what changed.
  - Example: "Implemented dependency injection" → Components: ["MyApp.Web", "Startup class", "ConfigureServices()", "Microsoft.Extensions.DependencyInjection"]
- Before beginning work use get-potential-context tool, passing in the task summary and any relevant components.
  - Example: Task "Fix Entity Framework migration" → Components: ["MyApp.Data", "DatabaseContext", "EntityFramework package"]
```

## 🔧 Tool Reference

### `remember-change`
**Purpose**: Record successful changes and improvements
**Parameters**:
- `summary`: One-sentence description of the change
- `detailedDescription`: Comprehensive details including rationale and implementation
- `components`: Array of affected components (files, classes, functions, etc.)

**Example**:
```json
{
  "summary": "Added user authentication with JWT tokens",
  "detailedDescription": "Implemented JWT-based authentication system with login/logout endpoints, token validation middleware, and secure password hashing using bcrypt. Added refresh token mechanism for better security.",
  "components": ["src/auth/AuthService.ts", "middleware/auth.js", "routes/auth.js", "bcrypt package", "jsonwebtoken package"]
}
```

### `remember-mistake`
**Purpose**: Record mistakes and their solutions for future reference
**Parameters**:
- `summary`: Brief description of the mistake/problem
- `correctAction`: Detailed explanation of the solution
- `components`: Array of components involved in the mistake

**Example**:
```json
{
  "summary": "Memory leak caused by unclosed database connections",
  "correctAction": "Always call connection.close() in finally blocks or use try-with-resources pattern. Implemented connection pooling to manage connections automatically.",
  "components": ["DatabaseManager class", "getUserData() method", "connection pooling", "try-with-resources"]
}
```

### `get-potential-context`
**Purpose**: Search for relevant past experiences before starting work
**Parameters**:
- `taskSummary`: Description of the current task
- `componentsOfInterest`: Array of components you'll be working with

**Example**:
```json
{
  "taskSummary": "Fix user registration validation errors",
  "componentsOfInterest": ["UserService", "validation.js", "registration form", "email validation"]
}
```

### `change-details`
**Purpose**: Get detailed information about a specific change
**Parameters**:
- `id`: Numeric ID of the change record

### `problem-details`
**Purpose**: Get detailed information about a specific problem/mistake
**Parameters**:
- `id`: Numeric ID of the problem record

### `get-component-history`
**Purpose**: Get full history (changes and problems) for a specific component
**Parameters**:
- `componentName`: Name of the component to search for

## 🌐 Web Debug Interface

Access the debugging interface at `http://localhost:3001` when running with `--debug-server`.

### Features

**Database Browser**:
- View all changes with timestamps and components
- Browse problems/mistakes with solutions
- Component usage statistics and history
- Detailed modal views for each record

**Tool Executor**:
- Interactive forms for all tools
- Real-time JSON result display
- Form validation and error handling
- Quick testing without MCP client

**Interaction Logs** *(Coming Soon)*:
- Tool execution history
- Performance metrics
- Search query logs

### Screenshots

```
🧠 Dont-Forget Debug Interface
┌─────────────────────────────────────────┐
│ Database Browser | Tool Executor | Logs │
├─────────────────────────────────────────┤
│ Changes | Problems | Components          │
├─────────────────────────────────────────┤
│ ID | Summary              | Components   │
│ 1  | Added authentication | AuthService  │
│ 2  | Fixed validation bug | UserService  │
└─────────────────────────────────────────┘
```

## 💡 Best Practices

### Component Naming

**✅ Good Examples**:
- `src/services/UserService.ts` (specific file path)
- `validateEmail() function` (specific function with context)
- `User class in models/User.js` (class with file context)
- `react-router package` (specific package name)

**❌ Avoid**:
- `file` (too vague)
- `function` (not specific)
- `the validation code` (unclear)

### Change Descriptions

**✅ Good Summary**: "Added rate limiting to API endpoints"

**✅ Good Detailed Description**:
```
Implemented rate limiting middleware using express-rate-limit package. 
Applied 100 requests per 15-minute window for general endpoints and 
5 requests per 15-minute window for auth endpoints. Added Redis store 
for distributed rate limiting across multiple server instances.
```

**✅ Good Components**: 
```
["middleware/rateLimiter.js", "express-rate-limit package", 
 "routes/api.js", "routes/auth.js", "Redis configuration"]
```

### Mistake Documentation

**✅ Good Mistake Summary**: "Race condition in user session cleanup"

**✅ Good Correct Action**:
```
The cleanup function was accessing shared session data without proper 
locking, causing data corruption. Fixed by implementing mutex locks 
around session access and using atomic operations for session updates. 
Also added proper error handling for concurrent access scenarios.
```

### Context Searching

**Before starting work**, always search for context:

```json
{
  "taskSummary": "Implement user profile editing",
  "componentsOfInterest": ["UserService", "profile components", "validation", "API endpoints"]
}
```

This helps you:
- Avoid repeating past mistakes
- Learn from previous similar implementations  
- Understand component relationships
- Apply proven patterns

## 📚 API Reference

### REST Endpoints (Debug Server)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/changes` | List all changes |
| `GET` | `/api/problems` | List all problems |
| `GET` | `/api/components` | List all components |
| `GET` | `/api/changes/:id` | Get change details |
| `GET` | `/api/problems/:id` | Get problem details |
| `GET` | `/api/components/:name/history` | Get component history |
| `POST` | `/api/tools/remember-change` | Execute remember-change tool |
| `POST` | `/api/tools/remember-mistake` | Execute remember-mistake tool |
| `POST` | `/api/tools/get-potential-context` | Execute context search |
| `POST` | `/api/search` | Search for relevant context |

### Database Schema

**Changes Table**:
- `id`: Primary key
- `summary`: Brief description
- `detailed_description`: Full implementation details
- `timestamp`: Creation time
- `components`: Related components (via junction table)

**Problems Table**:
- `id`: Primary key  
- `summary`: Brief problem description
- `correct_action`: Solution details
- `timestamp`: Creation time
- `components`: Related components (via junction table)

**Components Table**:
- `id`: Primary key
- `name`: Component identifier
- Relationships to changes and problems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/dont-forget/issues)
- **Documentation**: This README and `/docs` folder
- **Debug Interface**: Use `--debug-server` for interactive debugging

---

*Happy coding with persistent memory! 🧠✨*
