import type { Order } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
      <p className="mt-1 text-gray-500">Coming soon — order ID: {id}</p>
    </div>
  )
}
