import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.trim().split("@")

  if (!localPart || !domain) {
    return email
  }

  const firstCharacter = localPart[0]
  const lastCharacter = localPart.length > 1 ? localPart[localPart.length - 1] : ""
  const maskedMiddle = "*".repeat(Math.max(3, localPart.length - (lastCharacter ? 2 : 1)))

  return `${firstCharacter}${maskedMiddle}${lastCharacter}@${domain}`
}
