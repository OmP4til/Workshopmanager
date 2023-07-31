const thread = require('../../db/db');


async function validateTimeSlot(machineID, startTime, endTime) {
    //**  If the start_time or end_time or both fall between an already existing time slot, the query returns the count as 1
    const validateTimeSlotQuery = `
        SELECT COUNT(*) FROM machine_allotment WHERE (machine_id = $3) AND (($1 BETWEEN start_time AND end_time) OR ($2 BETWEEN start_time AND end_time) OR ($1 < start_time AND $2 > end_time)); 
    `

    const validateSlotsValues = [
        startTime,
        endTime,
        machineID
    ];

    const validateSlotResults = await thread.query(validateTimeSlotQuery, validateSlotsValues);

    console.log(validateSlotResults);

    const { count } = validateSlotResults.rows[0];
    if (count > 0) {
        //** Error if time slot falls between the two values
        return false;
    }


    return true;
}


async function validateSlotForMachine(machineID, currentTime) {
    const validateTimeSlotQuery = `
        SELECT COUNT(*) FROM machine_allotment WHERE machine_id = $1 AND ($2 BETWEEN start_time AND end_time); 
    `
    const values = [
        machineID,
        currentTime
    ]

    const validateResults = await thread.query(validateTimeSlotQuery, values);

    // console.log(validateResults);
    const { count } = validateResults.rows[0];

    if (count > 0) {
        return false;
    }    


    return true;

}


module.exports = {
    validateTimeSlot,
    validateSlotForMachine
}