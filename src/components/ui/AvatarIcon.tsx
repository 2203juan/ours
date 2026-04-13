import { cn, initials } from '../../lib/utils'
import { AVATAR_PRESETS, getAvatarPreset, type AvatarKey } from '../../types'

// ── Size map ──────────────────────────────────────────────────────────────────

const sizeMap = {
  xs:  { box: 'h-6 w-6',   text: 'text-[10px]' },
  sm:  { box: 'h-8 w-8',   text: 'text-xs' },
  md:  { box: 'h-10 w-10', text: 'text-sm' },
  lg:  { box: 'h-14 w-14', text: 'text-base' },
  xl:  { box: 'h-20 w-20', text: 'text-xl' },
}

// ── AvatarIcon ────────────────────────────────────────────────────────────────

interface AvatarIconProps {
  name: string
  avatarKey: AvatarKey | string
  size?: keyof typeof sizeMap
  className?: string
}

export function AvatarIcon({ name, avatarKey, size = 'md', className }: AvatarIconProps) {
  const preset = getAvatarPreset(avatarKey)
  const { box, text } = sizeMap[size]

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-medium text-white select-none',
        box,
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
      }}
    >
      <span className={cn('leading-none', text)}>{initials(name)}</span>
    </div>
  )
}

// ── AvatarPicker ──────────────────────────────────────────────────────────────

interface AvatarPickerProps {
  name: string
  value: AvatarKey | string
  onChange: (key: AvatarKey) => void
  label?: string
}

export function AvatarPicker({ name, value, onChange, label }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-warm-600 uppercase tracking-wide">{label}</span>
      )}
      {/* Preview */}
      <div className="flex items-center gap-3">
        <AvatarIcon name={name || '?'} avatarKey={value} size="lg" />
        <span className="text-sm text-warm-600">
          {name || 'Enter a name above'}
        </span>
      </div>
      {/* Color grid */}
      <div className="flex gap-2 flex-wrap">
        {AVATAR_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            title={preset.label}
            className={cn(
              'h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95',
              value === preset.key && 'ring-2 ring-offset-2 ring-warm-600 scale-110'
            )}
            style={{
              background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
