const thread = require('../../../db/db');

async function getMachineReportData(machineID, start_date, end_date) {

    // Get machine details within a time range
    const machineDetailsQuery = `
        SELECT machine.machine_name,machine_allotment.start_time, machine_allotment.end_time, machine_allotment.application_id, machine_allotment.incharge_email
        FROM machine_allotment
        INNER JOIN machine ON machine.machine_id = machine_allotment.machine_id
        WHERE (machine.machine_id = $1 AND machine_allotment.start_time >= $2 AND machine_allotment.end_time <= $3);
    `

    const getMachineDetailsQuery = `
        SELECT * 
        FROM machine
        WHERE machine_id = '${machineID}'
    `

    let result = {};
    let time_used = money_spent = null;

    try {
        const machineDetails = await thread.query(getMachineDetailsQuery);

        result = machineDetails.rowCount ? machineDetails.rows[0] : {};


        const values = [machineID, new Date(start_date).toDateString(), new Date(end_date).toDateString()];

        const machineData = await thread.query(machineDetailsQuery, values);
        // const machineData = await thread.query(machineDetailsQuery);

        // console.log(values)
        result = {...result, "allocationData": machineData?.rows}
        console.log(machineData);
        // console.log(new Date(start_date), new Date(end_date))
        if (machineData.rowCount) {
            time_used = machineData.rows.reduce((currentTimeUsed, currentInterval) => {
                console.log(currentTimeUsed)
                return currentTimeUsed + (currentInterval.end_time - currentInterval.start_time);
            }, 0);

            //** milliseconds -> seconds -> minutes -> hours
            time_used = (time_used / 1000) / 60 / 60;
            money_spent = time_used * result?.hourly_rate;
        }


    } catch(e) {
        return false;
    }
    



    return {...result, time_used, money_spent};
}


module.exports = {
    getMachineReportData
}