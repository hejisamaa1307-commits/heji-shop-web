import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials for delete-image API');
}

// Initialize Supabase Admin client
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY.trim(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to extract filename from Supabase Storage URL
function extractFilenameFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided:', url);
      return null;
    }

    // Supabase Storage URL format: 
    // https://xxx.supabase.co/storage/v1/object/public/account_images/filename
    // or https://xxx.supabase.co/storage/v1/object/sign/account_images/filename?token=...
    // or https://xxx.supabase.co/storage/v1/object/public/account_images/subfolder/filename
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    console.log('🔍 Extracting filename from URL:', url);
    console.log('🔍 Pathname:', pathname);
    
    // Remove leading/trailing slashes and split
    const pathParts = pathname.split('/').filter(p => p && p !== '');
    
    console.log('🔍 Path parts:', pathParts);
    
    // Find account_images in path
    const bucketIndex = pathParts.indexOf('account_images');
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      // Get everything after account_images as filename
      // This handles cases like: account_images/telegram-123-abc.jpg
      const filename = pathParts.slice(bucketIndex + 1).join('/');
      // Decode URL encoding if any
      const decodedFilename = decodeURIComponent(filename);
      console.log('✅ Extracted filename:', decodedFilename);
      return decodedFilename;
    }
    
    // Alternative: if path ends with .jpg, .png, etc, use last part
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /\.(jpg|jpeg|png|gif|webp)$/i.test(lastPart)) {
      const decodedFilename = decodeURIComponent(lastPart);
      console.log('✅ Extracted filename (from last part):', decodedFilename);
      return decodedFilename;
    }
    
    console.warn('⚠️ Could not extract filename from URL:', url);
    console.warn('⚠️ Path parts:', pathParts);
    return null;
  } catch (e) {
    console.error('❌ Error extracting filename from URL:', url, e);
    return null;
  }
}

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Thiếu imageUrl' },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const filename = extractFilenameFromUrl(imageUrl);
    
    if (!filename) {
      console.error('Could not extract filename from URL:', imageUrl);
      return NextResponse.json(
        { error: 'Không thể lấy tên file từ URL' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting file from storage:');
    console.log('  - Filename:', filename);
    console.log('  - Original URL:', imageUrl);

    // Delete file from storage using admin client
    const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
      .from('account_images')
      .remove([filename]);

    if (deleteError) {
      console.error('❌ Error deleting file from storage:');
      console.error('  - Filename:', filename);
      console.error('  - Error:', deleteError);
      console.error('  - Error message:', deleteError.message);
      console.error('  - Error code:', deleteError.statusCode);
      return NextResponse.json(
        { error: `Lỗi khi xóa file: ${deleteError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log('✅ File deleted successfully:');
    console.log('  - Filename:', filename);
    console.log('  - Delete data:', deleteData);
    return NextResponse.json({ 
      success: true,
      filename,
      message: 'Đã xóa file thành công'
    });
  } catch (error) {
    console.error('❌ Delete image error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi: ' + error.message },
      { status: 500 }
    );
  }
}

