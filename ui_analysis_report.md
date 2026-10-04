# UI Consistency & Standardization Audit Report

Based on the recent review of the Al-Kawthar OBE System, the following UI inconsistencies have been identified across various components. 

## 1. Forms & Modals Standardization
**Issue**: Several components utilize custom inline styles or raw `<form>` tags rather than utilizing the standardized `.modal-form` and `.form-group` classes defined in `SuperAdminDashboard.css`.
**Impacted Components (Non-Exhaustive)**:
- `RoleManagement.jsx`
- `Admission.jsx`
- `AIFeatures.jsx`
- `AssessmentDefinition.jsx`
- `AttendanceManagement.jsx`
- `BlueprintManagement.jsx`
- `CourseFileManagement.jsx`
- `QuestionBank.jsx`
- `UniversitySettings.jsx`
- `WorkflowEngine.jsx`

**Resolution Plan**:
- Standardize all `<form>` instances inside modals to use `className="modal-form"`.
- Wrap all form inputs in `className="form-group"` to ensure consistent padding, labeling, and hover states.

## 2. Button Styling & Action Buttons
**Issue**: There are over 200 instances of buttons using `style={{...}}` across the application instead of relying on standard CSS classes. 
**Details**: 
- Many action buttons (Edit, Delete, Save) use inline CSS gradients (e.g. `linear-gradient(135deg, #0ff0fc, #2196f3)`) or explicit inline `background: 'transparent'`.
- This causes minor visual discrepancies in hover animations and padding when navigating between different management screens.

**Impacted Components (Examples)**:
- `AccreditationManagement.jsx`
- `AcademicRecord.jsx`
- `CurriculumBuilder.jsx`

**Resolution Plan**:
- Replace inline gradient/save buttons with `className="primary-btn"`.
- Replace inline transparent action buttons with `className="action-btn edit"` or `className="action-btn delete"`.
- Replace inline cancel/close buttons with `className="cancel-btn"`.

## 3. Alerts & Toasts
**Issue**: Success/Error toasts are currently implemented using hardcoded `div` elements with fixed positions and inline styles inside many components (e.g., `style={{ position: 'fixed', top: '20px', right: '24px', ... }}`).
**Resolution Plan**:
- Extract these into a global `<ToastProvider />` or utilize standard `.um-alert.success` / `.um-alert.error` classes to ensure they look uniform.

---
### Next Steps
We will systematically go through the highest priority components (like `AccreditationManagement`, `AssessmentDefinition`, and `UniversitySettings`) to replace these inline properties with our standard CSS system.
