import 'dotenv/config';
import mongoose from 'mongoose';

const resetDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for reset.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        
        for (const collInfo of collections) {
            const collectionName = collInfo.name;
            const collection = mongoose.connection.db.collection(collectionName);
            if (collectionName === 'users') {
                const result = await collection.deleteMany({
                    role: { $nin: ['UniversityAdmin', 'SuperAdmin'] }
                });
                console.log(`Cleared ${result.deletedCount} users (kept Admins).`);
            } else if (collectionName === 'systemsettings' || collectionName === 'roles') {
                console.log(`Skipping ${collectionName}.`);
            } else {
                const result = await collection.deleteMany({});
                console.log(`Cleared ${result.deletedCount} from ${collectionName}.`);
            }
        }
        
        console.log('Database reset complete.');
        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
};

resetDatabase();
