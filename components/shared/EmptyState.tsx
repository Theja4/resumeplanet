'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  /** Path to an illustration (in /public). Falls back to the icon if it fails to load. */
  image?: string
  imageAlt?: string
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, image, imageAlt = '', title, description, action }: EmptyStateProps) {
  const [imageOk, setImageOk] = useState(true)
  const showImage = Boolean(image) && imageOk

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {showImage ? (
        <Image
          src={image as string}
          alt={imageAlt}
          width={176}
          height={176}
          onError={() => setImageOk(false)}
          className="mb-5 h-40 w-40 object-contain sm:h-44 sm:w-44"
        />
      ) : Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Icon size={24} className="text-gray-400" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
