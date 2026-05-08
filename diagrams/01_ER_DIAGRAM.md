%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b', 'secondBkg':'#334155'}}}%%
erDiagram
    USERS ||--o{ WORKSPACE_MEMBERS : has
    USERS ||--o{ MESSAGES : creates
    USERS ||--o{ REACTIONS : adds
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains
    WORKSPACES ||--o{ CHANNELS : has
    CHANNELS ||--o{ MESSAGES : receives
    MESSAGES ||--o{ MESSAGES : "parent_id"
    MESSAGES ||--o{ REACTIONS : receives

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        string avatar_url
        timestamp created_at
    }

    WORKSPACES {
        int id PK
        string name
        string slug UK
        timestamp created_at
    }

    WORKSPACE_MEMBERS {
        int id PK
        int user_id FK
        int workspace_id FK
        enum role
        timestamp created_at
    }

    CHANNELS {
        int id PK
        int workspace_id FK
        string name
        string description
        timestamp created_at
    }

    MESSAGES {
        int id PK
        int channel_id FK
        int user_id FK
        string content
        enum tag
        int parent_id FK
        boolean resolved
        string resolution_summary
        timestamp created_at
        timestamp updated_at
    }

    REACTIONS {
        int id PK
        int message_id FK
        int user_id FK
        string emoji
        timestamp created_at
    }
