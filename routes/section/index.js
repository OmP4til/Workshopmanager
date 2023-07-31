const { Router } = require('express');
const thread = require('../../db/db');
const router = Router();


router.get("/:id", async (req, res) => {
    let query = `SELECT * FROM section;`

    if (req.params.id) {
        query = `
            SELECT * FROM section 
            WHERE email_id = '${req.params.id}'
        `
    }

    const result = await thread.query(query);

    res.status(200).json({
        message: "Section route working.",
        result: result
    });


})


router.post("/add", async (req, res) => {
    const {
        sectionID,
        sectionInchargeID: inchargeID,
        sectionName: name
    } = req.body;


    const query = `
        INSERT INTO section VALUES($1, $2, $3)
    `

    const values = [
        sectionID,
        inchargeID,
        name
    ]


    try {
        const insertResults = await thread.query(query, values);

        console.log(insertResults);
        res.status(200).json({
            success: "Section added successfully.",
            error: null
        })

    } catch (e) {
        console.error(e);
        res.status(400).json({
            success: null,
            error: "Could not add section."
        })

    }
});





module.exports = router;

