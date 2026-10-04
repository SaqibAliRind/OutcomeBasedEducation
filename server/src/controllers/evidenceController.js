import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Evidence } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads/evidence');

// Ensure upload directory exists
const ensureDir = async () => {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
};

// @desc    Upload accreditation evidence
// @route   POST /api/evidence
// @access  Private (QEC, Admin, Program Coordinator)
export const uploadEvidence = async (req, res) => {
    try {
        await ensureDir();

        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const { title, description, linkedType, linkedId, tags } = req.body;
        const uploadedFile = req.files.file;

        // Clean filename and create unique path
        const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}-${safeName}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);

        // Move file using express-fileupload's mv()
        await uploadedFile.mv(filePath);

        // Parse tags if sent as JSON string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = tags.split(',').map(t => t.trim());
            }
        }

        const evidence = await Evidence.create({
            title,
            description,
            fileName: uploadedFile.name,
            fileUrl: `/uploads/evidence/${uniqueName}`,
            fileType: uploadedFile.mimetype,
            fileSize: uploadedFile.size,
            uploadedBy: req.user._id,
            linkedType: linkedType || 'General',
            linkedId: linkedId || null,
            tags: parsedTags
        });

        res.status(201).json(evidence);
    } catch (error) {
        console.error('Evidence Upload Error:', error);
        res.status(500).json({ message: 'Failed to upload evidence.' });
    }
};

// @desc    Get all evidence records
// @route   GET /api/evidence
// @access  Private
export const getEvidence = async (req, res) => {
    try {
        const { linkedType, linkedId, tag } = req.query;
        let filter = {};

        if (linkedType) filter.linkedType = linkedType;
        if (linkedId) filter.linkedId = linkedId;
        if (tag) filter.tags = tag;

        const records = await Evidence.find(filter)
            .populate('uploadedBy', 'name role')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving evidence records.' });
    }
};

// @desc    Delete evidence record
// @route   DELETE /api/evidence/:id
// @access  Private (QEC, Admin)
export const deleteEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found.' });
        }

        // Delete physical file
        const fileName = path.basename(evidence.fileUrl);
        const filePath = path.join(UPLOAD_DIR, fileName);
        try {
            await fs.unlink(filePath);
        } catch (fileErr) {
            console.error(`Warning: Could not delete file ${filePath}`);
        }

        await evidence.deleteOne();
        res.json({ message: 'Evidence deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete evidence.' });
    }
};
