const { Router } = require('express');
const thread = require('../../db/db');
const { validateSlotForMachine } = require('../allot/allotUtils');
const router = Router();

//** Need to supply machineID always
router.get('/', async (req, res) => {

    const {
        machineID
    } = req.query;


    // Query to check if the machine is CURRENTLY busy or free
    const machineStatusQuery = `
        SELECT COUNT(1) 
        FROM machine_allotment 
        WHERE machine_id = $1
        AND ($2 BETWEEN start_time AND end_time)
    `

    let query = `
        SELECT * FROM machine WHERE machine_id = '${machineID}';
    `;

    const result = await thread.query(query);
    const machineTimeStatus = await thread.query(machineStatusQuery, [machineID, new Date(Date.now())]);
    let machineStatus = "free";
    
    // If query returns a valid machine_allotment in the current time frame, the machine is busy
    if (machineTimeStatus.rowCount) {
        machineStatus = parseInt(machineTimeStatus.rows[0].count) > 0 ? "busy" : "free"
    }

    const resultWithStatus = {
        ...result.rows[0],
        status: machineStatus
    }


    res.status(200).json({
        result: resultWithStatus,
    
    });
})


router.get('/all', async (req, res) => {

    // section name, incharge name, machine details
    let query = `
        SELECT * 
        FROM section
        INNER JOIN machine 
            ON machine.section_id = section.section_id
        INNER JOIN incharge
            ON incharge.email_id = section.section_incharge_id
    `

    try {
        const allMachines = await thread.query(query);

        const results = {}

        // Add section details to the results
        allMachines.rows.forEach(row => {
            const section = {
                "id": row.section_id,
                "name": row.section_name,
                "incharge": row.incharge_name,
                "machines": []
            }

            results[row.section_id] = section;
        })

        await Promise.all(
            allMachines.rows.map(async (row) => {
                const section = row.section_id;
                const currentTime = new Date(Date.now());
                const freeMachine = await validateSlotForMachine(row.machine_id, currentTime);

                results[section].machines.push({
                    "id": row.machine_id,
                    "name": row.machine_name,
                    "status": freeMachine ? "free" : 'busy'
                })
            })
            
        )

        const machinesGroupedBySections = Object.values(results).map(row => row)

        res.status(200).json({
            message: "Got all machines",
            shops: machinesGroupedBySections
        })

    } catch(e) {
        console.log(e);
        res.status(400).json({
            error: "There was a problem"
        })
    }


})


router.post('/set-status', async (req, res) => {
    const {status, machineID} = req.query;


    if (!machineID) {
        return res.status(400).json({
            "message": "Please supply a machineID"
        })
    }

    const query = `
        UPDATE machine 
        SET machine_status = $2
        WHERE machine_id = $1
    `
    const values = [
        machineID, status
    ]

    try {
        const updateResults = await thread.query(query, values);
        if (!updateResults.rowCount) {
            return res.status(400).json({
                "message": "Please enter a valid machine ID"
            })
        }
        console.log(updateResults);
        res.status(200).json({
            "message": `Machine status for ${machineID} updated successfully`
        });

    } catch (e) {
        let errorMessage = "Could not allot the machine.";
        switch (e.code) {
            case "23514":
                errorMessage =  "Please enter a valid machine status. (vacant, booked, maintenance)"
                break;
            default:
                break;
        }

        res.status(400).json({
            "message": errorMessage
        })
    }
})

router.post('/add', async (req, res) => {
    const {
        machineID: id,
        machineName: name,
        hourlyRate: rate,
        sectionID
    } = req.body;

    const query = `
        INSERT INTO machine VALUES($1, $2, $3, $4)
    `
    const values = [
        id,
        name,
        rate,
        sectionID
    ]

    try {
        const insertResults = await thread.query(query, values);

        res.status(200).json({
            "message": "Machine added successfully.",
            error: null
        })

    } catch (e) {
        console.error(e);
        res.status(400).json({
            "message": "Could not add machine."
        })
    }
})




module.exports = router;