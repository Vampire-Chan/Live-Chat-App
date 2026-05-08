%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph LR
    A["👤 System User"]
    
    A -->|Register/Login| UC1["🔐 Authentication"]
    A -->|View Workspaces| UC2["📁 Workspace Access"]
    A -->|View Channels| UC3["💬 Channel Navigation"]
    A -->|Send Messages| UC4["✍️ Send Message"]
    A -->|Reply| UC5["🔗 Thread Reply"]
    A -->|Add Emoji| UC6["😊 React to Message"]
    
    UC1 -->|Success| UC2
    UC2 --> UC3
    UC3 --> UC4
    UC4 --> UC5
    UC4 --> UC6
    
    UC7["✅ Resolve Question"]
    UC6 -.->|Reviewer/Decision Maker| UC7
    
    style A fill:#ec4899,stroke:#be185d,color:#fff
    style UC1 fill:#3b82f6,stroke:#1e40af,color:#fff
    style UC2 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style UC3 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style UC4 fill:#06b6d4,stroke:#0369a1,color:#fff
    style UC5 fill:#06b6d4,stroke:#0369a1,color:#fff
    style UC6 fill:#f59e0b,stroke:#d97706,color:#fff
    style UC7 fill:#10b981,stroke:#047857,color:#fff
