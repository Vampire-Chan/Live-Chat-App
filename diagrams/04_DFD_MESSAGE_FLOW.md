%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    A["4.1 Send Message"]
    B["Validate Input"]
    C["Create DB Record"]
    D["Fetch Full Message Object"]
    E["Broadcast via Socket.io"]
    F["Update Client UI"]
    
    A --> B
    B -->|"Valid"| C
    C --> D
    D --> E
    E --> F
    
    B -->|"Invalid"| G["Return Error"]
    
    H["Message Event"]
    I["User ID, Channel ID"]
    J["Content, Tag, ParentID"]
    
    H --> I
    H --> J
    I --> A
    J --> A
    
    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C fill:#06b6d4,stroke:#0369a1,color:#fff
    style D fill:#06b6d4,stroke:#0369a1,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#10b981,stroke:#047857,color:#fff
    style G fill:#ef4444,stroke:#dc2626,color:#fff
    style H fill:#ec4899,stroke:#be185d,color:#fff
    style I fill:#ec4899,stroke:#be185d,color:#fff
    style J fill:#ec4899,stroke:#be185d,color:#fff
