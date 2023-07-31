const { Router } = require('express');
const thread = require('../../db/db');
const validate = require('validator').default;
const router = Router();


router.get("/", async (req, res) => {
    let query = `SELECT * FROM student;`

    const result = thread.query(query);
    res.status(200).json({
        message: "Student route working.",
        result: result
    });

})


router.post("/add", async (req, res) => {
    const {
        studentEmail: email,
        studentRoll: roll,
        studentDivision: division,
        studyYear: year,
        studentDepartment: department,
        studentName: name
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
        INSERT INTO student VALUES($1, $2, $3, $4, $5, $6)
    `
    const values = [
        email,
        roll,
        division,
        year,
        department,
        name
    ]


    try {
        const insertResults = await thread.query(query, values);

        console.log(insertResults);
        res.status(200).json({
            success: "Student added successfully.",
            error: null
        })

    } catch (e) {
        console.error(e);
        res.status(400).json({
            success: null,
            error: "Could not add student."
        })

    }



});





module.exports = router;

