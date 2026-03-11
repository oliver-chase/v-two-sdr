import './SkillLink.css'

export default function SkillLink({
  skillName,
  onClick,
  className = '',
  title = '',
  ariaLabel = '',
  disabled = false,
}) {
  const skillId = skillName.toLowerCase().replace(/\s+/g, '-')

  return (
    <button
      className={`skill-link ${className}`}
      onClick={() => !disabled && onClick(skillName)}
      data-testid={`skill-link-${skillId}`}
      title={title}
      aria-label={ariaLabel || `View ${skillName} details`}
      disabled={disabled}
    >
      {skillName}
    </button>
  )
}
