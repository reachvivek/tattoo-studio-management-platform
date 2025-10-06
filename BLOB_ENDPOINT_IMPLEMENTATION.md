# Blob Endpoint Implementation for Image Serving

## Overview

Implemented a dedicated blob endpoint (`/api/images/:filename`) to serve uploaded images with proper CORS headers, content types, and caching. This replaces the static file serving approach which had CORS and path resolution issues.

## Why Blob Endpoint?

### Problems with Static File Serving:
1. **CORS Issues**: Static files might not include proper CORS headers for cross-origin requests
2. **Path Resolution**: Frontend needs to construct correct URLs manually
3. **Security**: Less control over who can access files
4. **Logging**: Can't track image access
5. **Format Conversion**: Can't dynamically transform images

### Benefits of Blob Endpoint:
1. ✅ **Proper CORS Headers**: Set explicitly for frontend access
2. ✅ **Consistent URLs**: Always `/api/images/filename.ext`
3. ✅ **Content Type Detection**: Automatic based on file extension
4. ✅ **Caching**: Set cache headers for performance
5. ✅ **Security**: Validate filenames, prevent directory traversal
6. ✅ **Streaming**: Efficiently stream large files
7. ✅ **Extensible**: Can add auth, watermarks, resizing later

---

## Backend Implementation

### 1. Image Controller ([image.controller.ts](backend/controllers/image.controller.ts))

**Main Endpoint**: `GET /api/images/:filename`

```typescript
async getImage(req: Request, res: Response) {
  // Security: Prevent directory traversal
  // Content-Type detection
  // CORS headers
  // Cache headers (1 year)
  // Stream file to response
}
```

**Features**:
- **Security**: Validates filename to prevent `../` attacks
- **Content Types**: Supports JPEG, PNG, WebP, GIF
- **Streaming**: Uses `fs.createReadStream()` for efficient large file handling
- **Error Handling**: Returns proper 404/500 responses
- **Caching**: Sets `Cache-Control: public, max-age=31536000` (1 year)
- **CORS**: Explicitly sets `Access-Control-Allow-Origin`

**Metadata Endpoint**: `GET /api/images/:filename/metadata`
- Returns file size, type, created/modified dates

### 2. Image Routes ([image.routes.ts](backend/routes/image.routes.ts))

```typescript
router.get('/:filename', imageController.getImage);
router.get('/:filename/metadata', imageController.getImageMetadata);
```

### 3. Updated Upload Controller ([upload.controller.ts](backend/controllers/upload.controller.ts))

**Before**:
```typescript
return `/uploads/${file.filename}`;
```

**After**:
```typescript
return `/api/images/${file.filename}`;
```

Now returns blob endpoint URLs instead of static file paths.

### 4. App Configuration ([app.ts](backend/app.ts))

Added image routes to API:
```typescript
app.use(`${apiPrefix}/images`, imageRoutes);
```

---

## Frontend Implementation

### 1. Updated Image URL Helper ([lead-detail.ts](frontend/src/app/features/admin/pages/lead-detail/lead-detail.ts))

```typescript
getImageUrl(imagePath: string): string {
  // Handle full URLs
  if (imagePath.startsWith('http')) return imagePath;

  // Handle new blob endpoint
  if (imagePath.startsWith('/api/images')) {
    return `${environment.backendUrl}${imagePath}`;
  }

  // Handle legacy /uploads paths (convert to blob)
  if (imagePath.startsWith('/uploads/')) {
    const filename = imagePath.replace('/uploads/', '');
    return `${environment.backendUrl}/api/images/${filename}`;
  }

  // Just filename - construct blob URL
  return `${environment.backendUrl}/api/images/${imagePath}`;
}
```

**Handles**:
- ✅ New blob URLs: `/api/images/image.png`
- ✅ Legacy uploads: `/uploads/image.png` → converts to blob
- ✅ Just filenames: `image.png` → constructs blob URL
- ✅ Full URLs: `http://example.com/image.png` → returns as-is

### 2. Template Usage ([lead-detail.html](frontend/src/app/features/admin/pages/lead-detail/lead-detail.html))

```html
<img [src]="getImageUrl(image)" [alt]="'Referenzbild'" />
```

---

## How It Works

### Upload Flow:
```
1. User uploads image via frontend
   ↓
2. Multer saves to backend/uploads/
   ↓
3. Upload controller returns: "/api/images/image-123.png"
   ↓
4. Frontend stores path in lead data
   ↓
5. Database stores: "/api/images/image-123.png"
```

### Display Flow:
```
1. Frontend loads lead with: { reference_images: ["/api/images/image-123.png"] }
   ↓
2. getImageUrl() constructs: "http://localhost:3000/api/images/image-123.png"
   ↓
3. Browser requests image from blob endpoint
   ↓
4. Image controller streams file with proper headers
   ↓
5. Image displays in CRM
```

---

## File Structure

