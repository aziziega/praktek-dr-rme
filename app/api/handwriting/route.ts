import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path')

  if (!path) {
    return new NextResponse('Path parameter is required', { status: 400 })
  }

  // 1. Verify user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Generate signed URL (expires in 1 hour / 3600 seconds)
  const { data, error } = await supabase.storage
    .from('handwriting-notes')
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    console.error('[API/handwriting] Failed to generate signed URL:', error)
    return new NextResponse('Failed to retrieve image', { status: 500 })
  }

  // 3. Redirect to the signed URL
  return NextResponse.redirect(data.signedUrl)
}
