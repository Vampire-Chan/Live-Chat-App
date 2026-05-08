%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 💻 React Frontend
    participant Backend as 🖥️ Express Backend
    participant Socket as ⚡ Socket.io
    participant DB as 🗄️ Database
    
    User->>Frontend: Enter message & send
    Frontend->>Backend: POST /api/channels/:id/messages
    Backend->>DB: INSERT message record
    DB-->>Backend: Return message with ID
    Backend->>Frontend: HTTP Response
    Backend->>Socket: Broadcast message event
    Socket->>Frontend: WebSocket: new_message
    Frontend->>Frontend: Update message list
    Frontend->>User: Display message
    
    Note over Socket: Other connected users receive in real-time
