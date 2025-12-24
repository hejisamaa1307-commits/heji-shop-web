'use client'
import { Avatar as ArkAvatar, type AvatarRootProps } from '@ark-ui/react/avatar'
import { forwardRef } from 'react'
import Link from 'next/link'
import './avatar.css'

export interface AvatarProps extends AvatarRootProps {
  name?: string
  src?: string
  href?: string
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>((props, ref) => {
  const { name, src, href, className, ...rootProps } = props

  const avatarContent = (
    <ArkAvatar.Root 
      ref={ref} 
      {...rootProps} 
      className={`cursor-pointer ${className || ''}`}
    >
      {src ? (
        <ArkAvatar.Image src={src} alt={name || ''} />
      ) : (
        <ArkAvatar.Fallback>{getInitials(name) || <UserIcon />}</ArkAvatar.Fallback>
      )}
    </ArkAvatar.Root>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
})

const UserIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="opacity-90"
  >
    <title>User Icon</title>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .splice(0, 2)
    .join('')
    .toUpperCase()

Avatar.displayName = 'Avatar'
