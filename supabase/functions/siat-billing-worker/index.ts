// Supabase Edge Function template for SIAT billing worker.
// This worker is intentionally disabled until tenant SIAT credentials are configured.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SIAT_ENABLED = Deno.env.get('SIAT_ENABLED') === 'true'

Deno.serve(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase service configuration' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!SIAT_ENABLED) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'SIAT worker disabled by configuration' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Claim pending jobs from billing queue.
  const { data: jobs, error: claimError } = await supabase.rpc('billing_claim_invoice_jobs', { p_limit: 10 })

  if (claimError) {
    return new Response(JSON.stringify({ ok: false, error: claimError.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const claimedJobs = (jobs || []) as Array<{
    job_id: string
    sale_id: string
    payload: Record<string, unknown>
    attempt_count: number
  }>

  for (const job of claimedJobs) {
    try {
      // TODO: Implement SIAT flow when credentials and taxpayer data are available.
      // 1) Ensure CUIS / CUFD lifecycle
      // 2) Build XML
      // 3) Sign XML
      // 4) Send SOAP recepcionFactura
      // 5) Persist SIAT response + artifacts
      // 6) Mark job success/failure

      await supabase.rpc('billing_mark_invoice_job', {
        p_job_id: job.job_id,
        p_success: false,
        p_error: 'SIAT integration not configured for this tenant',
        p_response: {
          stage: 'preflight',
          message: 'SIAT credentials missing',
        },
        p_artifacts: [],
        p_http_status: null,
        p_response_code: 'SIAT_NOT_CONFIGURED',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown SIAT worker error'
      await supabase.rpc('billing_mark_invoice_job', {
        p_job_id: job.job_id,
        p_success: false,
        p_error: message,
        p_response: { stage: 'worker', message },
        p_artifacts: [],
        p_http_status: null,
        p_response_code: 'WORKER_ERROR',
      })
    }
  }

  return new Response(JSON.stringify({ ok: true, claimed: claimedJobs.length }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
