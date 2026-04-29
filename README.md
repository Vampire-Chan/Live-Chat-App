# Kōru - Collaborative Team Messaging Platform

Kōru is a modern, real-time team collaboration platform built to elevate workplace communication. Featuring a beautiful, dark-themed, glassmorphic UI, Kōru delivers instant messaging, threaded conversations, dynamic emoji reactions, and actionable question resolutions.

## Features

- ⚡ **Real-Time Messaging**: Instant delivery and typing indicators powered by Socket.io.
- 🧵 **Threaded Replies**: Keep channels clutter-free with dedicated side-panel threads.
- ✅ **Question Resolution**: Mark question-tagged messages as resolved with a summary (restricted to Reviewers/Decision Makers).
- 😊 **Emoji Reactions**: Interactive hover-based emoji picker with tooltips showing who reacted.
- 🎨 **Modern Design**: Fluid Framer Motion animations, dark aesthetics, and glassmorphism.
- 🔐 **Secure Authentication**: JWT-based stateless sessions with bcrypt password hashing.

## Tech Stack

**Frontend**
- React 18 (Vite)
- Framer Motion
- Axios
- Socket.io-client
- Lucide React (Icons)

**Backend**
- Node.js & Express
- PostgreSQL (pg)
- Socket.io
- JSON Web Tokens (JWT) & bcrypt

---

## Local Development Setup

### 1. Database Setup
Kōru requires a PostgreSQL database. 
1. Create a database (e.g., `contextchat`).
2. Run the SQL script located at `./database.sql` to generate the schema.

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `server/.env` file with the following variables:
| Variable | Description |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string (e.g., `postgres://user:pass@localhost:5432/contextchat`) |
| `JWT_SECRET` | Secret key for signing tokens |
| `CLIENT_URL` | URL of the frontend (defaults to `http://localhost:5173`) |
| `PORT` | Backend port (defaults to 5001) |

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Start the frontend development server:
```bash
npm run dev
```

---

## Production Deployment (Railway)

Kōru is production-ready and optimized for deployment on [Railway.app](https://railway.app).

### Step 1: Push to GitHub
Commit your code and push the repository to GitHub.

### Step 2: Provision Infrastructure
1. Log into Railway and create a new project.
2. Add a **PostgreSQL** plugin from the Railway dashboard.
3. Open the PostgreSQL variables and copy the `DATABASE_URL`.
4. Open the DB Query interface in Railway and execute the contents of `database.sql` to build your tables.

### Step 3: Deploy the Backend
1. In Railway, click **New > GitHub Repo** and select your repository.
2. Set the root directory for this service to `/server`.
3. Go to the **Variables** tab and add:
   - `DATABASE_URL`: (Paste from Step 2)
   - `JWT_SECRET`: A secure, random string.
   - `CLIENT_URL`: The URL of your frontend (you can set this after deploying the frontend).
4. Railway will automatically inject the `PORT` variable and use the `npm start` script (`node index.js`).

### Step 4: Deploy the Frontend
1. In Railway, click **New > GitHub Repo** and select the same repository again to create a second service.
2. Set the root directory for this service to `/client`.
3. In the **Variables** tab, add:
   - `VITE_API_URL`: The public domain of your backend service (e.g., `https://your-backend.up.railway.app`).
4. Railway will automatically detect it as a static Vite site and run `npm run build`.

### Step 5: Final Verification
- Ensure the backend's `CLIENT_URL` environment variable matches the public domain Railway assigned to your frontend.
- Visit your frontend URL. If the backend is connected successfully, the "Live" indicator will be green in the chat header!
