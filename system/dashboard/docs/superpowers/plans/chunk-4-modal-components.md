# Chunk 4: Modal Components Extraction

> **For agentic workers:** TDD pattern: write failing tests → verify failure → implement → verify pass → commit.

**Goal:** Extract 2 modal components (ConfirmDialog, Modal base) for dialogs across dashboard.

**Files to create:**
- Create: `system/dashboard/src/components/Shared/Modal.jsx`
- Create: `system/dashboard/src/components/Shared/Modal.css`
- Create: `system/dashboard/src/components/Shared/ConfirmDialog.jsx`
- Create: `system/dashboard/__tests__/components/Modal.test.jsx`
- Create: `system/dashboard/__tests__/components/ConfirmDialog.test.jsx`

---

## Task 9: Create Modal Base Component

### Pattern: Write tests → implement → verify → commit (TDD)

**Files:**
- `src/components/Shared/Modal.jsx`
- `src/components/Shared/Modal.css`
- `__tests__/components/Modal.test.jsx`

**Expected behavior:**
- Render overlay + centered dialog box
- Accept `isOpen` prop (boolean)
- Accept `onClose` callback
- Accept `title` and `children` (slot)
- Close on overlay click or ESC key
- Trap focus inside modal (accessibility)
- ARIA attributes (role="dialog", aria-labelledby)

**Test cases to cover:**
- ✓ Should render when isOpen=true, hidden when false
- ✓ Should call onClose when overlay clicked
- ✓ Should call onClose when ESC pressed
- ✓ Should focus first focusable element on open
- ✓ Should have ARIA attributes

**Commits:**
```bash
git add src/components/Shared/Modal.jsx src/components/Shared/Modal.css __tests__/components/Modal.test.jsx
git commit -m "feat: extract Modal base component with accessibility support"
```

**CSS Notes:**
- Fixed positioning with z-index
- Overlay with semi-transparent background
- Centered dialog with pink border
- Smooth entrance animation (opacity + scale)

---

## Task 10: Create ConfirmDialog Component

### Pattern: Write tests → implement → verify → commit (TDD)

**Files:**
- `src/components/Shared/ConfirmDialog.jsx`
- `__tests__/components/ConfirmDialog.test.jsx`

**Expected behavior:**
- Built on Modal base component
- Accept `title`, `message`, `confirmText`, `cancelText` props
- Accept `onConfirm` callback (action button)
- Accept `onCancel` callback (cancel button)
- Optional `isDangerous` prop for destructive actions (red styling)
- Default buttons: "Cancel" and "Confirm"

**Test cases to cover:**
- ✓ Should render title and message
- ✓ Should call onConfirm when confirm button clicked
- ✓ Should call onCancel when cancel button clicked
- ✓ Should apply danger styling when isDangerous=true
- ✓ Should allow custom button text

**Commits:**
```bash
git add src/components/Shared/ConfirmDialog.jsx __tests__/components/ConfirmDialog.test.jsx
git commit -m "feat: extract ConfirmDialog component for confirmations"
```

**Usage example:**
```javascript
<ConfirmDialog
  isOpen={showConfirm}
  title="Delete skill?"
  message="This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  isDangerous={true}
  onConfirm={() => deleteSkill(skillId)}
  onCancel={() => setShowConfirm(false)}
/>
```

---

**Status:** 2 modal components (1 detailed, 1 summarized).
**Next:** Execute Chunk 5 (Utilities & Constants)
