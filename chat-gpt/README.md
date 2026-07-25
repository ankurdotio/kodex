# CHAD GPT

A premium full-stack AI chat application built on React, Vite, Tailwind CSS, Express, TypeScript, and MongoDB, powered by the Mistral AI API.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/chatgpt_clone`)
- Docker & Docker Compose (optional, for running with containers)

### 1. Environment Configuration
Create a `.env` file inside the `server/` directory and configure the environment variables:

```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/chatgpt_clone
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_COOKIE_NAME=refreshToken
NODE_ENV=development
MISTRAL_API_KEY=your_mistral_api_key

# SMTP Settings (fallback — only used if BREVO_API_KEY is not set)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
MAIL_FROM=noreply@chatgpt-clone.local
SEND_MAIL=false           # Set to true to actually send emails. If false, codes are logged to terminal.
EMAIL_VERIFICATION=true  # Set to true to require OTP email verification on signup.

# Brevo HTTP API (recommended for cloud deployments — bypasses SMTP port blocks)
# Get your API key from: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=           # If set, all emails go via Brevo HTTP API over port 443 (HTTPS). SMTP settings above are ignored.
```

> **Email Delivery Strategy:**
> - **Local / dev**: Set `SEND_MAIL=false` — OTP codes are printed directly to the server terminal. No mail server needed.
> - **Cloud deployment**: Set `BREVO_API_KEY=your_key` and `SEND_MAIL=true`. Emails are sent via Brevo's HTTP API over HTTPS (port 443). This works on all cloud providers (Render, Railway, Fly.io, etc.) which block outbound SMTP ports (25, 465, 587).
> - **Self-hosted / VPS**: Set `SEND_MAIL=true` and configure the `SMTP_*` variables. Leave `BREVO_API_KEY` empty to use nodemailer SMTP directly.

### 2. Run Locally (Developer Mode)

#### Running the Server:
```bash
cd server
npm install
npm run dev
```

#### Running the Client:
```bash
cd client
npm install
npm run dev
```
The client application will start on [http://localhost:5173](http://localhost:5173).

---

### 3. Run with Docker Compose
To boot the database, server, and client concurrently using Docker:
```bash
docker-compose up --build
```
- **Client**: [http://localhost:5173](http://localhost:5173)
- **Server**: [http://localhost:3000](http://localhost:3000)
- **MongoDB**: Runs on port `27019`

If you compile files locally while Docker is running, remember to restart the backend container to sync compiled assets:
```bash
docker restart chatgpt-server
```

---

## Features & Refactoring Changes

1. **CHAD GPT Rebranding**: Fully rebranded from "Chat GPT" to "CHAD GPT". Customized document title tags, tab icons (favicon.ico), and headers.
2. **Dynamic Autogrow Textarea**: Replaced the input text field with a multi-line autogrowing textarea. Supports `Enter` to submit and `Shift + Enter` to insert a newline.
3. **Responsive Hamburger Sidebar**: Developed a slide-out sidebar drawer for mobile devices, triggered by a hamburger menu in the top bar.
4. **Instant URL & Route Transitions**: Combined chat views (`/chat` and `/chat/:id`) into a single route node (`/chat/:id?`) in React Router. Sessions are created instantly upon the first keystroke, and the route updates to the newly generated ID immediately before AI response streaming begins.
5. **Secure SSE Stream Spacing**: Wrapped Server-Sent Events (SSE) inside standard JSON packets (`data: {"text": "..."}\n\n`). This ensures that markdown formatting tokens, double newlines (`\n\n`), code block indentations, and leading spaces are preserved during AI streaming.
6. **Code Highlighting & Copy Button**: Built custom syntax highlighting for SQL, CSS, and HTML files, complete with a clipboard copy button on code headers.
7. **Global Keyboard Shortcuts**: 
   - Press `/` to focus the chat composer box (if not editing input).
   - Press `Ctrl + Shift + O` (or `Cmd + Shift + O` on macOS) to instantly route to a new session.
8. **Auth Page Access Guards**: Implemented strict route guards on the frontend to control tab redirection based on authentication and email verification states.
9. **Conversation Deletion**: Implemented hoverable vertical 3-dots context menus on sidebar history items to delete sessions and their message logs from the database.
10. **Glassmorphic Custom Modals**: Replaced native browser alerts with custom styled error modals.

---

## API Documentation

All routes are prefixed with `/api/v1`.

### 1. Authentication Routes (`/auth`)

#### `POST /auth/register`
Registers a new user account.
- **Input**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "strongpassword"
  }
  ```
