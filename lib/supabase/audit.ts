import { supabase } from './client'

export interface AuditLogRow {
  event_id: string
  event_time: string
  entity_type: string
  entity_id: string
  action: 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION'
  description: string
  actor_name: string
  branch_name: string
  metadata: Record<string, unknown> | null
}

export const auditService = {
  async getLogs(input?: {
    date_from?: string | null
    date_to?: string | null
    entity_type?: string | null
    user_search?: string | null
    limit?: number
  }): Promise<AuditLogRow[]> {
    const { data, error } = await supabase.rpc('get_audit_log', {
      p_date_from: input?.date_from ? `${input.date_from}T00:00:00Z` : null,
      p_date_to: input?.date_to ? `${input.date_to}T23:59:59Z` : null,
      p_entity_type: input?.entity_type ?? null,
      p_user_search: input?.user_search ?? null,
      p_limit: input?.limit ?? 200,
    })

    if (error) throw error
    return (data || []) as AuditLogRow[]
  },
}
