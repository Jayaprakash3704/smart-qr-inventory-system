import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/backup.log' })
  ]
});

const DB_PATH = path.resolve('inventory.db');
const BACKUP_DIR = path.resolve('backups');
const RETENTION_DAYS = 7;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const runBackup = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      logger.warn('No database found to backup.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `inventory_${timestamp}.db`);

    // Copy the sqlite file
    fs.copyFileSync(DB_PATH, backupFile);
    logger.info(`Database backup successful: ${backupFile}`);

    // Cleanup old backups
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);

      if (ageDays > RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old backup(s).`);
    }

  } catch (error) {
    logger.error('Database backup failed:', error);
  }
};

// Run backup every day at 2:00 AM
export const scheduleBackups = () => {
  cron.schedule('0 2 * * *', () => {
    logger.info('Starting scheduled daily backup...');
    runBackup();
  });
  logger.info('Backup cron job scheduled for 2:00 AM daily.');
};
