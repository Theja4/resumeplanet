'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import Link from 'next/link'
import type { Profile } from '@/types'

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

interface UserMenuProps {
  profile: Profile
}

export default function UserMenu({ profile }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? ''} />
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {getInitials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/pricing">Pricing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full" onSubmit={() => Analytics.reset()}>
            <button type="submit" className="w-full text-left text-red-600">
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
