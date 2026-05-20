import { scholarships } from '@/data/scholarships'
import { notFound } from 'next/navigation'
import DetailClient from './DetailClient'

export default async function ScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const scholarship = scholarships.find(s => s.id === id)
  if (!scholarship) notFound()
  return <DetailClient scholarship={scholarship} />
}

export function generateStaticParams() {
  return scholarships.map(s => ({ id: s.id }))
}
