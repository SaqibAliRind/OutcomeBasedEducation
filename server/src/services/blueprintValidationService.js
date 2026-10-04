import { Blueprint } from '../models/index.js';

export const validateMappingAgainstBlueprint = async (mappingData) => {
    // 1. Find the corresponding Blueprint
    const blueprint = await Blueprint.findOne({
        course: mappingData.course,
        teacher: mappingData.teacher,
        assessment: mappingData.assessment,
        status: { $in: ['Approved', 'Submitted'] } // Blueprint should be finalized ideally, but we check any active one
    });

    if (!blueprint) {
        // If no blueprint exists, we can't validate against it. In a strict system, this might throw an error.
        // For now, we will throw an error if the user is trying to submit without a blueprint.
        throw new Error('A Blueprint must be created and Approved/Submitted before submitting this Question Mapping.');
    }

    // 2. Aggregate Mapping Data
    let totalMarksMapping = 0;
    const cloBtMarksMap = {}; // Key: "cloId_btLevel", Value: marks

    for (const q of mappingData.questions) {
        totalMarksMapping += Number(q.marks) || 0;
        
        if (q.clo && q.btLevel) {
            const key = `${q.clo.toString()}_${q.btLevel}`;
            if (!cloBtMarksMap[key]) cloBtMarksMap[key] = 0;
            cloBtMarksMap[key] += Number(q.marks) || 0;
        }
    }

    // 3. Validate Total Marks
    if (totalMarksMapping !== blueprint.totalMarks) {
        throw new Error(`Total marks in mapping (${totalMarksMapping}) do not match blueprint total marks (${blueprint.totalMarks}).`);
    }

    // 4. Validate CLO and BT Level coverage against Blueprint rows
    const missingOrMismatched = [];

    for (const row of blueprint.rows) {
        const key = `${row.clo.toString()}_${row.bloomsLevel}`;
        const mappingMarksForThisRow = cloBtMarksMap[key] || 0;

        if (mappingMarksForThisRow !== row.marks) {
            missingOrMismatched.push(`Blueprint requires ${row.marks} marks for CLO: ${row.clo} at BT Level: ${row.bloomsLevel}. Mapping provides ${mappingMarksForThisRow} marks.`);
        }
    }

    if (missingOrMismatched.length > 0) {
        throw new Error('Blueprint validation failed:\n' + missingOrMismatched.join('\n'));
    }

    return true; // Passed validation
};