- **Output (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "userIdString",
        "name": "User Name",
        "email": "user@example.com",
        "verified": false
      }
    }
  }
  ```

#### `POST /auth/login`
Authenticates a user and sets a cookie with the refresh token.
- **Input**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword"
  }
  ```
- **Output (200 OK)**:
  ```json
  {
    "message": "Logged in successfully",
    "data": {
      "accessToken": "jwt_access_token",
      "user": {
        "id": "userIdString",
        "name": "User Name",
        "email": "user@example.com",
        "verified": true
      }
    }
  }
  ```

#### `POST /auth/refresh`
Refreshes the session access token using the httpOnly cookie refresh token.
- **Input**: None (Reads cookie)
- **Output (200 OK)**:
  ```json
  {
    "message": "Token refreshed",
    "data": {
      "accessToken": "new_jwt_access_token",
      "user": {
        "id": "userIdString",
        "name": "User Name",
        "email": "user@example.com",
        "verified": true
      }
    }
  }
  ```

#### `POST /auth/logout`
Logs the user out and clears the session refresh cookie.
- **Input**: None
- **Output (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

#### `POST /auth/verify-email`
Verifies user email using the verification code.
- **Input**:
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```
- **Output (200 OK)**:
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

#### `POST /auth/resend-verification`
Resends the verification code.
- **Input**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Output (200 OK)**:
  ```json
  {
    "message": "Verification code sent"
  }
  ```

#### `POST /auth/forgot-password`
Initiates the password reset flow.
- **Input**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Output (200 OK)**:
  ```json
  {
    "message": "Password reset code sent"
  }
  ```

#### `POST /auth/reset-password`
Resets the password using the code sent to the email.
- **Input**:
  ```json
  {
    "email": "user@example.com",
    "code": "123456",
    "password": "newpassword"
  }
  ```
- **Output (200 OK)**:
  ```json
  {
    "message": "Password reset successfully"
  }
  ```

#### `GET /auth/me`
Retrieves details of the currently logged-in user.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Output (200 OK)**:
  ```json
  {
    "message": "User details fetched",
    "data": {
      "user": {
        "id": "userIdString",
        "name": "User Name",
        "email": "user@example.com",
        "verified": true
      }
    }
  }
  ```

---

### 2. Conversation & Chat Routes (`/chat`)
All routes require a valid `Authorization: Bearer <accessToken>` header.

#### `POST /chat/session/create`
Pre-generates a conversation session and automatically trims the first message to create the session title.
- **Input**:
  ```json
  {
    "message": "Hi, write a code for quick sort in javascript."
  }
  ```
- **Output (201 Created)**:
  ```json
  {
    "message": "Session created successfully",
    "data": {
      "conversationId": "sessionObjectIdString",
      "title": "Hi, write a code for quick sort..."
    }
  }
  ```

#### `POST /chat/conversation`
Streams the Server-Sent Events (SSE) AI assistant response.
- **Input**:
  ```json
  {
    "conversationId": "sessionObjectIdString",
    "message": "Write a quick sort program"
  }
  ```
- **Output (SSE Stream)**:
  Returns streaming events formatted as JSON packets:
  ```text
  data: {"text":"function quick"}

  data: {"text":"Sort(arr) {\n"}

  data: {"text":"  // ...\n"}
  ```

#### `GET /chat/sessions`
Fetches a list of all chat sessions created by the authenticated user.
- **Output (200 OK)**:
  ```json
  {
    "message": "Conversations fetched successfully",
    "data": {
      "sessions": [
        {
          "id": "sessionObjectIdString",
          "title": "Quick sort implementation",
          "createdAt": "2026-07-26T00:00:00.000Z"
        }
      ]
    }
  }
  ```

#### `GET /chat/conversation/:id/messages`
Retrieves all historical message logs from a specific conversation.
- **Output (200 OK)**:
  ```json
  {
    "message": "Messages fetched successfully",
    "data": {
      "messages": [
        {
          "id": "messageObjectIdString",
          "role": "user",
          "content": "Write a quick sort program"
        },
        {
          "id": "messageObjectIdString",
          "role": "assistant",
          "content": "```javascript\nfunction quicksort...\n```"
        }
      ]
    }
  }
  ```

#### `DELETE /chat/conversation/:id`
Deletes a conversation and its messages from the database.
- **Output (200 OK)**:
  ```json
  {
    "message": "Conversation deleted successfully"
  }
  ```
