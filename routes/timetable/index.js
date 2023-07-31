const { Router } = require('express');
const thread = require('../../db/db');
const router = Router();


//** Note: Have to manually insert all practicals into the application table


// Get all the DISTINCT practical names on a particular day
router.get('/', async (req, res) => {
    const {
        day
    } = req.query;

    // Get application subject as well
    const getPracticalNameDayWiseQuery = `
        SELECT DISTINCT day_wise_static.application_id, application.subject 
        FROM day_wise_static
        INNER JOIN application ON day_wise_static.application_id = application.application_id
        WHERE day_wise_static.day = $1
    `;

    // const insertIntoApplicationQuery = `
    //     INSERT INTO application 
    //     VALUES($1, $2, $3, $4, $5)
    // `


    try {
        const dayWisePracticals = await thread.query(getPracticalNameDayWiseQuery, [day]);
        res.status(200).json({
            "message": "success",
            "result": dayWisePracticals.rows
        })

    } catch (e) {
        res.status(400).json({
            "message": "Could not fetch results",
            "error": e
        })
    }


});



router.post('/schedule', async (req, res) => {
    const {
        applicationID,
        day
    } = req.body;


    const getApplicationDayWiseQuery = `
        SELECT machine_id, start_time, end_time, application_id, incharge_email
        FROM day_wise_static
        WHERE application_id = $1 AND day = $2;
    `;

    const allotMachineQuery = `
        INSERT INTO machine_allotment 
        VALUES($1, $2, $3, $4, $5)
    `




    try {
        const dayWiseApplications = await thread.query(getApplicationDayWiseQuery, [applicationID, day]);

        const {
            rows
        } = dayWiseApplications;

        // console.log(dayWiseApplications)
        let errorMessage = null;
        // Sequentially allot all machines for that practical
        await Promise.all(
            rows.map(async (row, idx) => {
                
                // Only time is stored in the static table, date is today's date
                const startTime = new Date() 
                startTime.setHours(parseInt(row.start_time.substr(0, 2)), parseInt(row.start_time.substr(3, 5)), parseInt(row.start_time.substr(6, 8)));

                const endTime = new Date()
                endTime.setHours(parseInt(row.end_time.substr(0, 2)), parseInt(row.end_time.substr(3, 5)), parseInt(row.end_time.substr(6, 8)))

                const machineAllotmentValues = Object.values({...row, "start_time": startTime.toLocaleString(), "end_time": endTime.toLocaleString()});
                try {
                    await thread.query(allotMachineQuery, machineAllotmentValues);
                    console.log(`Alloted machine ${row.machine_id}`);
                } catch (e) {
                    errorMessage = `Could not allot machine ${row.machine_id}`;
                    switch (e.code) {
                        case "23505": // Primary key violation
                            errorMessage = `Machine ${row.machine_id} is already alloted for that time slot.`
                    }

                }
            })
        )

        if (errorMessage) {
            return res.status(400).json({
                "message": errorMessage
            })
        }

        console.log(`Reached heree`);
        res.status(200).json({
            "message": `Alloted machines for ${applicationID}`
        });

    } catch (e) {

        res.status(400).json({
            "message": "Could not allot machines.",
            "error": e
        })

    }





});






module.exports = router;
