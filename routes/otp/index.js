const { Router } = require("express");
const thread = require("../../db/db");
const validate = require("validator").default;
const router = Router();

const sendApplicationOtp = require("./mail/sendApplicationOtp");
const sendStaffForgotPasswordOtp = require("./mail/sendStaffForgotPasswordOtp");

router.post("/generate", async (req, res) => {
  const { studentEmail: email } = req.body;
  const MINUTES = 10;
  const SECONDS = MINUTES * 60;
  let otp = Math.floor(100000 + Math.random() * 900000)
    .toString()
    .padEnd(6); //Fixed 6 characters otp

  // time in milliseconds is converted to timestamp
  let validTime = new Date(Date.now() + SECONDS * 1000);

  try{
    if (!validate.isEmail(email)) {
      console.log(email);
      return res.status(400).json({
        error: "Please enter a valid email address",
        success: null,
      });
    }
    // check if the mail exits in the student table
    const email_query = `
      SELECT * 
      FROM student
      WHERE email_id = $1;
    `

    const email_query_result = await thread.query(email_query, [email]);
    if(email_query_result.rows.length == 0){
      return res.status(400).json({success: null, error: "Student not registered!!"});
    }

      // Insert into table if doesn't exist else update the existing otp
      const query = `
      INSERT INTO otp VALUES($1, $2, $3) 
      ON CONFLICT (email)
      DO UPDATE
      SET otp = $2, valid_till = $3;
    `;
    const values = [email, otp, validTime];

    const insertResults = await thread.query(query, values);

    // After insertion send the mail 
    await sendApplicationOtp(email, otp);
    
    console.log(insertResults);
    return res.status(200).json({
      success: "OTP sent to email",
      error: null,
    });

  }catch(e){
    console.error(e);
    return res.status(400).json({
      success: null,
      error: "Could not send OTP",
    });
  }
});

router.post("/staff-forgot-password", async (req, res) => {
  const { staffEmail: email } = req.body;
  const MINUTES = 10;
  const SECONDS = MINUTES * 60;
  let otp = Math.floor(100000 + Math.random() * 900000)
    .toString()
    .padEnd(6); //Fixed 6 characters otp

  // time in milliseconds is converted to timestamp
  let validTime = new Date(Date.now() + SECONDS * 1000);
  
  try{
    if (!validate.isEmail(email)) {
      console.log(email);
      return res.status(400).json({
        error: "Please enter a valid email address",
        success: null,
      });
    }

    // check if the mail exits in the incharge table
    const email_query = `
      SELECT * 
      FROM incharge
      WHERE email_id = $1;
    `

    const email_query_result = await thread.query(email_query, [email]);
    if(email_query_result.rows.length == 0){
      return res.status(400).json({success: null, error: "Incharge with given Email not Found"});
    }

      // Insert into table if doesn't exist else update the existing otp
      const query = `
      INSERT INTO otp VALUES($1, $2, $3) 
      ON CONFLICT (email)
      DO UPDATE
      SET otp = $2, valid_till = $3;
    `;
    const values = [email, otp, validTime];

    const insertResults = await thread.query(query, values);

    // After insertion send the mail 
    await sendStaffForgotPasswordOtp(email, otp);
    
    console.log(insertResults);
    return res.status(200).json({
      success: "OTP sent to email",
      error: null,
    });

  }catch(e){
    console.error(e);
    return res.status(400).json({
      success: null,
      error: "Could not send OTP",
    });
  }
});

module.exports = router;
