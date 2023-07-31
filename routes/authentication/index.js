const { Router } = require('express');
const { validateOtp } = require('../otp/otpUtils');
const bcrypt = require('bcryptjs');
const thread = require('../../db/db');
const validate = require('validator').default;
const router = Router();

router.post('/reset-staff-password', async (req, res) => {
  const { staffEmail: email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(404).json({
      message: 'Email, password and otp are required',
    });
  }

  try {
    const isOTPValid = await validateOtp(email, otp);
    console.log(
      '🚀 ~ file: index.js ~ line 19 ~ router.post ~ isOTPValid',
      isOTPValid
    );

    if (!isOTPValid) {
      return res.status(400).json({
        message: 'OTP was incorrect or was timed out',
      });
    }

    // Creating a hash of the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
        UPDATE incharge 
        SET password = $2 
        WHERE email_id = $1;
    `;

    const insertValues = [email, hashedPassword];

    await thread.query(insertQuery, insertValues);

    res.status(200).json({
      message: `Password  Updated successfully`,
    });
  } catch (e) {
    console.log(e);

    let message = 'Could not update password, please try again later';
    res.status(400).json({
      message: message,
    });
  }
});

router.post('/staff-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(403).json({ message: 'Email and Password Required' });
  }

  try {
    const query = `
      SELECT * 
      FROM incharge
      WHERE email_id = $1;
    `;
    const values = [email];

    const query_result = await thread.query(query, values);
    if (query_result.rows.length === 0) {
      return res.status(400).json({ message: 'Incorrect Email or Password' });
    }

    const incharge = query_result.rows[0];

    const passwordMatched = bcrypt.compareSync(password, incharge.password);
    if (!passwordMatched) {
      return res.status(400).json({ message: 'Incorrect Email or Password' });
    }

    // Create a session for the owner
    const userSession = {
      isLoggedIn: true,
      isSupervisor: incharge.is_supervisor,
      incharge_email_id: incharge.email_id,
    };

    console.log(userSession);
    req.session.userSession = userSession;
    return res.status(202).json({
      message: 'Incharge LoggedIn',
      loginStatus: { isLoggedIn: true, isSupervisor: incharge.is_supervisor },
    });
  } catch (error) {
    console.log(error);
    const message = 'Login Failed, retry later';
    res.status(400).json({ message: message });
  }
});

router.get('/staff-login', (req, res) => {
  let loginStatus = {
    isLoggedIn: false,
    isSupervisor: false,
  };

  // Fetch the userSession from the user
  const { userSession } = req.session;
  if (!userSession) {
    console.log('No session');
    return res.status(200).json({ message: 'Session not found', loginStatus });
  }

  // Coping the values from teh session to login status
  loginStatus.isLoggedIn = userSession.isLoggedIn;
  loginStatus.isSupervisor = userSession.isSupervisor;

  return res.status(200).json({ message: 'Session found', loginStatus });
});

router.post('/staff-logout', (req, res) => {
  // Check if session exits or not
  if (!req.session.userSession) {
    return res.status(200).json({ message: 'User already logged out!' });
  }

  // Destroy the session
  req.session.destroy();

  return res.status(200).json({
    message: 'User logged out successfully!',
  });
});

module.exports = router;
