const thread = require('../../../db/db');

async function getSectionReportData(sectionID, start_date, end_date) {

    // Get machine details within a time range
    const getSectionDetailsQuery = `
        SELECT * 
        FROM section
        WHERE section_id = '${sectionID}';
    `;

    // Get all the machine allocations section wise
    const getMachineFromSectionQuery = `
        SELECT machine.machine_name,machine_allotment.start_time, machine_allotment.end_time, machine_allotment.application_id, machine_allotment.incharge_email, machine.hourly_rate
        FROM machine_allotment
        INNER JOIN machine ON machine.machine_id = machine_allotment.machine_id
        WHERE (machine.section_id = $1 AND machine_allotment.start_time >= $2 AND machine_allotment.end_time <= $3);
    `


    let result = {};
    let time_used = money_spent = null;

    try {
        const sectionDetails = await thread.query(getSectionDetailsQuery);

        result = sectionDetails.rowCount ? sectionDetails.rows[0] : {};

        // Supply only date to the query string
        const values = [sectionID, new Date(start_date), new Date(end_date)];

        const sectionWiseMachineData = await thread.query(getMachineFromSectionQuery, values);

        result = { ...result, "allocationData": sectionWiseMachineData?.rows }
        console.log(sectionWiseMachineData);
        // console.log(new Date(start_date), new Date(end_date))
        if (sectionWiseMachineData.rowCount) {
            time_used = sectionWiseMachineData.rows.reduce((currentTimeUsed, currentInterval) => {
                console.log(currentTimeUsed)
                return currentTimeUsed + (currentInterval.end_time - currentInterval.start_time);
            }, 0);


            money_spent = sectionWiseMachineData.rows.reduce((spendTillNow, currentAllocation) => {
                return spendTillNow + (currentAllocation.hourly_rate);
            }, 0);

            //** milliseconds -> seconds -> minutes -> hours
            time_used = (time_used / 1000) / 60 / 60;
        }

    } catch (e) {
        console.table(e)
        return false;
    }




    return { ...result, time_used, money_spent };
}


module.exports = {
    getSectionReportData
}