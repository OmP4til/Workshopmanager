const { Router } = require('express');
// const thread = require('../../../db/db');
const { getMachineReportData } = require('./machine/machineReport');
const { getSectionReportData } = require('./section/sectionReport');
const { getStudentReportData } = require('./student/studentReport');
const { getWorkShopReportData } = require('./workshop/workshopreport');
const router = Router();



function getPercentUsage(startDate, endDate, details) {
    //** convert milliseconds to hours
    const dateInterval = (new Date(endDate) - new Date(startDate)) / 1000 / 60 / 60;
    const workingHours = dateInterval * (9 / 24);

    const percent_used = ((details?.time_used / workingHours) * 100).toFixed(2);


    return percent_used;
}




router.get('/machine', async (req, res) => {
    const {
        machineID,
        startDate,
        endDate
    } = req.query;



    

    try {
        const machineDetails = await getMachineReportData(machineID, startDate, endDate);
        const percent_used = getPercentUsage(startDate, endDate, machineDetails);
    
        res.status(200).json({
            "result": {...machineDetails, percent_used}
        })

    } catch(e) {
        console.log(e)
        res.status(400).json({
            "message": "Could not fetch the report."
        });
    }

});


router.get('/section', async(req, res) => {
    const {
        sectionID,
        startDate,
        endDate
    } = req.query;

    try {
        const sectionDetails = await getSectionReportData(sectionID, startDate, endDate);
        const percent_used = getPercentUsage(startDate, endDate, sectionDetails);

        
        res.status(200).json({
            "result": {...sectionDetails, percent_used}
        })
    } catch(e) {
        console.log(e)
        res.status(400).json({
            "message": "Could not fetch the report."
        });
    }


});

router.get('/workshop', async(req, res) => {
    const {
        startDate,
        endDate
    } = req.query;

    try {
        const workshopDetails = await getWorkShopReportData(startDate, endDate);
        const percent_used = getPercentUsage(startDate, endDate, workshopDetails);
        res.status(200).json({
            "result": { ...workshopDetails, percent_used }
        })
    } catch(e) {
        console.log(e)
        res.status(400).json({
            "message": "Could not fetch the report."
        });
    }

});

router.get('/student', async (req, res) => {
    const {
        email,
        startDate,
        endDate
    } = req.query;

    try {
        const workshopDetails = await getStudentReportData(email, startDate, endDate);
        // const percent_used = getPercentUsage(startDate, endDate, workshopDetails);
        res.status(200).json({
            "result": { ...workshopDetails }
        })
    } catch (e) {
        console.log(e)
        res.status(400).json({
            "message": "Could not fetch the report."
        });
    }
})


module.exports = router;