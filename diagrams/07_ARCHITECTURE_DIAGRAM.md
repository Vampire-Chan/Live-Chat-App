%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    Frontend["React Frontend<br/>Components & State"]
    Router["React Router<br/>Navigation"]
    ApiService["API Service<br/>Axios Instance"]
    SocketManager["Socket.io Client<br/>Real-time Events"]
    
    Backend["Express Backend<br/>API Routes"]
    AuthMiddleware["Auth Middleware<br/>JWT Verification"]
    SocketHandler["Socket.io Server<br/>Event Handler"]
    Services["Business Logic<br/>Services"]
    
    DB[(PostgreSQL<br/>Database)]
    
    Frontend --> Router
    Frontend --> ApiService
    Frontend --> SocketManager
    
    ApiService -->|"HTTP Requests"| Backend
    SocketManager -->|"WebSocket"| SocketHandler
    
    Backend --> AuthMiddleware
    AuthMiddleware -->|"Protected Routes"| Services
    SocketHandler --> Services
    
    Services -->|"Query/Update"| DB
    DB -->|"Response"| Services
    Services -->|"Events"| SocketHandler
    SocketHandler -->|"Real-time Updates"| SocketManager
    
    Services -->|"JSON Response"| ApiService
    ApiService -->|"Update State"| Frontend
    SocketManager -->|"Update UI"| Frontend
    
    style Frontend fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style Router fill:#06b6d4,stroke:#0369a1,color:#fff
    style ApiService fill:#06b6d4,stroke:#0369a1,color:#fff
    style SocketManager fill:#f59e0b,stroke:#d97706,color:#fff
    style Backend fill:#3b82f6,stroke:#1e40af,color:#fff
    style AuthMiddleware fill:#ef4444,stroke:#dc2626,color:#fff
    style SocketHandler fill:#f59e0b,stroke:#d97706,color:#fff
    style Services fill:#10b981,stroke:#047857,color:#fff
    style DB fill:#6366f1,stroke:#4f46e5,color:#fff
