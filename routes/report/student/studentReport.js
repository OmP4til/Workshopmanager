const thread = require('../../../db/db');

async function getStudentReportData(studentEmail, start_date, end_date) {

    const studentDetailsQuery = `
        SELECT * FROM student
        WHERE email_id = '${studentEmail}'
    `

    // Get relevant data from all the 3 tables joined together
    const studentAllotmentDetailsQuery = `
        SELECT machine_allotment.machine_id, machine_allotment.start_time, machine_allotment.end_time, application.application_id, machine_allotment.incharge_email, machine.machine_name, machine.hourly_rate
        FROM machine_allotment
        INNER JOIN application ON application.application_id = machine_allotment.application_id
        INNER JOIN machine ON machine.machine_id = machine_allotment.machine_id
        WHERE (application.student_email = $1 AND machine_allotment.start_time >= $2 AND machine_allotment.end_time <= $3);
    `


    let result = {};
    let timeUsed = 0, moneySpent = 0;
    try {

        const studentDetails = await thread.query(studentDetailsQuery);

        if (studentDetails.rowCount) {
            result = {...studentDetails.rows[0]};
        }

        const studentAllotmentDetails = await thread.query(studentAllotmentDetailsQuery, [studentEmail, new Date(start_date), new Date(end_date)]);
        if (studentAllotmentDetails.rowCount) {

            let allocationData = [];
            
            
            for (let allotmentRecord of studentAllotmentDetails.rows) {
                allocationData = [...allocationData, {
                    "machine_name": allotmentRecord.machine_name,
                    "start_time": allotmentRecord.start_time,
                    "end_time": allotmentRecord.end_time,
                    "application_id": allotmentRecord.application_id,
                    "incharge_email": allotmentRecord.incharge_email,
                    "hourly_rate": allotmentRecord.hourly_rate
                }];

                currentAllotmentTime = (allotmentRecord.end_time - allotmentRecord.start_time) / 3.6e6;

                //** Convert milliseconds to hours
                timeUsed += currentAllotmentTime;
                moneySpent += (currentAllotmentTime * allotmentRecord.hourly_rate);
            }

            result = {...result, allocationData, time_used: timeUsed, money_spent: moneySpent};
        
        }

    } catch (e) {
        console.error(e);
        return false;
    }




    return { ...result };
}


module.exports = {
    getStudentReportData
}