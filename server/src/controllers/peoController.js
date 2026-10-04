import PEO from '../models/PEO.js';
import PLO from '../models/PLO.js';

// @desc    Get all PEOs
// @route   GET /api/peos
// @access  Private
export const getPEOs = async (req, res) => {
    try {
        const peos = await PEO.find().populate('program', 'name code').sort({ createdAt: -1 });
        res.status(200).json(peos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a PEO
// @route   POST /api/peos
// @access  Private/Admin
export const createPEO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to create PEO' });

        const peo = new PEO(req.body);
        const savedPEO = await peo.save();
        
        const populatedPEO = await PEO.findById(savedPEO._id).populate('program', 'name code');
        res.status(201).json(populatedPEO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A PEO with this code already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a PEO
// @route   PUT /api/peos/:id
// @access  Private/Admin
export const updatePEO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to update PEO' });

        const updatedPEO = await PEO.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('program', 'name code');

        if (!updatedPEO) return res.status(404).json({ message: 'PEO not found' });
        res.status(200).json(updatedPEO);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A PEO with this code already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a PEO
// @route   DELETE /api/peos/:id
// @access  Private/Admin
export const deletePEO = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to delete PEO' });

        const deletedPEO = await PEO.findByIdAndDelete(req.params.id);
        if (!deletedPEO) return res.status(404).json({ message: 'PEO not found' });
        
        res.status(200).json({ message: 'PEO deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Map PEO to PLOs
// @route   PUT /api/peos/:id/map-plos
// @access  Private/Admin
export const mapPEOtoPLOs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const peoId = req.params.id;
        const { ploIds } = req.body;

        const peo = await PEO.findById(peoId);
        if (!peo) return res.status(404).json({ message: 'PEO not found' });

        // Remove this PEO from all PLOs in the program, then add to selected
        await PLO.updateMany({ program: peo.program }, { $pull: { peos: peoId } });
        if (ploIds && ploIds.length > 0) {
            await PLO.updateMany({ _id: { $in: ploIds } }, { $addToSet: { peos: peoId } });
        }

        const updatedPEO = await PEO.findById(peoId).populate('program', 'name code');
        res.status(200).json({ peo: updatedPEO, mappedPLOs: ploIds || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
