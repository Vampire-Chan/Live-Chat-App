%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    A["📋 Project Start"]
    
    B["Design & Architecture<br/>Duration: 2 weeks"]
    C["Backend Development<br/>Duration: 3 weeks"]
    D["Frontend Development<br/>Duration: 2.5 weeks"]
    E["Integration<br/>Duration: 1 week"]
    F["Testing & QA<br/>Duration: 1 week"]
    G["Documentation<br/>Duration: 1 week"]
    H["Deployment<br/>Duration: 3 days"]
    
    I["🎯 Production Go-live"]
    
    A --> B
    B --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    
    style A fill:#ec4899,stroke:#be185d,color:#fff,stroke-width:3px
    style B fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:2px
    style C fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
    style E fill:#06b6d4,stroke:#0369a1,color:#fff,stroke-width:2px
    style F fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    style G fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px
    style H fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:2px
    style I fill:#10b981,stroke:#047857,color:#fff,stroke-width:3px
