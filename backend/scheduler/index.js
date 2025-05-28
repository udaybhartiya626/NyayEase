const cron = require('node-cron');
const { updateHearingAndCaseStatus } = require('../utils/hearingStatusUpdater');

// Schedule the job to run every minute
const startScheduler = () => {
  // Run immediately on startup
  updateHearingAndCaseStatus().catch(console.error);
  
  // Then run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running scheduled hearing status update...');
      await updateHearingAndCaseStatus();
    } catch (error) {
      console.error('Error in scheduled hearing status update:', error);
    }
  });
  
  console.log('Hearing status scheduler started');
};

module.exports = { startScheduler };
