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

  // 2. Generate signed URL using admin client (bypassing Storage RLS)
  const { createClient: createSupabaseJs } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables for Admin Client')
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  const adminSupabase = createSupabaseJs(supabaseUrl, serviceRoleKey)

  const { data, error } = await adminSupabase.storage
    .from('handwriting-notes')
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    console.error('[API/handwriting] Failed to generate signed URL:', error)
    return new NextResponse('Failed to retrieve image', { status: 500 })
  }

  // 3. Redirect to the signed URL
  return NextResponse.redirect(data.signedUrl)
}
