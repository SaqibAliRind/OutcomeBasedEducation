import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────
// Immutable OBE Snapshot — created ONLY via explicit finalize action
// Calculate OBE updates StudentAttainment (live). This model stores
// point-in-time copies; all values are embedded strings/numbers —
// no ObjectId references that could change after archiving.
// ─────────────────────────────────────────────────────────────────

const cloSnapshotSchema = new mongoose.Schema({
    cloId:       { type: String, required: true },
    code:        { type: String, required: true },
    name:        { type: String, default: '' },
    description: { type: String, default: '' },
    target:      { type: Number, required: true },
    achieved:    { type: Number, required: true }, // avg % across students
    gap:         { type: Number, required: true },  // target − achieved
    status:      { type: String, enum: ['Met', 'Not Met'], required: true },
    attainmentRate: { type: Number, default: 0 },  // % of students who met threshold
    studentsAssessed: { type: Number, default: 0 }
}, { _id: false });

const ploSnapshotSchema = new mongoose.Schema({
    ploId:       { type: String, required: true },
    code:        { type: String, required: true },
    name:        { type: String, default: '' },
    description: { type: String, default: '' },
    target:      { type: Number, required: true },
    achieved:    { type: Number, required: true },
    gap:         { type: Number, required: true },
    status:      { type: String, enum: ['Met', 'Not Met'], required: true },
    attainmentRate: { type: Number, default: 0 }
}, { _id: false });

const gaSnapshotSchema = new mongoose.Schema({
    gaId:     { type: String, required: true },
    code:     { type: String, required: true },
    name:     { type: String, default: '' },
    target:   { type: Number, required: true },
    achieved: { type: Number, required: true },
    gap:      { type: Number, required: true },
    status:   { type: String, enum: ['Met', 'Not Met'], required: true }
}, { _id: false });

const assessmentSnapshotSchema = new mongoose.Schema({
    assessmentId:  { type: String },
    name:          { type: String },
    type:          { type: String },
    totalMarks:    { type: Number },
    passingMarks:  { type: Number }
}, { _id: false });

const obeSnapshotSchema = new mongoose.Schema({
    // ── Context ──────────────────────────────────────────────────
    courseOfferingId: { type: String, required: true },
    courseId:         { type: String, required: true },
    courseCode:       { type: String, required: true },
    courseName:       { type: String, required: true },
    teacherId:        { type: String, default: null },
    teacherName:      { type: String, default: '' },
    sectionId:        { type: String, default: null },
    sectionName:      { type: String, default: '' },
    semesterId:       { type: String, default: null },
    semesterName:     { type: String, default: '' },
    sessionId:        { type: String, default: null },
    sessionName:      { type: String, default: '' },
    programId:        { type: String, default: null },
    programName:      { type: String, default: '' },
    departmentId:     { type: String, default: null },
    departmentName:   { type: String, default: '' },
    universityId:     { type: String, default: null },
    universityName:   { type: String, default: '' },
    academicYear:     { type: String, default: '' },

    // ── Targets used at snapshot time ────────────────────────────
    cloTargetUsed:    { type: Number, required: true },
    ploTargetUsed:    { type: Number, required: true },
    gaTargetUsed:     { type: Number, required: true },

    // ── Attainment data (fully embedded, immutable) ───────────────
    clos:  [cloSnapshotSchema],
    plos:  [ploSnapshotSchema],
    gas:   [gaSnapshotSchema],
    assessments: [assessmentSnapshotSchema],

    // ── Aggregate stats ──────────────────────────────────────────
    totalStudents:     { type: Number, default: 0 },
    avgCloAchievement: { type: Number, default: 0 },
    avgPloAchievement: { type: Number, default: 0 },
    avgGaAchievement:  { type: Number, default: 0 },
    passRate:          { type: Number, default: 0 },
    failRate:          { type: Number, default: 0 },

    // ── Snapshot metadata ────────────────────────────────────────
    version:         { type: Number, default: 1 },
    snapshotLabel:   { type: String, default: '' },      // e.g. "Fall 2024 Final"
    status:          { type: String, enum: ['Draft', 'Finalized'], default: 'Finalized' },
    archivedAt:      { type: Date, default: Date.now },
    archivedById:    { type: String, required: true },
    archivedByName:  { type: String, required: true },
    archivedByRole:  { type: String, required: true },

    // ── Source reference (non-binding, for traceability) ─────────
    sourceAttainmentIds: [{ type: String }]  // IDs of StudentAttainment docs at time of snapshot
}, {
    timestamps: true
});

// Unique: prevent exact duplicate version for same offering
obeSnapshotSchema.index(
    { courseOfferingId: 1, version: 1 },
    { unique: true }
);

const ObeSnapshot = mongoose.model('ObeSnapshot', obeSnapshotSchema);
export default ObeSnapshot;
