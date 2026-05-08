%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TB
    User["👤 User"]
    System["🔷 Kōru System<br/>(Real-time Messaging Platform)"]
    DB[(🗄️ PostgreSQL<br/>Database)]
    Socket["⚡ Socket.io Server<br/>(WebSocket)"]
    
    User -->|"HTTP/REST"| System
    User -->|"WebSocket"| System
    System -->|"Query/Update"| DB
    System -->|"Events"| Socket
    Socket -->|"Real-time<br/>Messages"| User
    
    style User fill:#3b82f6,stroke:#1e40af,color:#fff
    style System fill:#06b6d4,stroke:#0369a1,color:#fff
    style DB fill:#10b981,stroke:#047857,color:#fff
    style Socket fill:#f59e0b,stroke:#d97706,color:#fff
