// utils/logger.js
import Log from '../models/Log.js';

export const createLog = async (logData) => {
  try {
    await Log.create(logData);
  } catch (err) {
    console.error("Failed to write log to DB:", err);
  }
};

export default createLog;