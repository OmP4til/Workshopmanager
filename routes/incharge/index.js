const { Router } = require('express');
const thread = require('../../db/db');
const validate = require('validator').default;
const router = Router();


router.get("/:id", async (req, res) => {
    let query = `SELECT * FROM incharge;`

    if (req.params.id) {
        query = `
            SELECT * FROM incharge 
            WHERE email_id = '${req.params.id}'
        `
    }

    const result = await thread.query(query);

    res.status(200).json({
        message: "Incharge route working.",
        result: result
    });


})


router.post("/add", async (req, res) => {
    const {
        inchargeEmail: email,
        isSupervisor,
        inchargeName: name
    } = req.body;

    if (!validate.isEmail(email)) {
        console.log(email);
        return res.status(400).json({
            error: "Please enter a valid email address",
            success: null
        });
    }

    console.log("hi");

    const query = `
        INSERT INTO incharge VALUES($1, $2, $3)
    `



    const values = [
        email,
        isSupervisor || false,
        name
    ]


    try {
        const insertResults = await thread.query(query, values);

        console.log(insertResults);
        res.status(200).json({
            success: "Incharge added successfully.",
            error: null
        })

    } catch (e) {
        console.error(e);
        res.status(400).json({
            success: null,
            error: "Could not add incharge."
        })

    }



});





module.exports = router;