```
backend/
├── controllers/
│   ├── image.controller.ts        # NEW: Blob endpoint controller
│   └── upload.controller.ts        # UPDATED: Returns blob URLs
├── routes/
│   └── image.routes.ts            # NEW: Image routes
├── app.ts                         # UPDATED: Added image routes
└── uploads/                       # Files stored here
    └── images-*.png

frontend/
├── src/app/features/admin/pages/lead-detail/
│   ├── lead-detail.ts            # UPDATED: getImageUrl() helper
│   └── lead-detail.html          # UPDATED: Uses getImageUrl()
└── src/environments/
    ├── environment.ts            # UPDATED: Added backendUrl
    └── environment.prod.ts       # UPDATED: Added backendUrl
```

---

## API Documentation

### GET /api/images/:filename

**Description**: Serve image file as blob

**Parameters**:
- `filename` (string, required): Image filename (e.g., `images-123.png`)

**Response Headers**:
```
Content-Type: image/jpeg | image/png | image/webp
Access-Control-Allow-Origin: http://localhost:4200
Cache-Control: public, max-age=31536000
```

**Success Response** (200):
- Binary image data streamed

**Error Responses**:
- `400 Bad Request`: Invalid filename (contains `../`)
- `404 Not Found`: Image doesn't exist
- `500 Internal Server Error`: Server error reading file

**Example**:
```bash
# Request
GET http://localhost:3000/api/images/images-1759755475534-602523417.png

# Response
Status: 200 OK
Content-Type: image/png
[Binary PNG data...]
```

### GET /api/images/:filename/metadata

**Description**: Get image metadata without downloading

**Response** (200):
```json
{
  "success": true,
  "data": {
    "filename": "images-123.png",
    "size": 245678,
    "type": "png",
    "created": "2025-10-06T14:27:55.600Z",
    "modified": "2025-10-06T14:27:55.600Z"
  }
}
```

---

## Security Features

1. **Directory Traversal Prevention**:
   ```typescript
   if (filename.includes('..') || filename.includes('/') || filename.includes('\\'))
   ```

2. **File Existence Check**:
   ```typescript
   if (!fs.existsSync(imagePath)) return 404
   ```

3. **Content Type Validation**: Only serves known image types

4. **CORS Restriction**: Only allows configured origin

---

## Testing

### Backend (Manual):
```bash
# Test blob endpoint
curl http://localhost:3000/api/images/images-1759755475534-602523417.png -I

# Expected response:
HTTP/1.1 200 OK
Content-Type: image/png
Access-Control-Allow-Origin: http://localhost:4200
Cache-Control: public, max-age=31536000

# Test metadata endpoint
curl http://localhost:3000/api/images/images-1759755475534-602523417.png/metadata

# Test security (should fail)
curl http://localhost:3000/api/images/../../../etc/passwd -I
# Expected: 400 Bad Request
```

### Frontend:
1. Upload image via lead form
2. View lead in CRM
3. Check browser console - images should load from `http://localhost:3000/api/images/...`
4. No CORS errors
5. Images display correctly

---

## Migration Guide

### For Existing Data:

Old database records might have paths like:
- `/uploads/image.png`
- `image.png`

The `getImageUrl()` helper handles both automatically:
```typescript
// Old path in DB: "/uploads/image.png"
getImageUrl("/uploads/image.png")
// Returns: "http://localhost:3000/api/images/image.png"
```

**No database migration needed!** ✅

### For New Uploads:

Upload controller now returns blob URLs:
```json
{
  "success": true,
  "data": {
    "urls": [
      "/api/images/images-123.png",
      "/api/images/images-456.png"
    ]
  }
}
```

---

## Performance Considerations

1. **Caching**: 1-year cache header reduces server load
2. **Streaming**: Uses streams, not loading entire file into memory
3. **Static Alternative**: Can still serve via `/uploads/` for internal use

---

## Future Enhancements

1. **Authentication**: Add auth check for private images
2. **Image Transformation**: Resize, crop, compress on-the-fly
3. **CDN Integration**: Serve from CDN instead of server
4. **Watermarking**: Add watermarks to images
5. **Access Logging**: Track image views
6. **Rate Limiting**: Prevent abuse

---

## Troubleshooting

### Images not loading:

1. **Check backend is running**: `curl http://localhost:3000/health`
2. **Check file exists**: `ls backend/uploads/`
3. **Check blob endpoint**: `curl http://localhost:3000/api/images/FILENAME.png -I`
4. **Check browser console**: Look for CORS or 404 errors
5. **Check UPLOAD_DIR env var**: Should be `./uploads` or absolute path

### CORS errors:

1. Check `CORS_ORIGIN` in `.env` matches frontend URL
2. Verify image controller sets CORS headers
3. Test with curl: `curl -H "Origin: http://localhost:4200" ...`

### Path issues:

1. Ensure `UPLOAD_DIR=./uploads` in `.env`
2. Check `process.cwd()` returns correct project root
3. Use absolute paths if relative paths fail

---

## Summary

✅ **Created**: Dedicated blob endpoint for images
✅ **Security**: Prevents directory traversal attacks
✅ **Performance**: Caching and streaming
✅ **CORS**: Proper headers for cross-origin
✅ **Backward Compatible**: Handles old `/uploads/` paths
✅ **Production Ready**: Error handling, logging, validation

The blob endpoint approach is more robust, secure, and maintainable than static file serving!
