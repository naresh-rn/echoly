# Echoly — API Reference Guide

This document outlines the primary API endpoints for the Echoly backend.

## 🔐 Authentication
All private routes require an `x-auth-token` header containing a valid JWT.

### POST `/api/auth/register`
- **Body**: `{ name, email, password }`
- **Description**: Creates a new user account.

### POST `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ token, user }`
- **Description**: Authenticates user and returns a session token.

### GET `/api/auth/me`
- **Description**: Returns the current authenticated user's profile.

---

## ⚡ Inference Engine

### POST `/api/repurpose-all`
- **Type**: FormData (Multer) or JSON
- **Fields**: `title`, `sourceType`, `url` (optional), `text` (optional), `tone`, `useHashtags`.
- **Description**: The core engine. Returns a Server-Sent Event (SSE) stream.
- **Progress Events**: `message` events with JSON: `{ progress, message, partialResult? }`

### POST `/api/edit-asset`
- **Description**: Allows manual inline editing of a generated asset.

---

## 📂 Project Management

### GET `/api/projects/history`
- **Description**: Returns all past missions for the authenticated user.

### DELETE `/api/projects/:id`
- **Description**: Deletes a specific mission from the vault.

---

## 🛡️ Admin Endpoints
*Requires `isAdmin: true` flag in JWT.*

### GET `/api/admin/users`
- **Description**: List all registered users.

### GET `/api/admin/projects`
- **Description**: Monitor all missions across the platform.

---
*Generated for the Echoly Developer Portal.*
