const Hearing = require('../models/Hearing');
const Case = require('../models/Case');

/**
 * Updates hearing and case statuses based on hearing state changes
 */
const updateHearingAndCaseStatus = async () => {
  try {
    const now = new Date();
    
    // 1. Check for cancelled hearings and close their cases
    const cancelledHearings = await Hearing.find({
      status: 'cancelled',
      'case': { $exists: true, $ne: null }
    }).populate('case', 'status');

    for (const hearing of cancelledHearings) {
      try {
        // Only update if the case is not already in a terminal state
        if (!['resolved', 'closed', 'rejected'].includes(hearing.case?.status)) {
          await Case.findByIdAndUpdate(
            hearing.case._id,
            { 
              $set: { 
                status: 'closed',
                updatedAt: now,
                closeReason: 'Hearing was cancelled',
                closedAt: now
              } 
            }
          );
          console.log(`Closed case ${hearing.case._id} because hearing ${hearing._id} was cancelled`);
        }
      } catch (error) {
        console.error(`Error updating case status for cancelled hearing ${hearing._id}:`, error);
      }
    }

    // 2. Check for completed hearings and resolve their cases
    const completedHearings = await Hearing.find({
      status: 'completed',
      'case': { $exists: true, $ne: null }
    }).populate('case', 'status');

    for (const hearing of completedHearings) {
      try {
        // Only update if the case is not already in a terminal state
        if (!['resolved', 'closed', 'rejected'].includes(hearing.case?.status)) {
          await Case.findByIdAndUpdate(
            hearing.case._id,
            { 
              $set: { 
                status: 'resolved',
                updatedAt: now,
                resolvedAt: now,
                resolution: 'Case resolved after hearing completion'
              } 
            }
          );
          console.log(`Resolved case ${hearing.case._id} because hearing ${hearing._id} was completed`);
        }
      } catch (error) {
        console.error(`Error updating case status for completed hearing ${hearing._id}:`, error);
      }
    }

    // 3. Check for scheduled hearings that should be in progress
    const hearingsToUpdate = await Hearing.find({
      status: 'scheduled',
      date: { $lte: now },
      $or: [
        { endTime: { $exists: false } },
        { endTime: { $gte: now } }
      ]
    }).populate('case', 'status');

    for (const hearing of hearingsToUpdate) {
      try {
        // Update hearing status to in-progress
        hearing.status = 'in-progress';
        await hearing.save();

        // Update associated case status to in-progress if it's not already in a terminal state
        if (!['resolved', 'closed', 'rejected'].includes(hearing.case?.status)) {
          await Case.findByIdAndUpdate(
            hearing.case._id,
            { 
              $set: { 
                status: 'in-progress',
                updatedAt: now 
              } 
            }
          );
          console.log(`Updated case ${hearing.case._id} to in-progress`);
        }

        console.log(`Updated hearing ${hearing._id} to in-progress`);
      } catch (error) {
        console.error(`Error updating hearing ${hearing._id}:`, error);
      }
    }

    // 4. Check for in-progress hearings that have passed their end time
    const pastHearings = await Hearing.find({
      status: 'in-progress',
      endTime: { $lt: now }
    }).populate('case', 'status');

    for (const hearing of pastHearings) {
      try {
        // Only update if the case is not already in a terminal state
        if (!['resolved', 'closed', 'rejected'].includes(hearing.case?.status)) {
          await Case.findByIdAndUpdate(
            hearing.case._id,
            { 
              $set: { 
                status: 'scheduled-hearing',
                updatedAt: now 
              } 
            }
          );
          console.log(`Updated case ${hearing.case._id} to scheduled-hearing after hearing ${hearing._id} ended`);
        }
      } catch (error) {
        console.error(`Error updating case status for past hearing ${hearing._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in updateHearingAndCaseStatus:', error);
  }
};

module.exports = { updateHearingAndCaseStatus };
