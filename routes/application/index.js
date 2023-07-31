const e = require('express');
const { Router } = require('express');
const thread = require('../../db/db');
const { validateOtp } = require('../otp/otpUtils');
// const {generateAppID} = require('./applicationUtils');
const generateAppID = require('./middleware/generateAppID');
const router = Router();

const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Multer middleware")
    cb(null, "public/application_files");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const fileName = `${req["appID"]}_${Date.now()}.${ext}`;
    if (req["fileNames"] === undefined) {
      req["fileNames"] = [fileName];
    } else {
      req["fileNames"] = [...req["fileNames"], fileName];
    }
    cb(null, fileName);
  },
});


const multerFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[1] === "pdf") {
    cb(null, true);
  } else {
    cb(new Error("Not a PDF File!!"), false);
  }
};


const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});


// Get all if application id is not supplied
router.get('/', async (req, res) => {
  let getApplicationQuery = `
        SELECT * FROM application
    `;
  let applicationParams = [];

  let { appid, status, searchQuery } = req.query;

  const getFilesQuery = `
    SELECT file_path FROM application_attachments
    WHERE application_id = $1;
  `

  if (!searchQuery) {
    searchQuery = '';
  }


  searchQuery = searchQuery.toLowerCase();

  if (appid && status) {
    return res.status(400).json({
      message: 'Cannot fetch a valid application.',
    });
  }

  if (appid) {
    getApplicationQuery = `
            SELECT * FROM application WHERE application_id = $1 
        `;
    applicationParams = [...applicationParams, appid];
  }

  if (status) {
    getApplicationQuery = `
            SELECT * FROM application WHERE status = $1 AND (LOWER(subject) LIKE '%${searchQuery}%' OR LOWER(description) LIKE '%${searchQuery}%' OR LOWER(application_id) LIKE '%${searchQuery}%') ORDER BY submitted_on DESC;
        `;
    applicationParams = [...applicationParams, status];
  }

  if (!appid && !status) {
    getApplicationQuery = `
            SELECT * FROM application WHERE LOWER(subject) LIKE '%${searchQuery}%' OR LOWER(description) LIKE '%${searchQuery}%' OR LOWER(application_id) LIKE '%${searchQuery}%' 
            ORDER BY submitted_on DESC;  
        `;
  }

  try {
    const applications = await thread.query(
      getApplicationQuery,
      applicationParams
    );
    console.log(applications);

    let attachments = null;
    if (appid) {
      attachments = await thread.query(
        getFilesQuery,
        [appid]
      );

      if (attachments.rowCount) {
        attachments.rows = attachments?.rows?.map((file, idx) => file.file_path);
      }

      console.log("files path")
    }


    if (!applications.rowCount && appid) {
      return res.status(200).json({
        message: 'Enter a valid application ID',
        result: [],
      });
    }

    if (!applications.rowCount && status) {
      return res.status(200).json({
        message: `No ${status} requests.`,
        result: [],
      });
    }

    const resultData = applications?.rows?.map((row, idx) => {
      return {...row, attachments: attachments?.rows};
    }); 



    // console.log({ {...applications.rows, attachments: attachments?.rowCount ? attachments?.rows : []} });
    res.status(200).json({
      result: resultData,
      // result: applications.rows
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: 'Could not get application',
    });
  }
});

router.post('/set-status', async (req, res) => {
  const {
    applicationID: appID,
    applicationStatus: status,
    actionRemark: remark,
  } = req.body;

  const setStatusQuery = `
        UPDATE application
        SET status = $2, action_remark = $3
        WHERE application_id = $1
    `;

  const setStatusValues = [appID, status, remark];

  try {
    const setStatusResults = await thread.query(
      setStatusQuery,
      setStatusValues
    );
    console.log(setStatusResults);
    if (!setStatusResults.rowCount) {
      return res.status(400).json({
        message: 'Could not find a valid applicationID',
      });
    }

    if (status === 'approved') {
      return res.status(200).json({
        message: 'Request approved.',
      });
    } else if (status === 'rejected') {
      return res.status(200).json({
        message: 'Application was rejected',
      });
    }

    console.log('reached here/');

    res.json(200).json({
      message: `Status for ${appID} set successfully.`,
    });
  } catch (e) {
    let errorMessage = 'Could not set status of the application';
    console.log(e);
    switch (e.code) {
      case '23514': // Check constraint is violated
        errorMessage =
          'Invalid application status. Valid status = (pending, approved,rejected)';
        break;
      case '23505': // Duplicate primary key
        errorMessage = 'Machine is already alloted.';
        break;
      default:
        break;
    }

    res.status(400).json({
      message: errorMessage,
    });
  }
});

// .array(fieldname[, maxCount])
router.post('/submit', [generateAppID, upload.array("attachments", 5)], async (req, res) => {
  // console.table(req.body);
  // console.log(req["appID"]);
  // console.log(req.files);

  const {
    studentEmail: email,
    title,
    description,
    applicationStatus: status,
    otp,
  } = req.body;
  const applicationID = req["appID"];
  const fileNames = req["fileNames"];
  console.log(fileNames);

  const isOTPValid = await validateOtp(email, otp);

  if (!isOTPValid) {
    return res.status(400).json({
      message: 'OTP was incorrect or was timed out.',
    });
  }


  const insertQuery = `
        INSERT INTO application VALUES($1, $2, $3, $4, $5, $6)
    `;





  const insertValues = [
    email,
    applicationID,
    status || 'pending', // status is pending by default if not specified otherwise
    title,
    description,
    new Date(),
  ];

  console.log(insertValues);

  try {
    const insertResults = await thread.query(insertQuery, insertValues);
    let attachmentInsertQuery = null, attachmentValues = null;
  

    if (fileNames) {
      await Promise.all(fileNames?.map(async (file, idx) => {
        attachmentInsertQuery = `
            INSERT INTO application_attachments
            VALUES($1, $2);
          `
        attachmentValues = [applicationID, `/application_files/${file}`];
        try {
          await thread.query(attachmentInsertQuery, attachmentValues);
        } catch (e) {
          console.log(e);
        }
  
      }))
    }

    // const machineAllotmentValues = [
    //     machineID,
    //     email,
    //     startTime,
    //     endTime,
    //     applicationID,
    // ]

    // Insert into machine_allotment and update machine status only if the application is approved
    // if (status === 'approved') {
    //     await setMachineStatus(machineID, 'booked');

    //     return res.json(200).json({
    //         "message": `Application submitted successfully for ${email} and request approved.`
    //     })
    // }

    res.status(200).json({
      message: `Application submitted successfully for ${email}`,
      applicationId: applicationID,
    });
  } catch (e) {
    console.log(e);
    let message = 'Could not submit the applicaiton';
    switch (e.code) {
      case '23503': // Check which foreign key constraint is violated
        if (e.detail.toLowerCase().includes('student')) {
          message = 'Student not registered.';
        } else if (e.detail.toLowerCase().includes('machine')) {
          message = 'Machine is not valid.';
        }
        break;
      default:
        break;
    }
    res.status(400).json({
      message: message,
    });
  }
});

module.exports = router;
