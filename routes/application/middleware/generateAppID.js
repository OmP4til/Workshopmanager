const generateAppID = (req, res, next) => {
    console.log("app id middleware")
    
    const today = new Date();
    const appID = `${today.getDate()}${today.getHours()}${today.getSeconds()}`.padEnd(6, 0);

    req["appID"] = appID;
    next();
}

module.exports = generateAppID;