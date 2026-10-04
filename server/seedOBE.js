import 'dotenv/config';
import mongoose from 'mongoose';
import { GA, PEO, PLO, CLO, Program, Course, Department } from './src/models/index.js';

const seedOBE = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for OBE seeding.');

        // Get BSIT program
        const bsitProgram = await Program.findOne({ code: 'BSIT' });
        if (!bsitProgram) throw new Error('BSIT program not found. Run seedDB.js first.');
        console.log('Found BSIT Program:', bsitProgram.name);

        // Get courses
        const courses = await Course.find({ program: bsitProgram._id });
        if (!courses.length) throw new Error('No courses found for BSIT.');
        const [it101, it102, it103] = courses;

        // ─── 1. GRADUATE ATTRIBUTES (GAs) ──────────────────────────────────────
        // PEC (Pakistan Engineering Council) / HEC standard GAs for IT programs
        const gasData = [
            { code: 'GA1', name: 'Engineering Knowledge', description: 'Apply knowledge of mathematics, natural science, engineering fundamentals and an engineering specialization to the solution of complex engineering problems.' },
            { code: 'GA2', name: 'Problem Analysis', description: 'Identify, formulate, research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences and engineering sciences.' },
            { code: 'GA3', name: 'Design/Development of Solutions', description: 'Design solutions for complex engineering problems and design systems, components or processes that meet specified needs with appropriate consideration for public health and safety.' },
            { code: 'GA4', name: 'Investigation', description: 'Conduct investigations of complex problems using research-based knowledge and research methods including design of experiments, analysis and interpretation of data.' },
            { code: 'GA5', name: 'Modern Tool Usage', description: 'Create, select and apply appropriate techniques, resources, and modern engineering and IT tools, including prediction and modelling.' },
            { code: 'GA6', name: 'The Engineer and Society', description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to professional engineering practice.' },
            { code: 'GA7', name: 'Environment and Sustainability', description: 'Understand and evaluate the sustainability and impact of professional engineering work in the solution of complex engineering problems in societal and environmental contexts.' },
            { code: 'GA8', name: 'Ethics', description: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of engineering practice.' },
            { code: 'GA9', name: 'Individual and Team Work', description: 'Function effectively as an individual, and as a member or leader in diverse teams and in multi-disciplinary settings.' },
            { code: 'GA10', name: 'Communication', description: 'Communicate effectively on complex engineering activities with the engineering community and with society at large.' },
            { code: 'GA11', name: 'Project Management and Finance', description: 'Demonstrate knowledge and understanding of engineering management principles and apply these to manage projects.' },
            { code: 'GA12', name: 'Lifelong Learning', description: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' },
        ];

        const gas = await GA.insertMany(gasData.map(g => ({ ...g, program: bsitProgram._id, status: 'Active' })));
        console.log(`Created ${gas.length} Graduate Attributes.`);

        // ─── 2. PEOs ────────────────────────────────────────────────────────────
        const peosData = [
            { code: 'PEO1', title: 'Technical Excellence', description: 'Graduates will demonstrate technical proficiency and apply computing/IT knowledge to solve real-world problems in their professional careers.' },
            { code: 'PEO2', title: 'Lifelong Learning & Adaptability', description: 'Graduates will engage in continuous professional development and adapt to the rapidly evolving landscape of information technology.' },
            { code: 'PEO3', title: 'Professional & Ethical Practice', description: 'Graduates will exhibit professional behavior, adhere to ethical standards, and demonstrate responsibility in their work and to society.' },
            { code: 'PEO4', title: 'Leadership & Communication', description: 'Graduates will demonstrate leadership skills, work effectively in teams, and communicate technical information clearly to diverse audiences.' },
        ];
        const peos = await PEO.insertMany(peosData.map(p => ({ ...p, program: bsitProgram._id, status: 'Active' })));
        console.log(`Created ${peos.length} PEOs.`);

        // ─── 3. PLOs ────────────────────────────────────────────────────────────
        const gasMap = Object.fromEntries(gas.map(g => [g.code, g._id]));
        const peosMap = Object.fromEntries(peos.map(p => [p.code, p._id]));

        const ploData = [
            { code: 'PLO1', statement: 'Apply knowledge of computing and information technology fundamentals to solve technical problems.', gas: [gasMap['GA1'], gasMap['GA2']], peos: [peosMap['PEO1']] },
            { code: 'PLO2', statement: 'Design and develop IT solutions for complex problems using appropriate technologies.', gas: [gasMap['GA3'], gasMap['GA5']], peos: [peosMap['PEO1']] },
            { code: 'PLO3', statement: 'Conduct investigation and analysis of IT-related problems using research-based methods.', gas: [gasMap['GA4']], peos: [peosMap['PEO1'], peosMap['PEO2']] },
            { code: 'PLO4', statement: 'Use modern IT tools, software, and technologies effectively.', gas: [gasMap['GA5']], peos: [peosMap['PEO1']] },
            { code: 'PLO5', statement: 'Assess the impact of IT solutions on society, environment, and sustainability.', gas: [gasMap['GA6'], gasMap['GA7']], peos: [peosMap['PEO3']] },
            { code: 'PLO6', statement: 'Apply professional ethics and legal standards in IT practice.', gas: [gasMap['GA8']], peos: [peosMap['PEO3']] },
            { code: 'PLO7', statement: 'Function effectively as an individual and team member in IT projects.', gas: [gasMap['GA9']], peos: [peosMap['PEO4']] },
            { code: 'PLO8', statement: 'Communicate technical information effectively in written and verbal form.', gas: [gasMap['GA10']], peos: [peosMap['PEO4']] },
            { code: 'PLO9', statement: 'Apply project management principles in planning and executing IT projects.', gas: [gasMap['GA11']], peos: [peosMap['PEO4']] },
            { code: 'PLO10', statement: 'Engage in lifelong learning and adapt to emerging technologies.', gas: [gasMap['GA12']], peos: [peosMap['PEO2']] },
            { code: 'PLO11', statement: 'Apply database design and management skills for data-intensive applications.', gas: [gasMap['GA1'], gasMap['GA3']], peos: [peosMap['PEO1']] },
            { code: 'PLO12', statement: 'Develop, deploy and secure networked systems and applications.', gas: [gasMap['GA3'], gasMap['GA5']], peos: [peosMap['PEO1'], peosMap['PEO3']] },
        ];

        const plos = await PLO.insertMany(ploData.map(p => ({
            ...p,
            program: bsitProgram._id,
            domain: 'Cognitive',
            bloomsLevel: 'Apply',
            status: 'Active'
        })));
        console.log(`Created ${plos.length} PLOs.`);

        // ─── 4. CLOs ────────────────────────────────────────────────────────────
        const plosByCode = Object.fromEntries(plos.map(p => [p.code, p._id]));

        // IT101 - Introduction to ICT: 3 CLOs
        const clos101 = await CLO.insertMany([
            {
                code: 'CLO-1', description: 'Explain fundamental concepts of information and communication technology and their applications.',
                course: it101._id, bloomsLevel: 'Understand', bloomsDomain: 'Cognitive', weightage: 33,
                plos: [{ plo: plosByCode['PLO1'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA1'], weightage: 100, level: 'Low' }], status: 'Active'
            },
            {
                code: 'CLO-2', description: 'Identify and use appropriate ICT tools for personal productivity and problem solving.',
                course: it101._id, bloomsLevel: 'Apply', bloomsDomain: 'Cognitive', weightage: 33,
                plos: [{ plo: plosByCode['PLO4'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA5'], weightage: 100, level: 'Medium' }], status: 'Active'
            },
            {
                code: 'CLO-3', description: 'Analyze the societal and ethical implications of information technology.',
                course: it101._id, bloomsLevel: 'Analyze', bloomsDomain: 'Cognitive', weightage: 34,
                plos: [{ plo: plosByCode['PLO6'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA8'], weightage: 100, level: 'Low' }], status: 'Active'
            }
        ]);

        // IT102 - Programming Fundamentals: 4 CLOs
        const clos102 = await CLO.insertMany([
            {
                code: 'CLO-1', description: 'Understand and apply basic programming concepts including variables, data types, and control structures.',
                course: it102._id, bloomsLevel: 'Apply', bloomsDomain: 'Cognitive', weightage: 25,
                plos: [{ plo: plosByCode['PLO1'], weightage: 100, level: 'High' }],
                gas: [{ ga: gasMap['GA1'], weightage: 100, level: 'Medium' }], status: 'Active'
            },
            {
                code: 'CLO-2', description: 'Design algorithms and implement solutions to simple computational problems.',
                course: it102._id, bloomsLevel: 'Create', bloomsDomain: 'Cognitive', weightage: 25,
                plos: [{ plo: plosByCode['PLO2'], weightage: 100, level: 'High' }],
                gas: [{ ga: gasMap['GA3'], weightage: 100, level: 'Medium' }], status: 'Active'
            },
            {
                code: 'CLO-3', description: 'Debug and test programs using systematic problem-solving techniques.',
                course: it102._id, bloomsLevel: 'Analyze', bloomsDomain: 'Cognitive', weightage: 25,
                plos: [{ plo: plosByCode['PLO3'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA4'], weightage: 100, level: 'Medium' }], status: 'Active'
            },
            {
                code: 'CLO-4', description: 'Demonstrate use of modern programming tools and development environments.',
                course: it102._id, bloomsLevel: 'Apply', bloomsDomain: 'Cognitive', weightage: 25,
                plos: [{ plo: plosByCode['PLO4'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA5'], weightage: 100, level: 'High' }], status: 'Active'
            }
        ]);

        // IT103 - Discrete Structures: 3 CLOs
        const clos103 = await CLO.insertMany([
            {
                code: 'CLO-1', description: 'Apply mathematical logic, sets, and relations to solve discrete mathematical problems.',
                course: it103._id, bloomsLevel: 'Apply', bloomsDomain: 'Cognitive', weightage: 34,
                plos: [{ plo: plosByCode['PLO1'], weightage: 100, level: 'High' }],
                gas: [{ ga: gasMap['GA1'], weightage: 100, level: 'High' }], status: 'Active'
            },
            {
                code: 'CLO-2', description: 'Analyze graphs, trees, and combinatorics to model computing problems.',
                course: it103._id, bloomsLevel: 'Analyze', bloomsDomain: 'Cognitive', weightage: 33,
                plos: [{ plo: plosByCode['PLO2'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA2'], weightage: 100, level: 'Medium' }], status: 'Active'
            },
            {
                code: 'CLO-3', description: 'Construct formal proofs and apply proof techniques in computing contexts.',
                course: it103._id, bloomsLevel: 'Create', bloomsDomain: 'Cognitive', weightage: 33,
                plos: [{ plo: plosByCode['PLO3'], weightage: 100, level: 'Medium' }],
                gas: [{ ga: gasMap['GA4'], weightage: 100, level: 'Medium' }], status: 'Active'
            }
        ]);

        console.log(`Created CLOs: ${clos101.length} for IT101, ${clos102.length} for IT102, ${clos103.length} for IT103`);
        console.log('✅ OBE structure seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('OBE seeding failed:', error);
        process.exit(1);
    }
};

seedOBE();
