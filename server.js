const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const thread = require('./db/db');
const studentRoute = require('./routes/student')
const applicationRoute = require('./routes/application')
const authenticationRoute = require('./routes/authentication')
const machineRoute = require('./routes/machine')
const otpRoute = require('./routes/otp')
const allotMachine = require('./routes/allot')
const inchargeRoute = require('./routes/incharge')
const timeTableRoute = require('./routes/timetable');
const reportRoute = require('./routes/report');
const generateAppID = require('./routes/application/middleware/generateAppID');


app.use(morgan('combined'));
app.use(helmet());


// TODO: Remember to change allowed origin in production 
app.use(
  cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true,
  })
);
    
app.use(cookieParser());
app.use(express.static('public'))



app.use(
  session({
    key: process.env.SESSION_KEY,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // TODO: Add the below line in production, as secure option is only available in https 
      // secure: true,
      // 30 Days period for the session cookie
      maxAge: 30 * 24 * 60 * 60 * 1000 
    },
    store: new pgSession({
      pool : thread,                // Connection pool
      tableName : 'user_sessions'   // Use another table-name than the default "session" one
    }),
})
);

app.get("/", async (req, res) => {

    const time = await thread.query(`\dt`);

    console.log(time)
    res.status(200).json({
        message: "Index Route",
        time: time.rows[0]
    });
})



const PORT = process.env.PORT || 8081;
app.listen(PORT, (err) => {
    if (err) console.error(err);
    else console.log(`Listening on ${PORT}`);
})


// TODO: Create login route for supervisor


app.use('/api/student', studentRoute)
app.use('/api/application' ,applicationRoute);
app.use('/api/authentication', authenticationRoute);
app.use('/api/machine', machineRoute);
app.use('/api/otp',otpRoute);
app.use('/api/allot',allotMachine);
app.use('/api/incharge',inchargeRoute);
app.use('/api/time-table',timeTableRoute);
app.use('/api/report',reportRoute);