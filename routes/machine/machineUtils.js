const thread = require('../../db/db');


async function setMachineStatus(mid, status) {
    const query = `
        UPDATE machine 
        SET machine_status = $2
        WHERE machine_id = $1
    `
    const values = [
        mid, status
    ]


    try {
        await thread.query(query, values);

        if (!updateResults.rowCount) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}


module.exports = {
    setMachineStatus
}