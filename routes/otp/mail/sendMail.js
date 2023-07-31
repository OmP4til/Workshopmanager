const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const sendMail = async (
  email,
  email_subject,
  email_template,
  context = {},
  attachments = []
) => {
  let transporter = await nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAILUSER,
      pass: process.env.MAILPASSWORD,
    },
    host: 'smtp.gmail.com',
    port: 465,
  });

  // point to the template folder
  const handlebarOptions = {
    viewEngine: {
      partialsDir: path.resolve('./views/'),
      defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
  };

  // use a template file with nodemailer
  transporter.use('compile', hbs(handlebarOptions));

  return await transporter.sendMail({
    from: process.env.MAILUSER,
    to: email,
    subject: email_subject,
    template: email_template,
    context: context,
    attachments: attachments,
  });
};

module.exports = sendMail;
