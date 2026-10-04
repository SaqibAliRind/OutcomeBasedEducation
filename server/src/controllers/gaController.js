import GA from '../models/GA.js';
import PLO from '../models/PLO.js';

const STANDARD_GAS = [
  { code: 'GA1',  name: 'Engineering / Computing Knowledge',      description: 'Apply knowledge of mathematics, natural science, computing/engineering fundamentals and specialization to solve complex problems.' },
  { code: 'GA2',  name: 'Problem Analysis',                        description: 'Identify, formulate, research literature, and analyze complex problems reaching substantiated conclusions.' },
  { code: 'GA3',  name: 'Design/Development of Solutions',         description: 'Design solutions for complex problems and systems that meet specified needs with consideration for societal and environmental factors.' },
  { code: 'GA4',  name: 'Investigation',                           description: 'Conduct investigations of complex problems using research-based knowledge including design of experiments, analysis and interpretation of data.' },
  { code: 'GA5',  name: 'Modern Tool Usage',                       description: 'Create, select and apply appropriate techniques, resources, and modern engineering and IT tools to complex activities.' },
  { code: 'GA6',  name: 'The Engineer / Professional and Society',  description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues.' },
  { code: 'GA7',  name: 'Environment and Sustainability',          description: 'Understand the impact of professional engineering/computing solutions in societal and environmental contexts.' },
  { code: 'GA8',  name: 'Ethics',                                  description: 'Apply ethical principles and commit to professional ethics, responsibilities and norms of professional practice.' },
  { code: 'GA9',  name: 'Individual and Team Work',                description: 'Function effectively as an individual, and as a member or leader in diverse teams and multi-disciplinary settings.' },
  { code: 'GA10', name: 'Communication',                           description: 'Communicate effectively on complex activities with the engineering/computing community and with society at large.' },
  { code: 'GA11', name: 'Project Management & Finance',            description: 'Demonstrate knowledge and understanding of engineering/computing and management principles and apply these to one\'s own work.' },
  { code: 'GA12', name: 'Lifelong Learning',                       description: 'Recognize the need for, and engage in independent and life-long learning in the broadest context of technological change.' },
];

// @desc    Get all GAs
// @route   GET /api/gas
export const getGAs = async (req, res) => {
    try {
        const filter = req.query.program ? { program: req.query.program } : {};
        const gas = await GA.find(filter).populate('program', 'name code').sort({ program: 1, code: 1 });
        res.status(200).json(gas);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Create a GA
// @route   POST /api/gas
export const createGA = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to create GA' });
        const ga = new GA(req.body);
        const savedGA = await ga.save();
        const populatedGA = await GA.findById(savedGA._id).populate('program', 'name code');
        res.status(201).json(populatedGA);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'A GA with this code already exists for this program.' });
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a GA
// @route   PUT /api/gas/:id
export const updateGA = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to update GA' });
        const updatedGA = await GA.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('program', 'name code');
        if (!updatedGA) return res.status(404).json({ message: 'GA not found' });
        res.status(200).json(updatedGA);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'A GA with this code already exists for this program.' });
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a GA
// @route   DELETE /api/gas/:id
export const deleteGA = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized to delete GA' });
        const deletedGA = await GA.findByIdAndDelete(req.params.id);
        if (!deletedGA) return res.status(404).json({ message: 'GA not found' });
        res.status(200).json({ message: 'GA deleted successfully', id: req.params.id });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Map GA → PLOs (reverse: update PLO.gas arrays)
// @route   PUT /api/gas/:id/map-plos
export const mapGAtoPLOs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });
        const gaId = req.params.id;
        const { ploIds } = req.body;
        const ga = await GA.findById(gaId);
        if (!ga) return res.status(404).json({ message: 'GA not found' });
        // Remove this GA from all PLOs in the program, then add to selected
        await PLO.updateMany({ program: ga.program }, { $pull: { gas: gaId } });
        if (ploIds && ploIds.length > 0) {
            await PLO.updateMany({ _id: { $in: ploIds } }, { $addToSet: { gas: gaId } });
        }
        const updatedGA = await GA.findById(gaId).populate('program', 'name code');
        res.status(200).json({ ga: updatedGA, mappedPLOs: ploIds || [] });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Bulk initialize all 12 standard GAs for a program
// @route   POST /api/gas/bulk-init
export const bulkInitGAs = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });
        const { programId } = req.body;
        if (!programId) return res.status(400).json({ message: 'programId is required' });
        const created = [];
        const skipped = [];
        for (const tmpl of STANDARD_GAS) {
            try {
                const existing = await GA.findOne({ code: tmpl.code, program: programId });
                if (existing) { skipped.push(tmpl.code); continue; }
                const saved = await new GA({ ...tmpl, program: programId, status: 'Active' }).save();
                created.push(await GA.findById(saved._id).populate('program', 'name code'));
            } catch (err) { skipped.push(tmpl.code); }
        }
        res.status(201).json({ created, skipped, message: `Created ${created.length} GAs, skipped ${skipped.length} (already exist).` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};
