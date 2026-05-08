%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    A["🔄 User Initiates Action"]
    
    B["Validate Input<br/>- Check for empty/invalid"]
    C{Is Valid?}
    D["Process Request<br/>- Apply Business Logic"]
    E["Update Database<br/>- Persist Changes"]
    F{Success?}
    G["Emit Event<br/>- Notify Other Users"]
    H["Send Response<br/>- Return Success"]
    I["Update Local State<br/>- Update UI"]
    J["Display Result<br/>- Show to User"]
    
    K["Return Error<br/>- Send Error Response"]
    L["Handle Error<br/>- Show Error UI"]
    
    A --> B
    B --> C
    C -->|Invalid| K
    C -->|Valid| D
    D --> E
    E --> F
    F -->|Failed| K
    F -->|Success| G
    G --> H
    H --> I
    I --> J
    K --> L
    
    style A fill:#ec4899,stroke:#be185d,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style E fill:#06b6d4,stroke:#0369a1,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
    style H fill:#10b981,stroke:#047857,color:#fff
    style I fill:#10b981,stroke:#047857,color:#fff
    style J fill:#10b981,stroke:#047857,color:#fff
    style K fill:#ef4444,stroke:#dc2626,color:#fff
    style L fill:#ef4444,stroke:#dc2626,color:#fff
