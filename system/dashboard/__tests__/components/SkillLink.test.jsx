import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkillLink from '../../src/components/SkillLink'

describe('SkillLink', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders skill name as clickable link', () => {
      render(<SkillLink skillName="architect" onClick={mockOnClick} />)
      const link = screen.getByTestId('skill-link-architect')
      expect(link).toBeInTheDocument()
      expect(link).toHaveTextContent('architect')
    })

    it('applies correct CSS classes', () => {
      render(<SkillLink skillName="developer" onClick={mockOnClick} />)
      const link = screen.getByTestId('skill-link-developer')
      expect(link).toHaveClass('skill-link')
    })

    it('renders with proper button semantics', () => {
      render(<SkillLink skillName="tester" onClick={mockOnClick} />)
      const button = screen.getByRole('button', { name: /tester/ })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Click Handling', () => {
    it('calls onClick callback when clicked', async () => {
      const user = userEvent.setup()
      render(<SkillLink skillName="architect" onClick={mockOnClick} />)

      const link = screen.getByTestId('skill-link-architect')
      await user.click(link)

      expect(mockOnClick).toHaveBeenCalledWith('architect')
    })

    it('passes correct skill name to callback', async () => {
      const user = userEvent.setup()
      render(<SkillLink skillName="my-skill-name" onClick={mockOnClick} />)

      const link = screen.getByTestId('skill-link-my-skill-name')
      await user.click(link)

      expect(mockOnClick).toHaveBeenCalledWith('my-skill-name')
    })
  })

  describe('Styling', () => {
    it('has hover state class', () => {
      render(<SkillLink skillName="developer" onClick={mockOnClick} />)
      const link = screen.getByTestId('skill-link-developer')
      expect(link.className).toMatch(/skill-link/)
    })

    it('is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<SkillLink skillName="architect" onClick={mockOnClick} />)

      const link = screen.getByTestId('skill-link-architect')
      link.focus()
      expect(link).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Props', () => {
    it('accepts optional className prop', () => {
      const { container } = render(
        <SkillLink
          skillName="architect"
          onClick={mockOnClick}
          className="custom-class"
        />
      )

      const link = screen.getByTestId('skill-link-architect')
      expect(link.className).toMatch(/custom-class/)
    })

    it('accepts optional title attribute', () => {
      render(
        <SkillLink
          skillName="architect"
          onClick={mockOnClick}
          title="Click to view architect persona"
        />
      )

      const link = screen.getByTestId('skill-link-architect')
      expect(link).toHaveAttribute('title', 'Click to view architect persona')
    })
  })

  describe('Edge Cases', () => {
    it('handles skill names with special characters', async () => {
      const user = userEvent.setup()
      render(<SkillLink skillName="fe-designer" onClick={mockOnClick} />)

      const link = screen.getByTestId('skill-link-fe-designer')
      await user.click(link)

      expect(mockOnClick).toHaveBeenCalledWith('fe-designer')
    })

    it('handles skill names with uppercase', async () => {
      const user = userEvent.setup()
      render(<SkillLink skillName="CloudArchitect" onClick={mockOnClick} />)

      const link = screen.getByTestId('skill-link-cloudarchitect')
      await user.click(link)

      expect(mockOnClick).toHaveBeenCalledWith('CloudArchitect')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label for screen readers', () => {
      render(
        <SkillLink
          skillName="architect"
          onClick={mockOnClick}
          ariaLabel="View architect persona details"
        />
      )

      const link = screen.getByTestId('skill-link-architect')
      expect(link).toHaveAttribute('aria-label')
    })

    it('supports disabled state', () => {
      render(
        <SkillLink skillName="architect" onClick={mockOnClick} disabled />
      )

      const link = screen.getByTestId('skill-link-architect')
      expect(link).toBeDisabled()
    })
  })
})
