import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import sharp from 'sharp';

export async function POST(request) {
  try {
    console.log('📥 Upload request received');

    // Debug: Check environment variables
    const hasServiceKey = !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const serviceKeyLength = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAdminExists = !!supabaseAdmin;

    console.log('🔍 Environment check:', {
      hasServiceKey,
      serviceKeyLength,
      hasSupabaseUrl,
      supabaseAdminExists,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
    });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.error('❌ No file in request');
      return NextResponse.json(
        { error: 'Không có file được upload' },
        { status: 400 }
      );
    }

    console.log('📄 File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Sanitize tên file
    const sanitizedName = (file.name || 'image.jpg')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Always save as .jpg after compression
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName.replace(/\.[^/.]+$/, '')}.jpg`;
    console.log('📝 Generated filename:', fileName);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    console.log('💾 Original buffer size:', originalBuffer.length, 'bytes');

    // Resize and compress image using sharp
    let processedBuffer;
    try {
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();

      // Max dimensions: 1920px width/height, maintain aspect ratio
      const maxWidth = 1920;
      const maxHeight = 1920;

      console.log(`🖼️ Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      processedBuffer = await image
        .resize(maxWidth, maxHeight, {
          withoutEnlargement: true, // Don't enlarge small images
          fit: 'inside' // Maintain aspect ratio
        })
        .jpeg({
          quality: 85,  // Good balance between quality and file size
          mozjpeg: true // Better compression algorithm
        })
        .toBuffer();

      const compressionRatio = ((1 - processedBuffer.length / originalBuffer.length) * 100).toFixed(1);
      console.log(`✅ Compressed: ${originalBuffer.length} → ${processedBuffer.length} bytes (${compressionRatio}% reduction)`);
    } catch (sharpError) {
      console.warn('⚠️ Sharp processing failed, using original file:', sharpError.message);
      processedBuffer = originalBuffer;
    }

    // Upload to Supabase Storage
    // Use admin client for server-side uploads (bypasses RLS)
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    console.log('📤 Uploading to Supabase Storage...');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('account_images')
      .upload(fileName, processedBuffer, {
        contentType: 'image/jpeg', // Always JPEG after processing
        upsert: false, // Don't overwrite if exists
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Lỗi khi upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    console.log('✅ Upload successful');

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('account_images')
      .getPublicUrl(fileName);

    console.log('🔗 Public URL:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi: ' + error.message },
      { status: 500 }
    );
  }
}

