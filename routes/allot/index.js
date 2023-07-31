const { Router } = require('express');
const thread = require('../../db/db');
const { validateTimeSlot } = require('./allotUtils');
const router = Router();

// ** Supply only date or times, not both
// TODO: Change route name
router.get("/status", async (req, res) => {

    const { startTime, endTime, date, machineID } = req.query;

    console.table(req.query);

    let query = `SELECT * FROM machine_allotment`

    // If date is given fetch ordered by start_time
    if (date) {
        query = `SELECT * FROM machine_allotment WHERE machine_id = '${machineID}' AND DATE(start_time) = '${new Date(date).toDateString()}' ORDER BY start_time;`;
    }

    console.log("----------------------------------");
    console.log(date);


    // if both, fetch the exact interval
    if (startTime && endTime) {
        query = `SELECT * FROM machine_allotment WHERE machine_id = '${machineID}' AND start_time >= '${startTime}' AND end_time <= '${endTime}' ORDER BY start_time`;
    } else if (startTime) {
        // if only start time, get the interval according to start time
        query = `SELECT * FROM machine_allotment WHERE machine_id = '${machineID}' AND DATE(start_time) = '${new Date(startTime).getDate()}' ORDER BY start_time`;
    }
    const result = await thread.query(query);   


    res.status(200).json({
        message: "Allotment route working.",
        result: result.rows
    });

})


router.post('/machine', async (req, res) => {

    let {
        machineID,
        startTime,
        endTime,
        applicationID,
    } = req.body;

    // Takes the inchargeEmail from the session data
    let inchargeEmail = req.session.userSession.incharge_email_id;


    let query = `
        INSERT INTO machine_allotment VALUES(
            $1, $2, $3, $4, $5
        );
    `

    const machineAllotmentValues = [
        machineID,
        startTime,
        endTime,
        applicationID,
        inchargeEmail,
    ]

    

    try {
        
        const isTimeSlotAvailable = await validateTimeSlot(machineID,startTime, endTime);
        if (!isTimeSlotAvailable) {
            return res.status(400).json({
                error: "Time slot is already booked"
            })
        }

        const insertResults = await thread.query(query, machineAllotmentValues);

        res.status(200).json({
            message: `Machine alloted successfully`
        })

    } catch(e) {
        console.log(e);
        res.status(400).json({
            error: "Could not allot machine"
        })
    }


});




router.get('/timeline-appid', async (req, res) => {
    const {
        appID
    } = req.query;

    let query = `
        SELECT * FROM machine_allotment WHERE application_id = $1
    `

    try {
        const result = await thread.query(query, [appID]);

        res.status(200).json({
            result: result.rows
        });

    } catch (e) {
        res.status(400).json({
            error: "Please enter a valid application ID"
        })
    }



})




router.delete('/delete', async (req, res) => {

    const {
        machineID,
        startTime,
        endTime
    } = req.body;

    console.log(machineID, startTime, endTime);


    const deleteAllotmentQuery = `
        DELETE FROM machine_allotment
        WHERE machine_id = $1 AND start_time = $2 AND end_time = $3
    `;

    try {
        const deleteResults = await thread.query(deleteAllotmentQuery, [
            machineID,
            startTime,
            endTime
        ]);
        
        let message = `Successfully deleted allotment for machine: '${machineID}' from ${startTime} to ${endTime}`;

        if (!deleteResults.rowCount) {
            message = `No entry found for the given data.`;
        }

        console.log("reached here");


        res.status(200).json({
            "message": message,
        });

    } catch(e) {
        res.status(400).json({
            "message": e
        })
    } 


})



module.exports = router;

