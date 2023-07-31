const sendMail = require('./sendMail');

const sendApplicationOtp = async (email, code) => {
  const email_subject = 'OTP for Registration';

  const email_template = 'otp_application';

  let context = {
    otp_code: code,
    social_account: 'abc@gmail.com',
  };

  let attachments = [
    {
      filename: 'animated_header.gif',
      path: `${__dirname}/../../../assets/images/email/animated_header.gif`,
      cid: 'animated_header',
    },
    {
      filename: 'bee.png',
      path: `${__dirname}/../../../assets/images/email/bee.png`,
      cid: 'bee',
    },
    {
      filename: 'body_background_2.png',
      path: `${__dirname}/../../../assets/images/email/body_background_2.png`,
      cid: 'body_background_2',
    },
    {
      filename: 'bottom_img.png',
      path: `${__dirname}/../../../assets/images/email/bottom_img.png`,
      cid: 'bottom_img',
    },
    {
      filename: 'logo.png',
      path: `${__dirname}/../../../assets/images/email/logo.png`,
      cid: 'logo',
    },
  ];

  return await sendMail(
    email,
    email_subject,
    email_template,
    context,
    attachments
  );
};

module.exports = sendApplicationOtp;
