%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
sequenceDiagram
    participant User1 as 👤 User A
    participant User2 as 👤 User B
    participant Frontend1 as 💻 Frontend A
    participant Frontend2 as 💻 Frontend B
    participant Backend as 🖥️ Backend
    participant Socket as ⚡ Socket.io
    
    rect rgb(200, 150, 255)
    User1->>Frontend1: Types message
    Frontend1->>Backend: emit('typing_start')
    Backend->>Socket: typing_start event
    Socket->>Frontend2: Emit: user_typing
    Frontend2->>User2: Show "User A is typing..."
    end
    
    rect rgb(100, 200, 255)
    User1->>Frontend1: Send message
    Frontend1->>Backend: emit('send_message')
    Backend->>Backend: Save to DB
    Backend->>Socket: Broadcast: new_message
    Socket->>Frontend2: new_message event
    Frontend2->>Frontend2: Add to message list
    Frontend2->>User2: Display message
    Frontend1->>Frontend1: Clear typing indicator
    end
