const sql = require('mssql');
const moment = require('moment');

// Configure database connection
const config = {
    user: 'USERNAME',
    password: 'PASSWPRD',
    server: 'localhost\\mimir',
    database: 'Hl7Stats',
    options: {
        trustServerCertificate: true,
    },
};

// Function to generate a random number between min (inclusive) and max (exclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Function to generate a unique message control ID
async function generateMessageControlID(pool) {
    let messageControlID;
    let isUnique = false;
    while (!isUnique) {
        messageControlID = getRandomInt(1000000, 2000000).toString();
        const result = await pool.request().query(`SELECT COUNT(*) FROM MSHSegment WHERE MessageControlID = '${messageControlID}'`);
        isUnique = parseInt(result.recordset[0]['']) === 0;
    }
    return messageControlID;
}

// Function to insert a row into the database
async function insertRow(pool) {
    const sendingApplications = ['Trust1', 'Trust2', 'Trust3'];
    const sendingFacilities = ['PAS', 'LIMS', 'Radiology'];
    const messageType = 'ADT';
    const messageEvents = ['A01', 'A02', 'A03', 'A04', 'A05']; // List of ADT event types

    const sendingApplication = sendingApplications[getRandomInt(0, sendingApplications.length)];
    const sendingFacility = sendingFacilities[getRandomInt(0, sendingFacilities.length)];
    const receivingApplication = 'TestApp';
    const receivingFacility = 'TestApp';
    const dateTimeOfMessage = moment().subtract(getRandomInt(1, 11), 'days').format('yyyy-MM-DD HH:mm:ss.SSS');
    const messageEvent = messageEvents[getRandomInt(0, messageEvents.length)];
    const messageControlID = await generateMessageControlID(pool);
    const processingID = 'D';
    const versionID = 'HL7v2.4';
    console.log("dateTimeOfMessage:" + dateTimeOfMessage);
    const request = pool.request();
    request.input('SendingApplication', sql.VarChar(180), sendingApplication);
    request.input('SendingFacility', sql.VarChar(180), sendingFacility);
    request.input('ReceivingApplication', sql.VarChar(180), receivingApplication);
    request.input('ReceivingFacility', sql.VarChar(180), receivingFacility);
    request.input('DateTimeOfMessage', sql.DateTime, dateTimeOfMessage);
    request.input('MessageType', sql.VarChar(3), messageType);
    request.input('MessageEvent', sql.VarChar(3), messageEvent);
    request.input('MessageControlID', sql.VarChar(20), messageControlID);
    request.input('ProcessingID', sql.Char(3), processingID);
    request.input('VersionID', sql.VarChar(15), versionID);

    const result = await request.query('INSERT INTO MSHSegment (SendingApplication, SendingFacility, ReceivingApplication, ReceivingFacility, DateTimeOfMessage, MessageType, MessageEvent, MessageControlID, ProcessingID, VersionID) VALUES (@SendingApplication, @SendingFacility, @ReceivingApplication, @ReceivingFacility, @DateTimeOfMessage, @MessageType, @MessageEvent, @MessageControlID, @ProcessingID, @VersionID)');
    console.log(`${result.rowsAffected} row(s) inserted successfully.`);
}

// Function to insert multiple rows
async function insertRows(numRows) {
    try {
        await sql.connect(config);
        const pool = await sql.connect(config);
        for (let i = 0; i < numRows; i++) {
            await insertRow(pool);
        }
        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

// Change the number of rows you want to insert here
const numRowsToInsert = 10000;
insertRows(numRowsToInsert);
