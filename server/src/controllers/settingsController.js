import SystemSettings from '../models/SystemSettings.js';
import nodemailer from 'nodemailer';

// Helper: Ensure 1 config document exists, seeding from env vars if not set
const getOrCreateSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = await SystemSettings.create({
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || '587',
                email: process.env.SMTP_EMAIL || '',
                password: '', // Never seed password into DB from env
                encryption: 'TLS',
                senderName: process.env.SMTP_SENDER_NAME || 'Al-Kawthar University'
            },
            cloudinary: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
                apiKey: process.env.CLOUDINARY_API_KEY || '',
                apiSecret: '' // Never seed secret into DB from env
            }
        });
    }
    let settingsObj = settings.toObject ? settings.toObject() : settings;
    // If cloudinary is not configured in DB but env has it, show it
    if (!settingsObj.cloudinary?.cloudName && process.env.CLOUDINARY_CLOUD_NAME) {
        settingsObj._envCloudinaryConfigured = true;
    }
    if (!settingsObj.smtp?.email && process.env.SMTP_EMAIL) {
        settingsObj._envSmtpConfigured = true;
    }
    return settingsObj;
};


// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/SuperAdmin
export const getSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update system settings by module category
// @route   PUT /api/settings/:category
// @access  Private/SuperAdmin
export const updateSettings = async (req, res) => {
    try {
        const { category } = req.params; // 'smtp', 'jwt', 'cloudinary', 'backup', 'ai', 'attendance', 'marks', 'grades'
        
        let settings = await getOrCreateSettings();
        
        const validCategories = ['smtp', 'jwt', 'cloudinary', 'backup', 'ai', 'attendance', 'marks', 'grades'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid settings category' });
        }

        // For grades, handle nested update carefully (scales array + policies object)
        if (category === 'grades') {
            if (req.body.scales !== undefined) settings.grades.scales = req.body.scales;
            if (req.body.policies !== undefined) {
                settings.grades.policies = { ...settings.grades.policies._doc || settings.grades.policies, ...req.body.policies };
            }
        } else {
            settings[category] = { ...(settings[category]._doc || settings[category]), ...req.body };
        }

        settings.markModified(category);
        await settings.save();

        res.json({ success: true, data: settings, message: `${category.toUpperCase()} settings updated successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Test SMTP configuration
// @route   POST /api/settings/test-smtp
// @access  Private/SuperAdmin
export const testSmtpConnection = async (req, res) => {
    try {
        const { host, port, email, password, encryption } = req.body;
        
        const transporter = nodemailer.createTransport({
            host,
            port: Number(port),
            secure: encryption === 'SSL' || Number(port) === 465, 
            auth: { user: email, pass: password },
            tls: { rejectUnauthorized: false }
        });

        await transporter.verify();
        res.json({ success: true, message: 'SMTP connection successful!' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'SMTP connection failed: ' + error.message });
    }
};

import cloudinary from '../config/cloudinary.js';

// @desc    Test Cloudinary connection
// @route   POST /api/settings/test-cloudinary
// @access  Private/SuperAdmin
export const testCloudinaryConnection = async (req, res) => {
    try {
        const { cloudName, apiKey, apiSecret } = req.body;
        if (!cloudName || !apiKey || !apiSecret) {
             return res.status(400).json({ success: false, message: 'Missing Cloudinary details.' });
        }
        
        // Dynamically override config to test user inputted keys
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });

        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            res.json({ success: true, message: 'Cloudinary API connection successful!' });
        } else {
            throw new Error('Ping failed.');
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'Cloudinary connection failed please check your keys.' });
    }
};

// ------------------------------------------------------------
// DATABASE BACKUP & RESTORE
// ------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Ensure backups dir exists
const BACKUP_DIR = path.resolve('backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// @desc    Trigger manual database backup to JSON
// @route   POST /api/settings/backup
// @access  Private/SuperAdmin
export const triggerManualBackup = async (req, res) => {
    try {
        const modelsToExport = Object.keys(mongoose.models);
        const backupData = {};

        for (const modelName of modelsToExport) {
            const Model = mongoose.models[modelName];
            backupData[modelName] = await Model.find({}).lean();
        }

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `db-backup-${dateStr}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        res.json({ success: true, message: 'Backup generated successfully.', filename });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Backup failed: ' + error.message });
    }
};

// @desc    Download the most recent database backup file
// @route   GET /api/settings/download-backup
// @access  Private/SuperAdmin
export const downloadBackup = async (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'No backup files found on server.' });
        }

        // Output the newest file (sort by creation time)
        files.sort((a, b) => {
            return fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime();
        });

        const latestFile = path.join(BACKUP_DIR, files[0]);
        res.download(latestFile);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Download failed: ' + error.message });
    }
};

// @desc    Restore database from uploaded JSON
// @route   POST /api/settings/restore
// @access  Private/SuperAdmin
export const restoreDatabase = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No backup file uploaded.' });
        }

        const fileData = req.files.file.data.toString('utf8');
        const parsedData = JSON.parse(fileData);

        const modelsInBackup = Object.keys(parsedData);
        for (const modelName of modelsInBackup) {
            if (mongoose.models[modelName]) {
                const Model = mongoose.models[modelName];
                // Warning: We are flushing the entire collection and re-inserting
                await Model.deleteMany({});
                if (parsedData[modelName].length > 0) {
                    await Model.insertMany(parsedData[modelName]);
                }
            }
        }

        res.json({ success: true, message: 'Database restored successfully from backup.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Restore failed: ' + error.message });
    }
};
