# TaskMan-API

## Description

TaskMan-API is an advanced task management backend that leverages Express.js for seamless routing and request handling. With MongoDB/Mongoose as the database, data storage and retrieval are efficient and reliable.

To enhance security, TaskMan-API uses Redis for fast access token verification and JWT for stateless authentication. User passwords are securely hashed using bcrypt.

### Important Features

- User authentication using JWT and refresh token for enhanced security.
- Password hashing for secure storage and comparison.
- Http-only cookie for storing the refresh token to enhance client-side security.
- Clear and informative error messages for better user experience.
- Secure logout mechanism using JWT refresh tokens and Redis blacklisting.
- Verification of refresh token validity and prevention of token reuse after logout.
- Allow users to create, update, and delete their tasks.
- Provide endpoints to retrieve tasks, filter tasks based on specific criteria, and sort tasks based on query parameters.
- Clear and informative error messages for better user experience.

### User Registration Endpoint Documentation

This endpoint allows users to register by creating a new user document in the database. The client must provide a valid email and password. 
Password must be:
- Between 8 - 32 characters long
- Include at least one lowercase letter
- Include at least one uppercase letter
- Include at least one digit
- Include at least one special character [!@#$%^&*()_-+={}|?<>/\\]

#### Endpoint URL

`POST /api/register`

#### Request

The registration endpoint requires the following parameters to be provided in the request body:

| Parameter  | Type   | Description                                       |
|------------|--------|---------------------------------------------------|
| email      | string | User's email address (required)                   |
| password   | string | User's password (required)                        |

#### Response

The endpoint responds with the appropriate status codes and JSON data in the response body.

1. Successful user registration (status code 201):

   ```json
   {
     "_id": "60c85689e4d455001f3b0ad2", // Unique identifier for the user
     "email": "example@example.com",    // User's email address
     "password": "hashed_password"      // Hashed and securely stored password
   }
   ```

2. Validation error (status code 400):

   ```json
   {
     "message": "Validation failed: email: Please provide a valid email address."
   }
   ```

3. Hashing error (status code 400):

   ```json
   {
     "message": "Error occurred while hashing the password."
   }
   ```

4. Saving error (status code 400):

   ```json
   {
     "message": "Error occurred while saving the user."
   }
   ```

#### Registration Flow

1. The client sends a POST request to the `/api/register` endpoint with the `email` and `password` parameters in the request body.
2. The server creates a new `User` model instance using the provided email and password.
3. The server validates the request body using the user schema validation function. If validation fails, the server responds with a 400 status code and an appropriate validation error message.
4. If validation succeeds, the server securely hashes the password using bcrypt with 10 salt rounds. Any hashing errors are caught, and the server responds with a 400 status code and an error message in case of hashing failure.
5. The server saves the new user document in the database. Any saving errors are caught, and the server responds with a 400 status code and an error message in case of saving failure.
6. If user creation and saving are successful, the server responds with a 201 status code and the newly created user information in JSON format.

### Authentication Endpoint Documentation

This endpoint handles user authentication using JSON Web Tokens (JWT) paired with a refresh token sent to the client in an HTTP-only cookie. The system employs enhanced security and convenience for users while allowing for easy logout and token revocation.

#### Endpoint URL

`POST /api/login`

#### Request

The authentication endpoint requires the following parameters to be provided in the request body:

| Parameter  | Type   | Description                                       |
|------------|--------|---------------------------------------------------|
| email      | string | User's email address (required)                   |
| password   | string | User's password (required)                        |

#### Response

The endpoint responds with the appropriate status codes and JSON data in the response body.

1. Successful login (status code 200):

   ```json
   {
     "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Access token
   }
   ```

2. Invalid credentials (status code 401):

   ```json
   {
     "message": "Invalid credentials"
   }
   ```

3. User does not exist (status code 400):

   ```json
   {
     "message": "User does not exist"
   }
   ```

#### Authentication Flow

1. The client sends a POST request to the `/api/login` endpoint with the `email` and `password` parameters in the request body.
2. The server checks if all required parameters are provided; otherwise, it responds with a 400 status code and an error message.
3. The server looks up the user with the given email in the MongoDB database. If the user does not exist, it responds with a 400 status code and an appropriate error message.
4. The server hashes the provided password and compares it with the hashed password stored in the database. If the passwords match, the authentication is successful; otherwise, the server responds with a 401 status code and an "Invalid credentials" error message.
5. If the authentication is successful, the server generates a new access token and a refresh token. The refresh token is sent to the client in an HTTP-only cookie for enhanced security.
6. The server responds with a 200 status code, and the client can extract the access token from the response data to use for subsequent authorized requests.

### Logout Endpoint Documentation

This endpoint handles user logout, revoking the refresh token by adding it to the Redis blacklist and clearing the refresh token from the HTTP-only cookie. The implementation ensures user privacy and allows secure termination of the user's session.

#### Endpoint URL

`POST /api/logout`

#### Request

The logout endpoint requires the client to include the `jwt` cookie containing the refresh token. If the cookie is missing, the endpoint responds with a 400 status code and an error message.

#### Response

The endpoint responds with the appropriate status code and JSON data in the response body.

1. Successful logout (status code 200):

   ```json
   {
     "message": "Success; Logged out"
   }
   ```

2. Invalid refresh token (status code 401):

   ```json
   {
     "message": "Invalid refresh token"
   }
   ```

#### Logout Flow

1. The client sends a POST request to the `/api/logout` endpoint.
2. The server checks if the `jwt` cookie is present in the request. If not, it responds with a 400 status code and an error message.
3. The server retrieves the refresh token from the `jwt` cookie and verifies its validity. If the token is invalid, the server responds with a 401 status code and an "Invalid refresh token" error message.
4. If the refresh token is valid, the server adds it to the Redis blacklist to invalidate it.
5. The server clears the `jwt` cookie, effectively removing the refresh token from the client-side.
6. The server responds with a 200 status code and a success message to indicate a successful logout.


### Access Token Refresh Endpoint Documentation

This endpoint refreshes the access token using a valid refresh token, provided that the refresh token is not in the blacklist and its creation time is after the user's last logout time. It ensures that users can obtain a new access token without having to re-authenticate.

#### Endpoint URL

`POST /api/refresh`

#### Request

The access token refresh endpoint requires the client to include the `jwt` cookie containing the refresh token. If the cookie is missing, the endpoint responds with a 400 status code and an error message.

#### Response

The endpoint responds with the appropriate status code and JSON data in the response body.

1. Successful token refresh (status code 200):

   ```json
   {
     "new_access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // New access token
   }
   ```

2. Token in deny list (status code 401):

   ```json
   {
     "message": "Token is in deny list"
   }
   ```

3. Invalid refresh token (status code 401):

   ```json
   {
     "message": "Invalid refresh token"
   }
   ```

4. Refresh token created before last logout (status code 400):

   ```json
   {
     "message": "Refresh token created before last logout"
   }
   ```

#### Token Refresh Flow

1. The client sends a POST request to the `/api/refresh` endpoint.
2. The server checks if the `jwt` cookie is present in the request. If not, it responds with a 400 status code and an error message.
3. The server retrieves the refresh token from the `jwt` cookie.
4. The server checks if the refresh token is in the Redis blacklist. If the token is in the blacklist, the server responds with a 401 status code and a "Token is in deny list" error message.
5. The server verifies the refresh token's validity. If the token is invalid, the server responds with a 401 status code and an "Invalid refresh token" error message.
6. If the refresh token is valid, the server extracts the user ID from the token and queries the database for the corresponding user.
7. The server compares the creation time (`iat`) of the refresh token with the user's last logout time (`user.lastLogoutTime`). If the refresh token's creation time is before the last logout time, the server responds with a 400 status code and a "Refresh token created before last logout" error message, indicating that the token is no longer valid for use.
8. If the refresh token is valid and not in the blacklist, the server generates a new access token, and the server responds with a 200 status code and the new access token.

### Change Password Endpoint Documentation

This endpoint allows users to change their password by providing their current credentials (email and password) along with the new password. The client must include a valid refresh token in an HTTP-only cookie to authenticate the request. The password change process involves the following steps:

1. Decode the refresh token to authenticate the user.
2. Find the user based on the provided email and validate the current credentials (email and password).
3. Hash the new password using bcrypt with 10 salt rounds and update the user's password field in the database.
4. Invalidate the refresh token by adding it to the Redis blacklist to log out all devices.
5. Respond with the updated user document in JSON format.

#### Endpoint URL

`POST /api/changePassword`

#### Request

The change password endpoint requires the following parameters to be provided in the request body:

| Parameter     | Type   | Description                                           |
|---------------|--------|-------------------------------------------------------|
| email         | string | User's email address (required)                       |
| password      | string | User's current password (required)                    |
| new_password  | string | User's new password (required)                        |

The client must also include the `jwt` cookie containing the refresh token for authentication.

#### Response

The endpoint responds with the appropriate status codes and JSON data in the response body.

1. Successful password change (status code 200):

   ```json
   {
     "_id": "60c85689e4d455001f3b0ad2", // Unique identifier for the user
     "email": "example@example.com",    // User's email address
     "password": "hashed_new_password"  // Hashed and securely stored new password
   }
   ```

2. Missing refresh token (status code 400):

   ```json
   {
     "message": "Missing refresh token"
   }
   ```

3. Invalid refresh token (status code 401):

   ```json
   {
     "message": "Invalid refresh token"
   }
   ```

4. User does not exist (status code 400):

   ```json
   {
     "message": "User does not exist"
   }
   ```

5. Invalid credentials (status code 401):

   ```json
   {
     "message": "Invalid credentials"
   }
   ```

6. Invalid new password (status code 400):

   ```json
   {
     "message": "Invalid new_password"
   }
   ```

#### Change Password Flow

1. The client sends a POST request to the `/api/changePassword` endpoint with the `email`, `password`, and `new_password` parameters in the request body.
2. The client includes the `jwt` cookie containing the refresh token for authentication.
3. The server decodes the refresh token to verify its validity. If the token is missing or invalid, the server responds with the appropriate status code and error message.
4. The server queries the database for the user with the provided email. If the user does not exist or the current credentials (email and password) do not match, the server responds with the appropriate status code and error message.
5. The server validates the new password. If the new password does not meet the validation criteria, the server responds with a 400 status code and an "Invalid new_password" error message.
6. If all validations pass, the server updates the user's password field in the database with the new hashed password using bcrypt with 10 salt rounds.
7. The server adds the refresh token to the Redis blacklist to invalidate it and updates the lastLogout time for the user to log out all devices associated with the user's account.
8. The server responds with a 200 status code and the updated user information in JSON format.


### Task Management Endpoints Documentation

These endpoints provide functionalities for managing tasks. To access these endpoints, the client must provide a valid access token in the HTTP request headers.

#### Task Creation

This endpoint allows users to create a new task with the following parameters in the JSON request body:

- Title (required)
- Description
- Due Date
- Status (0 = Pending, 1 = In Progress, 2 = Completed, 3 = On-Hold, 4 = Cancelled)
- Priority

The new task object is returned in the response in JSON format.

**Endpoint URL:** `POST /api/tasks`

#### Task Update

This endpoint allows users to update an existing task by providing its ID as a request parameter. All fields listed in the createTask endpoint can be modified or added (if not already present). The task to be updated must be owned by the currently authenticated user.

The new task object is returned in the response in JSON format.

**Endpoint URL:** `PUT /api/tasks/:taskId`

#### Task Deletion

This endpoint allows users to delete a task by providing its ID as a request parameter. The provided task must be owned by the currently authenticated user.

**Endpoint URL:** `DELETE /api/tasks/:taskId`

### Task Retrieval

#### Get All Tasks

This endpoint responds with all tasks owned by the currently authenticated user in a JSON array of task objects. Callers may optionally sort the returned tasks by providing the `sortBy` and/or the `sortOrder` query parameter(s). Users may sort by title, due date, status, or priority. If the `sortBy` parameter is provided without the `sortOrder` parameter, the sort order is ascending by default. If the `sortOrder` parameter is provided without the `sortBy` parameter, the tasks are sorted by priority by default.

**Endpoint URL:** `GET /api/tasks`

#### Filter Tasks

This endpoint provides tasks filtered by the provided query parameters. Filtering currently only supports exact matching, including case sensitivity. Supported filter parameters are:

- Title
- Due Date
- Status
- Priority

Callers may optionally sort the returned tasks by providing the `sortBy` and/or the `sortOrder` query parameter(s). Users may sort by title, due date, status, or priority. The `sortOrder` parameter may be "ascending" or "descending". If the `sortBy` parameter is provided without the `sortOrder` parameter, the sort order is ascending by default. If the `sortOrder` parameter is provided without the `sortBy` parameter, the tasks are sorted by priority by default.

**Endpoint URL:** `GET /api/tasks/filter`

#### Get Task by ID

This endpoint responds with a single task with a matching ID given as a request parameter (part of the URL path). The provided task must be owned by the currently authenticated user.

**Endpoint URL:** `GET /api/tasks/:taskId`
