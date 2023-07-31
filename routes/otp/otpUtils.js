const thread = require('../../db/db');


async function validateOtp(email, otp) {
	const query_validate =
		"SELECT * FROM otp WHERE email = $1 AND otp= $2 AND valid_till > $3";

	const query_delete = "DELETE FROM otp WHERE email = $1 AND otp = $2";

	const values = [email, otp, new Date(Date.now())];

	try {
		const otpData = await thread.query(query_validate, values);

		const {rows} = otpData;
		console.log(values.slice(0, 2));

		if (rows.length == 0) {
			return false;
		} else {
			await thread.query(query_delete, values.slice(0,2));

			return true;
		}


	} catch (e) {
		console.error(e);
		return false;
	}
}

module.exports = {
	validateOtp
}
