import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: NextResponse['cookies']['set'] extends (name: string, value: string, options: infer O) => unknown ? O : never) {
                    supabaseResponse.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: NextResponse['cookies']['set'] extends (name: string, value: string, options: infer O) => unknown ? O : never) {
                    supabaseResponse.cookies.delete({ name, ...options })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
        if (!signInError && signInData.user) {
            // Wait for the session to be set
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Create user profile
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: signInData.user.id,
                    display_name: `Anonymous User ${Math.floor(Math.random() * 1000)}`,
                })
                .select()
                .maybeSingle()

            if (insertError) {
                console.error('Error creating user profile:', insertError)
            }
        } else if (signInError) {
            console.error('Anonymous sign-in error:', signInError)
        }
    }

    return supabaseResponse
}