const Hearing = require('../models/Hearing');
const Notification = require('../models/Notification');
const Case = require('../models/Case');
const CaseRequest = require('../models/CaseRequest');

// Store notified hearings to prevent duplicate notifications
const notifiedHearings = new Map(); // Using Map to store timestamps for cleanup
const NOTIFICATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const getCurrentISTDate = () => {
  // Convert current time to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset);
};

const updateHearingStatuses = async () => {
  try {
    const now = getCurrentISTDate();
    
    // Update hearings that should be in-progress and set case to active
    const hearingsToStart = await Hearing.find({
      status: { $in: ['scheduled', 'waiting-decision'] },
      date: { $lte: now },
      $expr: { $gt: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, now] }
    }).populate({
      path: 'case',
      select: 'status title'
    });

    for (const hearing of hearingsToStart) {
      try {
        // Update hearing status to in-progress
        hearing.status = 'in-progress';
        await hearing.save();
        
        // Update case status to in-progress if not already in a terminal state
        if (hearing.case && !['closed', 'resolved', 'rejected'].includes(hearing.case.status)) {
          // We need to fetch the case directly to ensure we have the latest version
          const caseToUpdate = await Case.findById(hearing.case._id);
          if (caseToUpdate && !['closed', 'resolved', 'rejected'].includes(caseToUpdate.status)) {
            caseToUpdate.status = 'in-progress';
            await caseToUpdate.save();
            console.log(`Updated case ${caseToUpdate._id} status to in-progress`);
          }
        }
      } catch (error) {
        console.error(`Error updating hearing ${hearing._id} or its case:`, error);
      }
    }
    
    // Update hearings that should be waiting for decision
    const hearingsToUpdate = await Hearing.find({
      status: 'in-progress',
      $expr: { $lte: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, now] }
    });
    
    for (const hearing of hearingsToUpdate) {
      hearing.status = 'waiting-decision';
      await hearing.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error updating hearing statuses:', error);
    return false;
  }
};

const checkUpcomingHearings = async () => {
  try {
    const now = getCurrentISTDate();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // First update all hearing statuses
    await updateHearingStatuses();

    // Clean up old notifications from memory
    const currentTime = Date.now();
    for (const [hearingId, timestamp] of notifiedHearings.entries()) {
      if (currentTime - timestamp > NOTIFICATION_WINDOW_MS) {
        notifiedHearings.delete(hearingId);
      }
    }

    // Find hearings that started in the last 5 minutes or will start in the next 5 minutes
    const upcomingHearings = await Hearing.find({
      $and: [
        { status: 'scheduled' },
        {
          $or: [
            {
              // Upcoming hearings in next 5 minutes
              date: { $gte: now, $lte: fiveMinutesFromNow }
            },
            {
              // Or hearings that just started (in the last 5 minutes)
              date: { $gte: tenMinutesAgo, $lt: now }
            }
          ]
        }
      ]
    }).populate('case');

    console.log(`Found ${upcomingHearings.length} hearings to process`);

    for (const hearing of upcomingHearings) {
      try {
        const hearingId = hearing._id.toString();
        const hearingTime = new Date(hearing.date);
        const timeUntilHearing = hearingTime - now;
        
        // Skip if we've already notified for this hearing in the current window
        if (notifiedHearings.has(hearingId) && 
            currentTime - notifiedHearings.get(hearingId) < NOTIFICATION_WINDOW_MS) {
          console.log(`Skipping already notified hearing ${hearingId}`);
          continue;
        }

        // Get the case with populated litigant and advocates
        const caseDoc = await Case.findById(hearing.case._id)
          .populate('litigant', 'name email')
          .populate('advocates', 'name email');

        if (!caseDoc) {
          console.log(`Case not found for hearing ${hearingId}`);
          continue;
        }

        // Determine if hearing is upcoming or just started
        const isUpcoming = timeUntilHearing > 0;
        const timePhrase = isUpcoming 
          ? `is about to start in ${Math.ceil(timeUntilHearing / (60 * 1000))} minutes`
          : 'has just started';

        // If hearing is starting now, update case status to 'active'
        if (!isUpcoming) {
          try {
            // Update the case status to 'active'
            await Case.findByIdAndUpdate(caseDoc._id, { status: 'active' });
            
            // Also update any related case requests
            await CaseRequest.updateMany(
              { case: caseDoc._id },
              { status: 'active' }
            );
            
            console.log(`Updated case ${caseDoc._id} status to 'active' as hearing has started`);
          } catch (error) {
            console.error(`Error updating case status for hearing ${hearing._id}:`, error);
          }
        }

        // Create notification for litigant
        await Notification.create({
          title: isUpcoming ? 'Upcoming Hearing' : 'Hearing Started',
          message: `Your hearing for case "${caseDoc.title}" ${timePhrase}`,
          recipient: caseDoc.litigant._id,
          type: 'hearing-reminder',
          relatedCase: caseDoc._id,
          relatedHearing: hearing._id,
          isActionRequired: isUpcoming
        });

        // Create notifications for advocates
        const advocatePromises = caseDoc.advocates.map(advocate => 
          Notification.create({
            title: isUpcoming ? 'Upcoming Hearing' : 'Hearing Started',
            message: `Hearing for case "${caseDoc.title}" ${timePhrase}`,
            recipient: advocate._id,
            type: 'hearing-reminder',
            relatedCase: caseDoc._id,
            relatedHearing: hearing._id,
            isActionRequired: isUpcoming
          })
        );

        await Promise.all(advocatePromises);
        
        // Mark this hearing as notified with current timestamp
        notifiedHearings.set(hearingId, currentTime);
        
        console.log(`Sent notifications for hearing ${hearingId} (${timePhrase})`);
      } catch (error) {
        console.error(`Error processing hearing ${hearing._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in hearing notifier:', error);
  }
};

// Run the check every minute
const startHearingNotifier = () => {
  // Check and update statuses every 30 seconds
  setInterval(updateHearingStatuses, 30 * 1000);
  
  // Check for notifications every 5 minutes
  setInterval(checkUpcomingHearings, 5 * 60 * 1000);
  
  console.log('Hearing notifier started');
  const interval = setInterval(() => {
    checkUpcomingHearings().catch(console.error);
  }, 30 * 1000);
  
  console.log('Hearing notifier started successfully');
  
  // Return cleanup function
  return () => clearInterval(interval);
};

module.exports = startHearingNotifier;
