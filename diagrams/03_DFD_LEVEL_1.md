%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
graph TD
    A["👤 User Input<br/>(Messages/Actions)"]
    
    B["1. Authentication<br/>Process"]
    C["2. Workspace<br/>Management"]
    D["3. Channel<br/>Management"]
    E["4. Message<br/>Handling"]
    F["5. Reaction<br/>System"]
    
    DB[(🗄️ Database)]
    RT["⚡ Real-time<br/>Broadcasting"]
    
    A -->|"Register/Login"| B
    A -->|"Select Workspace"| C
    A -->|"Select Channel"| D
    A -->|"Send/Reply"| E
    A -->|"React to Message"| F
    
    B -->|"Store/Verify"| DB
    C -->|"Fetch/Update"| DB
    D -->|"Fetch/Update"| DB
    E -->|"Store/Fetch"| DB
    F -->|"Store/Fetch"| DB
    
    DB -->|"Updated Data"| RT
    E -->|"Emit Event"| RT
    F -->|"Emit Event"| RT
    
    RT -->|"Real-time<br/>Updates"| A
    
    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style E fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style F fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style DB fill:#10b981,stroke:#047857,color:#fff
    style RT fill:#f59e0b,stroke:#d97706,color:#fff
