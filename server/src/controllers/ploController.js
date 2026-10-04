import PLO from '../models/PLO.js';

// @desc    Get all PLOs (optionally filter by program)
// @route   GET /api/plos
// @access  Private
export const getPLOs = async (req, res) => {
    try {
        const filter = req.query.program ? { program: req.query.program } : {};
        const plos = await PLO.find(filter)
            .populate('program', 'name code')
            .populate('peos', 'code description')
            .populate('gas', 'code name description')
            .sort({ program: 1, code: 1 });
        res.status(200).json(plos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a PLO
// @route   POST /api/plos
// @access  Private/Admin
export const createPLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to create PLO' });

        const plo = new PLO(req.body);
        const savedPLO = await plo.save();
        
        const populatedPLO = await PLO.findById(savedPLO._id)
            .populate('program', 'name code')
            .populate('peos', 'code description')
            .populate('gas', 'code name description');
        res.status(201).json(populatedPLO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A PLO with this code already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a PLO
// @route   PUT /api/plos/:id
// @access  Private/Admin
export const updatePLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to update PLO' });

        const updatedPLO = await PLO.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        )
        .populate('program', 'name code')
        .populate('peos', 'code description')
        .populate('gas', 'code name description');

        if (!updatedPLO) return res.status(404).json({ message: 'PLO not found' });
        res.status(200).json(updatedPLO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A PLO with this code already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a PLO
// @route   DELETE /api/plos/:id
// @access  Private/Admin
export const deletePLO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to delete PLO' });

        const deletedPLO = await PLO.findByIdAndDelete(req.params.id);
        if (!deletedPLO) return res.status(404).json({ message: 'PLO not found' });
        
        res.status(200).json({ message: 'PLO deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Map PLO to PEOs
// @route   PUT /api/plos/:id/map-peos
// @access  Private/Admin
export const mapPLOtoPEOs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { peos } = req.body; // Array of PEO IDs

        const updatedPLO = await PLO.findByIdAndUpdate(
            req.params.id,
            { peos },
            { new: true }
        )
        .populate('program', 'name code')
        .populate('peos', 'code description')
        .populate('gas', 'code name description');

        if (!updatedPLO) return res.status(404).json({ message: 'PLO not found' });
        res.status(200).json(updatedPLO);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Map PLO to GAs
// @route   PUT /api/plos/:id/map-gas
// @access  Private/Admin
export const mapPLOtoGAs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { gas } = req.body;

        const updatedPLO = await PLO.findByIdAndUpdate(
            req.params.id,
            { gas },
            { new: true }
        )
        .populate('program', 'name code')
        .populate('peos', 'code description')
        .populate('gas', 'code name description');

        if (!updatedPLO) return res.status(404).json({ message: 'PLO not found' });
        res.status(200).json(updatedPLO);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
