# User API Documentation

Base URL: `http://localhost:3000` (Default)

## Public Endpoints

### Register
Creates a new user account.

- **URL:** `/register`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:**
    ```json
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "created_at": "2023-10-27T10:00:00Z"
    }
    ```

### Login
Authenticates a user and returns a JWT token.

- **URL:** `/login`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
    ```

### Recover Password
Initiates the password recovery process by sending an email with a reset token.

- **URL:** `/recover-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "If the email exists, a recovery link has been sent."
    }
    ```

### Reset Password
Resets the user's password using a valid recovery token.

- **URL:** `/reset-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "token": "valid-reset-token",
    "new_password": "newSecurePassword123"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Password reset successfully"
    }
    ```

### Health Check
Checks if the backend is running.

- **URL:** `/health`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "status": "ok",
      "message": "Primer Backend running"
    }
    ```

---

## Authenticated Endpoints

**Headers Required:**
- `Authorization: Bearer <your_jwt_token>`

### Get Current User
Retrieves the profile of the currently authenticated user.

- **URL:** `/me`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "created_at": "2023-10-27T10:00:00Z"
    }
    ```

### Change Password
Updates the authenticated user's password.

- **URL:** `/change-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "current_password": "oldPassword123",
    "new_password": "newSecurePassword456"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Password updated successfully"
    }
    ```

### Delete Account
Permanently deletes the user's account. Requires password confirmation.

- **URL:** `/me`
- **Method:** `DELETE`
- **Request Body:**
  ```json
  {
    "password": "currentPassword123"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Account deleted successfully"
    }
    ```
