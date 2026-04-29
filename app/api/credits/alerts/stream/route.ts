import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const ALERT_POLL_MS = 30000
const KEEP_ALIVE_MS = 15000

function buildSse(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const branchId = url.searchParams.get('branch_id')

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const authClient = createSupabaseServerClient()
  const { data: authData, error: authError } = await authClient.auth.getUser(
    token,
  )

  if (authError || !authData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Supabase env missing', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false

      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(buildSse(event, payload)))
      }

      const sendError = (message: string) => {
        send('error', { error: message })
      }

      const fetchAlerts = async () => {
        try {
          const { data, error } = await supabase.rpc('get_credit_alerts', {
            p_branch_id: branchId ?? null,
          })

          if (error) {
            sendError(error.message)
            return
          }

          send('alerts', data ?? [])
        } catch (err) {
          sendError(err instanceof Error ? err.message : 'Unexpected error')
        }
      }

      await fetchAlerts()

      const pollId = setInterval(fetchAlerts, ALERT_POLL_MS)
      const keepAliveId = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, KEEP_ALIVE_MS)

      const closeStream = () => {
        if (closed) {
          return
        }
        closed = true
        clearInterval(pollId)
        clearInterval(keepAliveId)
        controller.close()
      }

      request.signal.addEventListener('abort', closeStream)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
