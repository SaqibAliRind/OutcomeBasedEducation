import express from 'express';
import { calculateObeAttainment, getObeAttainment, getAttainmentSummary } from '../controllers/obeEngineController.js';
import { createObeSnapshot, listObeSnapshots, getObeSnapshot, compareObeSnapshots } from '../controllers/obeSnapshotController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// ── Live calculation (updates StudentAttainment) ──────────────────
router.post('/calculate/:courseOfferingId', authorize('Teacher', 'HOD', 'UniversityAdmin', 'SuperAdmin'), calculateObeAttainment);

// ── Per-student live attainment ───────────────────────────────────
router.get('/attainment/:courseOfferingId', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin', 'Student'), getObeAttainment);

// ── Class-level aggregate summary ────────────────────────────────
router.get('/attainment-summary/:courseOfferingId', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAttainmentSummary);

// ── OBE Snapshots / Historical Archive ───────────────────────────
// POST  /api/obe/archive/:courseOfferingId  — create immutable snapshot (explicit action)
router.post('/archive/:courseOfferingId', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin'), createObeSnapshot);

// GET   /api/obe/archive                   — list all snapshots (filtered)
router.get('/archive', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'QEC', 'Dean', 'UniversityAdmin', 'SuperAdmin'), listObeSnapshots);

// GET   /api/obe/archive/compare/:id1/:id2 — compare two snapshots  (must come before /:id)
router.get('/archive/compare/:id1/:id2', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'QEC', 'Dean', 'UniversityAdmin', 'SuperAdmin'), compareObeSnapshots);

// GET   /api/obe/archive/:id               — get single snapshot with full data
router.get('/archive/:id', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'QEC', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getObeSnapshot);

export default router;

