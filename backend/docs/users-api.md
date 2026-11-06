# Users API Documentation

## Endpoints

### 1. Create User
- **POST** `/users`
- **Body Example:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword",
  "role": "ADMIN",
  "department": "IT"
}
```
- **Response Example:**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "department": "IT"
}
```

### 2. Get All Users
- **GET** `/users?page=1&limit=10&role=ADMIN&search=john`
- **Response Example:**
```json
[
  {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "department": "IT"
  }
]
```

### 3. Get User By ID
- **GET** `/users/{id}`
- **Response Example:**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "department": "IT"
}
```

### 4. Update User
- **PATCH** `/users/{id}`
- **Body Example:**
```json
{
  "name": "Jane Doe",
  "department": "HR"
}
```
- **Response Example:**
```json
{
  "id": "user-uuid",
  "name": "Jane Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "department": "HR"
}
```

### 5. Delete (Deactivate) User
- **DELETE** `/users/{id}`
- **Response Example:**
```json
{
  "message": "User deactivated successfully"
}
```

## Notes
- All endpoints require JWT authentication and appropriate user roles.
- Use the correct headers for authentication: `Authorization: Bearer <token>`
