# Setting up Image Upload

The image upload feature uses Supabase Storage directly from the client with RLS policies for security.

## Steps to set up:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Set the following:
   - Name: `item-images`
   - Public bucket: **Yes** (checked)
5. Click **Create bucket**

### Option 2: Using SQL Script

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `scripts/006_create_storage_bucket.sql`
5. Click **Run**

## Storage Policies (RLS)

The bucket has the following Row Level Security policies:

- **Public Read**: Anyone can view uploaded images (required for sharing items)
- **Authenticated Upload**: Only logged-in users can upload images
- **User-Only Update/Delete**: Users can only update or delete their own images (organized by user ID folder)

These policies ensure that:
- Only authenticated users can upload
- Users can only manage their own files
- Everyone can view images (needed for public item listings)

## File Limitations

- **File Type**: Images only (JPEG, PNG, GIF, WebP, etc.)
- **Max File Size**: 5MB per image
- **Storage Path**: Images are stored in user-specific folders: `{user_id}/{timestamp}-{random}.{ext}`

## How It Works

Image uploads are handled **directly from the client** using Supabase Storage SDK:
- No API routes needed
- RLS policies control access
- Files uploaded directly to Supabase Storage
- Public URLs returned for embedding in posts

## Testing Upload

1. Make sure the storage bucket is created in Supabase
2. Ensure the bucket is **public** (has the "Public" badge)
3. Run the SQL script to set up RLS policies
4. Log in to the application
5. Go to `/post` and select Lost or Found item
6. Fill out the form and try uploading an image
7. The image should upload successfully and display a preview

## Troubleshooting

If uploads fail:

1. **Check bucket exists**: Go to Storage in Supabase dashboard
2. **Check bucket is public**: The bucket should have "Public" badge
3. **Check RLS policies**: Run the SQL script (`006_create_storage_bucket.sql`) to ensure policies are set
4. **Check browser console**: Look for error messages with `[Upload]` prefix
5. **Check authentication**: Make sure you're logged in
6. **Check file type/size**: Ensure file is an image under 5MB

## Common Errors

- **"Not authenticated"**: User is not logged in
- **"Invalid file type"**: File is not an image
- **"File too large"**: Image exceeds 5MB
- **"Upload failed" with Supabase error**: Check RLS policies and bucket configuration
