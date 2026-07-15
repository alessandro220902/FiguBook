import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { FadeIn } from '@/components/home/FadeIn'
import { CommunityTabs } from '@/components/community/CommunityTabs'
import { useProfile } from '@/hooks/useProfile'
import { useInviteCount } from '@/hooks/useInviteCount'

export default function Community() {
  const { profile } = useProfile()
  const inviteCount = useInviteCount()
  const [copied, setCopied] = useState(false)
  const shareInvite = async () => {
    const uname = profile?.username
    if (!uname) return
    const url = `${window.location.origin}/FiguBook/app/invita/${uname}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <div className="mx-auto w-full max-w-[88rem]">
      <FadeIn>
        <h1 className="type-h1 text-ink">Il mondo di FiguBook</h1>
        <p className="type-body mt-1.5 text-ink-2">
          {inviteCount > 0 ? `Hai invitato ${inviteCount} ${inviteCount === 1 ? 'amico' : 'amici'}.` : 'Invita i tuoi amici e trova collezionisti vicini.'}
        </p>
        <button
          onClick={shareInvite}
          className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-semibold text-lime-ink transition-opacity hover:opacity-90"
        >
          {copied ? 'Link copiato!' : 'Invita un amico'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </FadeIn>
      <CommunityTabs />
      <Outlet />
    </div>
  )
}
