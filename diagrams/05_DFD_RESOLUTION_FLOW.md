%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    A["4.2 Message Resolution Process"]
    B["User Selects 'Resolve'"]
    C["Check User Role"]
    D{Is Decision Maker<br/>or Reviewer?}
    E["Update DB:<br/>resolved=true<br/>summary=text"]
    F["Emit:<br/>thread_resolved"]
    G["Update UI:<br/>Show Resolution"]
    H["Return 403<br/>Forbidden"]
    
    A --> B
    B --> C
    C --> D
    D -->|"Yes"| E
    D -->|"No"| H
    E --> F
    F --> G
    
    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style D fill:#f59e0b,stroke:#d97706,color:#fff
    style E fill:#06b6d4,stroke:#0369a1,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style G fill:#10b981,stroke:#047857,color:#fff
    style H fill:#ef4444,stroke:#dc2626,color:#fff
