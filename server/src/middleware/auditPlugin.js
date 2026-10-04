import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

export const auditPlugin = (schema, options = {}) => {
    // We cannot reliably track the 'performedBy' inside a mongoose hook easily 
    // without AsyncLocalStorage or passing options. But we will do our best by extracting from query options.
    
    // 1. Hook for tracking Document.save()
    schema.pre('save', function () {
        if (this.isNew) {
            this._auditAction = 'CREATE';
            this._auditChanges = this.toObject();
        } else {
            this._auditAction = 'UPDATE';
            this._auditChanges = {};
            const modifiedPaths = this.modifiedPaths();
            
            modifiedPaths.forEach(path => {
                const oldVal = this.$locals.original ? this.$locals.original[path] : undefined;
                const newVal = this.get(path);
                // Ignore timestamps
                if (path !== 'updatedAt' && path !== 'createdAt') {
                    this._auditChanges[path] = { old: oldVal, new: newVal };
                }
            });
        }
    });

    // Capture original state before save
    schema.post('init', function (doc) {
        doc.$locals.original = doc.toObject();
    });

    schema.post('save', async function (doc) {
        if (Object.keys(doc._auditChanges || {}).length > 0) {
            const userId = doc.$locals.userId || null; // Can be passed via doc.$locals.userId before save
            try {
                await AuditLog.create({
                    entityId: doc._id,
                    entityType: doc.constructor.modelName,
                    action: doc._auditAction,
                    changes: doc._auditChanges,
                    performedBy: userId
                });
            } catch (err) {
                console.error('AuditLog Error on save:', err);
            }
        }
    });

    // 2. Hook for Query updates (findOneAndUpdate, updateOne, updateMany)
    const updateHooks = ['findOneAndUpdate', 'updateOne', 'updateMany'];
    
    updateHooks.forEach(hook => {
        schema.pre(hook, async function () {
            this._auditAction = 'UPDATE';
            this._auditOriginalDocs = await this.model.find(this.getQuery()).lean();
        });

        schema.post(hook, async function (result) {
            const updateObj = this.getUpdate();
            const options = this.getOptions();
            const userId = options.context?.userId || null;
            
            if (!this._auditOriginalDocs || this._auditOriginalDocs.length === 0) return;

            try {
                for (const orig of this._auditOriginalDocs) {
                    // This is a rough estimation of changes for query updates
                    const changes = {};
                    if (updateObj.$set) {
                        for (const key in updateObj.$set) {
                            if (updateObj.$set[key] !== orig[key]) {
                                changes[key] = { old: orig[key], new: updateObj.$set[key] };
                            }
                        }
                    }
                    
                    if (Object.keys(changes).length > 0) {
                        await AuditLog.create({
                            entityId: orig._id,
                            entityType: this.model.modelName,
                            action: 'UPDATE',
                            changes,
                            performedBy: userId
                        });
                    }
                }
            } catch (err) {
                console.error('AuditLog Error on query update:', err);
            }
        });
    });

    // 3. Hook for Deletion
    const deleteHooks = ['findOneAndDelete', 'deleteOne', 'deleteMany'];
    deleteHooks.forEach(hook => {
        schema.pre(hook, async function () {
            this._auditOriginalDocs = await this.model.find(this.getQuery()).lean();
        });

        schema.post(hook, async function (result) {
            const options = this.getOptions();
            const userId = options.context?.userId || null;
            
            if (!this._auditOriginalDocs) return;

            try {
                for (const orig of this._auditOriginalDocs) {
                    await AuditLog.create({
                        entityId: orig._id,
                        entityType: this.model.modelName,
                        action: 'DELETE',
                        changes: orig,
                        performedBy: userId
                    });
                }
            } catch (err) {
                console.error('AuditLog Error on delete:', err);
            }
        });
    });
};
