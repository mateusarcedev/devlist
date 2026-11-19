/** Stage 2 compatibility: the existing Navbar owns the suggestion modal.
 * Stage 3 will replace the modal workflow with URL-only submission. */
export const OPEN_SUGGESTION_EVENT = 'devhub:open-suggestion'

export function requestSuggestionModal() {
  window.dispatchEvent(new Event(OPEN_SUGGESTION_EVENT))
}
