import CLO from '../models/CLO.js';

// @desc    Get all CLOs (optionally filter by course)
// @route   GET /api/clos?course=courseId
// @access  Private
export const getCLOs = async (req, res) => {
    try {
        const filter = req.query.course ? { course: req.query.course } : {};
        const clos = await CLO.find(filter)
            .populate('course', 'name code creditHours program')
            .populate({
                path: 'plos.plo',
                select: 'code description program',
                populate: { path: 'program', select: 'name code' }
            })
            .populate('gas.ga', 'code name description')
            .sort({ course: 1, code: 1 });
        res.status(200).json(clos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a CLO
// @route   POST /api/clos
// @access  Private/Admin
export const createCLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to create CLO' });

        // Validate total weightage for the course does not exceed 100%
        const existingCLOs = await CLO.find({ course: req.body.course });
        const totalExisting = existingCLOs.reduce((sum, c) => sum + (c.weightage || 0), 0);
        const newWeightage = Number(req.body.weightage) || 0;

        if (totalExisting + newWeightage > 100) {
            return res.status(400).json({ 
                message: `Total weightage exceeds 100%. Currently used: ${totalExisting}%. You can add at most ${100 - totalExisting}%.` 
            });
        }

        const clo = new CLO(req.body);
        const savedCLO = await clo.save();

        const populatedCLO = await CLO.findById(savedCLO._id)
            .populate('course', 'name code creditHours program')
            .populate({ path: 'plos.plo', select: 'code description', populate: { path: 'program', select: 'name code' } })
            .populate('gas.ga', 'code name description');

        res.status(201).json(populatedCLO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A CLO with this code already exists for this course.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a CLO
// @route   PUT /api/clos/:id
// @access  Private/Admin
export const updateCLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to update CLO' });

        // Validate weightage
        if (req.body.weightage !== undefined) {
            const existingCLOs = await CLO.find({ course: req.body.course, _id: { $ne: req.params.id } });
            const totalExisting = existingCLOs.reduce((sum, c) => sum + (c.weightage || 0), 0);
            const newWeightage = Number(req.body.weightage) || 0;

            if (totalExisting + newWeightage > 100) {
                return res.status(400).json({ 
                    message: `Total weightage exceeds 100%. Other CLOs use: ${totalExisting}%. You can set at most ${100 - totalExisting}%.` 
                });
            }
        }

        const updatedCLO = await CLO.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        )
        .populate('course', 'name code creditHours program')
        .populate({ path: 'plos.plo', select: 'code description', populate: { path: 'program', select: 'name code' } })
        .populate('gas.ga', 'code name description');

        if (!updatedCLO) return res.status(404).json({ message: 'CLO not found' });
        res.status(200).json(updatedCLO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A CLO with this code already exists for this course.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a CLO
// @route   DELETE /api/clos/:id
// @access  Private/Admin
export const deleteCLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to delete CLO' });

        const deletedCLO = await CLO.findByIdAndDelete(req.params.id);
        if (!deletedCLO) return res.status(404).json({ message: 'CLO not found' });
        
        res.status(200).json({ message: 'CLO deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Map CLO to PLOs
// @route   PUT /api/clos/:id/map-plos
// @access  Private/Admin
export const mapCLOtoPLOs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { plos } = req.body; // Array of PLO IDs

        const updatedCLO = await CLO.findByIdAndUpdate(
            req.params.id,
            { plos },
            { new: true }
        )
        .populate('course', 'name code creditHours program')
        .populate({ path: 'plos.plo', select: 'code description', populate: { path: 'program', select: 'name code' } })
        .populate('gas.ga', 'code name description');

        if (!updatedCLO) return res.status(404).json({ message: 'CLO not found' });
        res.status(200).json(updatedCLO);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Map CLO to GAs
// @route   PUT /api/clos/:id/map-gas
// @access  Private/Admin
export const mapCLOtoGAs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { gas } = req.body;

        const updatedCLO = await CLO.findByIdAndUpdate(
            req.params.id,
            { gas },
            { new: true }
        )
        .populate('course', 'name code creditHours program')
        .populate({ path: 'plos.plo', select: 'code description', populate: { path: 'program', select: 'name code' } })
        .populate('gas.ga', 'code name description');

        if (!updatedCLO) return res.status(404).json({ message: 'CLO not found' });
        res.status(200).json(updatedCLO);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
