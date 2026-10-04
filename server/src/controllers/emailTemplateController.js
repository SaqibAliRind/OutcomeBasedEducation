import EmailTemplate from '../models/EmailTemplate.js';

const DEFAULT_TEMPLATES = [
  { name: 'Welcome Email', subject: 'Welcome to [University Name]!', body: 'Dear [Name],\n\nWelcome to our university ERP system.\n\nYour credentials:\nEmail: [Email]\nPassword: [Password]\n\nLogin: [LoginLink]\n\nRegards,\nAdmin Team', tags: ['[Name]', '[Email]', '[Password]', '[LoginLink]'] },
  { name: 'Password Reset', subject: 'Password Reset Request', body: 'Dear [Name],\n\nWe received a request to reset your password.\n\nClick the link below to reset:\n[ResetLink]\n\nThis link expires in [ExpiryTime].\n\nRegards,\nAdmin Team', tags: ['[Name]', '[ResetLink]', '[ExpiryTime]'] },
  { name: 'Account Activation', subject: 'Activate Your Account', body: 'Dear [Name],\n\nPlease activate your account:\n[ActivationLink]\n\nOr use OTP: [OTP]\n\nRegards,\nAdmin Team', tags: ['[Name]', '[ActivationLink]', '[OTP]'] },
  { name: 'Registration Confirmation', subject: 'Course Registration Successful', body: 'Dear [StudentName],\n\nYour course registration for [Semester] is confirmed.\n\nRegistered Courses:\n[CourseList]\n\nRegards,\nAdmin Team', tags: ['[StudentName]', '[Semester]', '[CourseList]'] },
  { name: 'Attendance Warning', subject: 'Low Attendance Warning', body: 'Dear [StudentName],\n\nYour attendance in [CourseName] is [CurrentAttendance]%, below the required [Threshold]%.\n\nPlease improve attendance to avoid academic penalty.\n\nRegards,\nAdmin Team', tags: ['[StudentName]', '[CourseName]', '[CurrentAttendance]', '[Threshold]'] },
  { name: 'Result Published', subject: 'Semester Results Declared', body: 'Dear [StudentName],\n\nYour results for [Semester] have been published.\n\nGPA: [GPA]\n\nView full result: [PortalLink]\n\nRegards,\nAdmin Team', tags: ['[StudentName]', '[Semester]', '[GPA]', '[PortalLink]'] },
  { name: 'Survey Invitation', subject: 'Please complete your survey', body: 'Dear [Name],\n\nYou are invited to fill out: [SurveyName]\n\nLink: [SurveyLink]\nDeadline: [Deadline]\n\nRegards,\nAdmin Team', tags: ['[Name]', '[SurveyName]', '[SurveyLink]', '[Deadline]'] },
  { name: 'Approval Notification', subject: 'Workflow Approval Required', body: 'Dear [ApproverName],\n\nA [DocumentType] submitted by [SubmittedBy] requires your review.\n\nReview here: [ReviewLink]\n\nRegards,\nAdmin Team', tags: ['[ApproverName]', '[DocumentType]', '[SubmittedBy]', '[ReviewLink]'] },
];

// @desc   Get all email templates for the university (creates defaults if none)
// @route  GET /api/email-templates
export const getTemplates = async (req, res) => {
  try {
    const universityId = req.user.university;
    if (!universityId) return res.status(400).json({ message: 'University not assigned to user' });

    let templates = await EmailTemplate.find({ university: universityId }).lean();

    // Seed defaults on first load
    if (templates.length === 0) {
      const docs = DEFAULT_TEMPLATES.map(t => ({ ...t, university: universityId, lastUpdatedBy: req.user.name || 'System' }));
      templates = await EmailTemplate.insertMany(docs);
    }

    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update a single email template
// @route  PUT /api/email-templates/:id
export const updateTemplate = async (req, res) => {
  try {
    const { subject, body } = req.body;
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { subject, body, lastUpdatedBy: req.user.name || req.user.email },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Send a test email using a template
// @route  POST /api/email-templates/:id/send-test
export const sendTestEmail = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Try to send via SMTP if configured
    const { default: SystemSettings } = await import('../models/SystemSettings.js');
    const settings = await SystemSettings.findOne();

    if (!settings?.smtp?.email) {
      return res.status(400).json({ message: 'SMTP not configured. Please set up email in System Settings.' });
    }

    const { default: nodemailer } = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: settings.smtp.host,
      port: Number(settings.smtp.port),
      secure: settings.smtp.encryption === 'SSL',
      auth: { user: settings.smtp.email, pass: settings.smtp.password }
    });

    await transporter.sendMail({
      from: settings.smtp.email,
      to: req.user.email,
      subject: `[TEST] ${template.subject}`,
      text: template.body
    });

    res.json({ success: true, message: `Test email sent to ${req.user.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
