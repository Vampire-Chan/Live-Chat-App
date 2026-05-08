%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#1e293b', 'primaryTextColor':'#f1f5f9', 'primaryBorderColor':'#475569', 'lineColor':'#64748b'}}}%%
gantt
    title Kōru Project Development Timeline
    dateFormat YYYY-MM-DD
    
    section Planning & Design
    Requirements Analysis           :p1, 2026-01-06, 3d
    Architecture Design             :p2, after p1, 4d
    Database Schema Design          :p3, after p2, 3d
    UI/UX Mockups                   :p4, after p3, 3d
    
    section Backend Development
    API Route Implementation        :b1, 2026-01-20, 5d
    Authentication System          :b2, after b1, 3d
    Real-time Socket.io            :b3, after b2, 4d
    Database Integration           :b4, after b3, 3d
    Error Handling & Validation    :b5, after b4, 2d
    
    section Frontend Development
    Component Architecture         :f1, 2026-01-20, 4d
    Chat Components               :f2, after f1, 5d
    Authentication Pages          :f3, after f2, 3d
    Real-time Integration         :f4, after f3, 4d
    Styling & Animations          :f5, after f4, 3d
    
    section Testing & Integration
    Unit Testing                   :t1, 2026-02-10, 3d
    Integration Testing           :t2, after t1, 3d
    End-to-End Testing           :t3, after t2, 2d
    Bug Fixes                     :t4, after t3, 2d
    
    section Documentation & Deploy
    Project Documentation         :d1, 2026-02-20, 3d
    Deployment Setup              :d2, after d1, 2d
    Production Go-live            :d3, after d2, 1d
    
    milestone M1, 2026-01-19, 0d
    milestone M2, 2026-02-10, 0d
    milestone M3, 2026-02-20, 0d
