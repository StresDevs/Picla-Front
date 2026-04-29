import { redirect } from 'next/navigation'

export default function CreditsNewPage() {
  redirect('/pos/sales?payment=credit')
}
