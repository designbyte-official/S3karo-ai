# S3-Karo Managed Storage API

Public API for uploading and managing files in S3-Karo's managed storage.

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

All API requests require an API key in the `Authorization` header:

```
Authorization: Bearer sk_live_...
```

### Getting an API Key

1. Log in to your S3-Karo account
2. Navigate to Settings → API Keys
3. Create a new API key
4. **Save the key immediately** - it will only be shown once

## Rate Limits

- Default: 1,000 requests per hour per API key
- Custom limits available for Pro users
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window

## Endpoints

### Upload File

Upload a file to managed storage.

**POST** `/api/v1/files`

**Headers:**
```
Authorization: Bearer sk_live_...
Content-Type: multipart/form-data
```

**Body (form-data):**
- `file` (required): The file to upload
- `path` (optional): Folder path (e.g., "documents/2024/")

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "example.jpg",
  "url": "https://bucket.s3.region.amazonaws.com/managed/userId/path/timestamp-example.jpg",
  "size": 12345,
  "type": "image",
  "extension": ".jpg",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing file or file too large (>5GB)
- `401 Unauthorized`: Invalid or missing API key
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Upload failed

**Example (cURL):**
```bash
curl -X POST https://your-domain.com/api/v1/files \
  -H "Authorization: Bearer sk_live_..." \
  -F "file=@example.jpg" \
  -F "path=photos/"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('path', 'documents/2024/');

const response = await fetch('https://your-domain.com/api/v1/files', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_...'
  },
  body: formData
});

const data = await response.json();
console.log('File uploaded:', data);
```

### Delete File

Delete a file by ID.

**DELETE** `/api/v1/files/:id`

**Headers:**
```
Authorization: Bearer sk_live_...
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully",
  "id": "uuid"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: File not found or access denied
- `500 Internal Server Error`: Deletion failed

**Example (cURL):**
```bash
curl -X DELETE https://your-domain.com/api/v1/files/uuid \
  -H "Authorization: Bearer sk_live_..."
```

## File Size Limits

- Maximum file size: 5GB per upload
- For larger files, use multipart upload (coming soon)

## Storage Key Format

Files are stored with the following key format:
```
managed/{userId}/{path}/{timestamp}-{filename}
```

Example:
```
managed/123e4567-e89b-12d3-a456-426614174000/documents/2024/1704067200000-report.pdf
```

## Best Practices

1. **Save API Keys Securely**: Never commit API keys to version control
2. **Use Environment Variables**: Store API keys in environment variables
3. **Handle Errors Gracefully**: Always check response status codes
4. **Respect Rate Limits**: Implement exponential backoff for rate limit errors
5. **Validate File Types**: Check file types before uploading
6. **Use HTTPS**: Always use HTTPS in production

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional details (development only)"
}
```

Common error codes:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Invalid or missing API key
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - Service temporarily unavailable

## SDK Examples

### Python

```python
import requests

API_KEY = "sk_live_..."
BASE_URL = "https://your-domain.com/api/v1"

def upload_file(file_path, path=""):
    url = f"{BASE_URL}/files"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'path': path} if path else {}
        response = requests.post(url, headers=headers, files=files, data=data)
    
    return response.json()

# Usage
result = upload_file("example.jpg", "photos/")
print(result)
```

### Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const API_KEY = 'sk_live_...';
const BASE_URL = 'https://your-domain.com/api/v1';

async function uploadFile(filePath, path = '') {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  if (path) form.append('path', path);

  const response = await axios.post(`${BASE_URL}/files`, form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  return response.data;
}

// Usage
uploadFile('./example.jpg', 'photos/')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## Support

For API support, contact: support@s3-karo.com

