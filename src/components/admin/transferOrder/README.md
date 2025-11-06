# TransferOrders module

Scope
- Implements Transfer Orders replicating LoadOrders functional logic, design patterns, permissions, state flow, UX and visual style.
- Only functional difference vs LoadOrders: inline item editing with an async ProductSelector in the first column instead of using a Dialog.

Data model
- Based on types under src/types:
  - TransferOrder in src/types/transferOrders.tsx
  - TransferOrderItem in src/types/transferOrderItems.tsx
- No invented or modified fields; UI and payloads map exactly to these types.

Main files
- Listing page
  - src/components/admin/transferOrders.tsx/TransferOrdersContainer.tsx
  - src/components/admin/transferOrders.tsx/TransferOrdersTable.tsx
- Detail page
  - src/components/admin/transferOrder/TransferOrderContainer.tsx
  - src/components/admin/transferOrder/TransferOrderItemsTable.tsx
- Services
  - src/service/transferOrders.tsx

Routes
- /transfer-orders (listing)
- /transfer-orders/:transfer-order-id (detail)

Service API (Supabase)
- List: getAllTransferOrders()
- Get detail (with items): getTransferOrder(id)
- Create header (draft by default): createTransferOrder(partial)
- Update header: updateTransferOrder(id, patch)
- Upsert items (create/update): upsertTransferOrderItems(items[])
- Delete item: deleteTransferOrderItem(id)
- Delete order: deleteTransferOrder(id)
- Workflow status: setTransferOrderStatus(id, nextStatus)

State flow and permissions
- States: PENDING | IN_TRANSIT | COMPLETED | CANCELLED
- Edit items only allowed in PENDING (mirrors LoadOrders draft-like restriction).
- Status transitions wired via setTransferOrderStatus; confirm if there are RPCs to mirror LoadOrders workflow 1:1.

Inline items table behavior
- First column is an async ProductSelector with:
  - 300 ms debounce
  - API query to products
  - Recent result cache (in ProductSelector)
  - Keyboard navigation support (arrows, Enter, Escape)
  - Selection by Enter or click
  - Renders SKU/short code and product name (as available)
- On selecting a product:
  - Fills derived fields (product_id; UOM if available in the type; current types are minimal)
  - Moves focus to next editable cell (quantity)
- Item validations:
  - Product is required
  - Quantity required and > 0
  - Prevent duplicated products at order level (inline validation)
  - If backend provides stock constraints, reject upon save (surface error from service)
- Add row:
  - New empty row at the end
  - Focus moves to quantity after selecting a product
  - Pressing Enter on the last cell adds a new row
- Delete row:
  - If item persisted: confirmation dialog via DeleteTableElementPopUp
  - If not persisted: remove immediately
- Save:
  - Upserts items with minimal allowed fields
  - Optimistic notifications; refetch detail on success
  - Rollback pattern can be added if your backend supports it
- Unsaved changes:
  - beforeunload listener warns about unsaved item changes
  - When changing state, if there are unsaved items, a confirm prompt prevents accidental loss

Performance considerations
- Table follows the same memoization/updates partitioning approach used in the project. If the table grows massively, integrate virtualization similarly to LoadOrders list/table (no virtualization primitives were present in repo).

Accessibility
- Keyboard navigation supported in ProductSelector; Enter adds rows, Delete removes non-persisted row.
- Focus is moved appropriately to the next input.
- Inline error messages per field; form-level error summary rendered when save fails.

Testing
- Unit tests: (pending) for table logic and ProductSelector interaction stubs.
- Integration tests: (pending) for validations and save flows.
- E2E tests: (pending) to cover draft creation, adding multiple items inline, duplicate prevention, quantity validations, successful save, status changes, and edit restrictions outside PENDING.

Notes / differences from LoadOrders
- Only functional difference: editing items inline using ProductSelector as the first column.
- All other patterns (architecture, hooks, i18n, errors, toasts, confirmations) follow existing conventions.

Next steps (if applicable)
- If the backend exposes dedicated actions for workflow transitions (submit/approve/in-transit/receive/cancel), wire RPC/REST calls 1:1 in transferOrders service.
- Confirm and add a test runner (e.g., Vitest + React Testing Library) and an E2E runner (Playwright/Cypress). Then implement the test suite described above.