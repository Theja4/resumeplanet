import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmailAddress(email: string): string {
  const lastAtIndex = email.trim().lastIndexOf("@")

  if (lastAtIndex <= 0) {
    return email
  }

  const localPart = email.trim().substring(0, lastAtIndex)
  const domain = email.trim().substring(lastAtIndex + 1)

  if (localPart.length <= 2) {
    return `${localPart[0]}${"*".repeat(4)}@${domain}`
  }

  const firstCharacter = localPart[0]
  const lastCharacter = localPart[localPart.length - 1]
  const maskedMiddle = "*".repeat(Math.max(4, localPart.length - 2))

  return `${firstCharacter}${maskedMiddle}${lastCharacter}@${domain}`
}
