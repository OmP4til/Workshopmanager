const thread = require('../../../db/db');
const { getSectionReportData } = require('../section/sectionReport');

async function getWorkShopReportData(start_date, end_date) {

    const getSectionDetailsQuery = `
        SELECT * 
        FROM section;
    `;

    let result = {};
    let time_used = null;
    let money_spent = null;

    try {
        const sectionDetails = await thread.query(getSectionDetailsQuery);
        if (sectionDetails.rowCount) {
            let allocationData = [];
            
            // Loop through all sections and get machine detail of each section
            await Promise.all(
                sectionDetails.rows.map(async (row, idx) => {
                    // console.log(row)
                    const sectionID = row.section_id;
                    // console.log(sectionID)
                    // const values = [sectionID, new Date(start_date).toLocaleDateString(), new Date(end_date).toLocaleDateString()];
                    const sectionWiseMachineData = await getSectionReportData(sectionID, start_date, end_date);
                    // console.log(sectionWiseMachineData)
                    allocationData = [...allocationData, sectionWiseMachineData?.allocationData];
                    // console.log('hello', sectionWiseMachineData.allocationData);
                    result[sectionID] = {...row, "allocationData" :allocationData.flat()};   
                    allocationData.pop();
                })
            )
            // console.log(allocationData.flat())
            // result = {...result, "allocationData": allocationData.flat()};
        }


        // result = sectionDetails.rowCount ? sectionDetails.rows[0] : {};

        // Supply only date to the query string

        // const sectionWiseMachineData = await thread.query(getMachineFromSectionQuery, values);

        // result = { ...result, "allocationData": sectionWiseMachineData?.rows }
        // console.log(sectionWiseMachineData);
        // console.log(new Date(start_date), new Date(end_date))
        if (sectionDetails.rowCount) {
            // console.log(Object.values(result));

            console.log('Section details')
            for (let allocationDetails of Object.values(result)) {
                let allocationData = allocationDetails?.allocationData;
                // console.log(usageMetrics);
                console.log('allocationDetails', allocationDetails);
                time_used += Object.values(allocationData).reduce((currentTimeUsed, currentInterval) => {
                    console.log('current_interval', currentInterval.end_time - currentInterval.start_time)
                    return currentTimeUsed + (currentInterval.end_time - currentInterval.start_time);
                }, 0) / 1000 / 60 / 60;

                // console.log(time_used);


                money_spent += Object.values(allocationData).reduce((spendTillNow, currentAllocation) => {
                    //** milliseconds -> seconds -> minutes -> hours
                    const hoursUsed = ((currentAllocation.end_time - currentAllocation.start_time) / 1000) / 60 / 60;
                    // console.log('hours', hoursUsed);
                    return spendTillNow + (hoursUsed * currentAllocation.hourly_rate);
                }, 0);

                console.log('time used:', time_used);
                //** milliseconds -> seconds -> minutes -> hours
                // time_used = (time_used / 1000) / 60 / 60;
                // usageMetrics.push(time_used, money_spent);
            }

            console.log(time_used);
            
    
        }

    } catch (e) {
        console.table(e)
        return false;
    }

    // console.log(usageMetrics);


    return { ...result, time_used: time_used, money_spent: money_spent };
}


module.exports = {
    getWorkShopReportData
}