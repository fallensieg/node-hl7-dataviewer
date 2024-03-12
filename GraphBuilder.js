const sql = require('mssql');
const plotly = require('plotly')('fallensieg', '••••••••••'); // Replace with your Plotly username and API key
const express = require('express');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');

const config = {
  user: 'USERNAME',
  password: 'PASSWORD',
  server: 'DATABASE',
  database: 'Hl7Stats',
  options: {
    trustServerCertificate: true,
  },
};


async function getSendingApplications() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT DISTINCT SendingApplication FROM MSHSegment ORDER BY SendingApplication ASC');
    await sql.close();

    return result.recordset.map(row => row.SendingApplication);
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

async function getSendingFacilities() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT DISTINCT [SendingFacility] FROM MSHSegment ORDER BY [SendingFacility] ASC');
    await sql.close();

    return result.recordset.map(row => row.SendingFacility);
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}


async function getMessageTypes() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT DISTINCT CONCAT( [MessageType] , \'_\' , [MessageEvent]) [Msg]  FROM MSHSegment ORDER BY 1 ASC');
    await sql.close();

    return result.recordset.map(row => row.Msg);
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}


async function getData(sendingApplication) {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('SendingApplication', sql.VarChar, sendingApplication); // Bind parameter using input method
    const result = await request.query(`
      SELECT 
        DATEPART(YEAR, DateTimeOfMessage) AS Year,
        DATEPART(MONTH, DateTimeOfMessage) AS Month,
        DATEPART(DAY, DateTimeOfMessage) AS Day,
        DATEPART(HOUR, DateTimeOfMessage) AS Hour,
        DATEPART(MINUTE, DateTimeOfMessage) AS Minute,
        COUNT(*) AS [RowCount]
      FROM MSHSegment
      WHERE SendingApplication = @SendingApplication
      GROUP BY 
        DATEPART(YEAR, DateTimeOfMessage),
        DATEPART(MONTH, DateTimeOfMessage),
        DATEPART(DAY, DateTimeOfMessage),
        DATEPART(HOUR, DateTimeOfMessage),
        DATEPART(MINUTE, DateTimeOfMessage)
      ORDER BY 
        Year, Month, Day, Hour, Minute
    `);
    await sql.close();

    return result.recordset;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

async function getFacilityData(sendingFacility) {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('SendingFacility', sql.VarChar, sendingFacility); // Bind parameter using input method
    const result = await request.query(`
      SELECT 
        DATEPART(YEAR, DateTimeOfMessage) AS Year,
        DATEPART(MONTH, DateTimeOfMessage) AS Month,
        DATEPART(DAY, DateTimeOfMessage) AS Day,
        DATEPART(HOUR, DateTimeOfMessage) AS Hour,
        DATEPART(MINUTE, DateTimeOfMessage) AS Minute,
        COUNT(*) AS [RowCount]
      FROM MSHSegment
      WHERE SendingFacility = @SendingFacility
      GROUP BY 
        DATEPART(YEAR, DateTimeOfMessage),
        DATEPART(MONTH, DateTimeOfMessage),
        DATEPART(DAY, DateTimeOfMessage),
        DATEPART(HOUR, DateTimeOfMessage),
        DATEPART(MINUTE, DateTimeOfMessage)
      ORDER BY 
        Year, Month, Day, Hour, Minute
    `);
    await sql.close();

    return result.recordset;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

async function getMessageTypeData(messageType) {
  try {
    console.log("getMessageTypeData");
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('messageType', sql.VarChar, messageType); // Bind parameter using input method

    const result = await request.query(`
      SELECT 
        DATEPART(YEAR, DateTimeOfMessage) AS Year,
        DATEPART(MONTH, DateTimeOfMessage) AS Month,
        DATEPART(DAY, DateTimeOfMessage) AS Day,
        DATEPART(HOUR, DateTimeOfMessage) AS Hour,
        DATEPART(MINUTE, DateTimeOfMessage) AS Minute,
        COUNT(*) AS [RowCount]
      FROM MSHSegment
      WHERE  CONCAT( [MessageType] , '_' , [MessageEvent]) = @MessageType
      GROUP BY 
        DATEPART(YEAR, DateTimeOfMessage),
        DATEPART(MONTH, DateTimeOfMessage),
        DATEPART(DAY, DateTimeOfMessage),
        DATEPART(HOUR, DateTimeOfMessage),
        DATEPART(MINUTE, DateTimeOfMessage)
      ORDER BY 
        Year, Month, Day, Hour, Minute
    `);
    await sql.close();

    return result.recordset;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}


app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const sendingApplications = await getSendingApplications();
    const sendingFacilities = await getSendingFacilities(); // Assuming you have a function to fetch sending facilities
    const messageTypes = await getMessageTypes(); // Assuming you have a function to fetch message types

    const optionsSendingApp = sendingApplications.map(app => `<option value="${app}">${app}</option>`).join('');
    const optionsSendingFacility = sendingFacilities.map(facility => `<option value="${facility}">${facility}</option>`).join('');
    const optionsMessageType = messageTypes.map(type => `<option value="${type}">${type}</option>`).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Choose Criteria</title>
		<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
		<link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css">
		<script defer="" src="https://code.getmdl.io/1.3.0/material.min.js"></script>
		<style>
			.demo-card-wide.mdl-card {
			  width: 512px;
			}
			.demo-card-wide > .mdl-card__title {
			  color: #fff;
			  height: 176px;
			  background: url('../assets/demos/welcome_card.jpg') center / cover;
			}
			.demo-card-wide > .mdl-card__menu {
			  color: #fff;
			}

		</style>
	</head>
	<body>
		<div class="demo-card-wide mdl-card mdl-shadow--2dp">
			<div class="mdl-card__title">
				<h2 class="mdl-card__title-text">Sending Application</h2>
			</div>
			<div class="mdl-card__supporting-text">
				<div class="mdl-selectfield mdl-js-selectfield">
           <form action="/sendingApplication" method="get">
              <div class="mdl-selectfield mdl-js-selectfield">
                <select class="mdl-selectfield__select" name="sendingApplication" id="sendingApplication">
                  ${optionsSendingApp}
                </select>
                <label class="mdl-selectfield__label" for="sendingApplication">Select Sending Application</label>
              </div>
              <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" type="submit">View Graph</button>
            </form>
				</div>
			</div>
		</div>

		<div class="demo-card-wide mdl-card mdl-shadow--2dp">
			<div class="mdl-card__title">
				<h2 class="mdl-card__title-text">Sending Facility</h2>
			</div>
			<div class="mdl-card__supporting-text">
				<div class="mdl-selectfield mdl-js-selectfield">
           <form action="/sendingFacility" method="get">
              <div class="mdl-selectfield mdl-js-selectfield">
                <select class="mdl-selectfield__select" name="sendingFacility" id="sendingFacility">
                  ${optionsSendingFacility}
                </select>
                <label class="mdl-selectfield__label" for="sendingFacility">Select Sending Facility</label>
              </div>
              <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" type="submit">View Graph</button>
            </form>
				</div>
			</div>
		</div>

		<div class="demo-card-wide mdl-card mdl-shadow--2dp">
			<div class="mdl-card__title">
				<h2 class="mdl-card__title-text">Sending Message Type</h2>
			</div>
			<div class="mdl-card__supporting-text">
				<div class="mdl-selectfield mdl-js-selectfield">
           <form action="/sendingMessageType" method="get">
              <div class="mdl-selectfield mdl-js-selectfield">
                <select class="mdl-selectfield__select" name="sendingMessageType" id="sendingMessageType">
                  ${optionsMessageType}
                </select>
                <label class="mdl-selectfield__label" for="sendingMessageType">Select Message Type</label>
              </div>
              <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" type="submit">View Graph</button>
            </form>
				</div>
			</div>
		</div>

	</body>
</html>

    `;

    res.send(html);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/sendingApplication', async (req, res) => {
  const sendingApplication = req.query.sendingApplication;

  if (!sendingApplication) {
    return res.status(400).send('SendingApplication parameter is required');
  }

  try {
    const data = await getData(sendingApplication);

    // Process data for x-axis (date and time with minutes)
    const plotlyData = {
      x: data.map(row => {
        const date = new Date(row.Year, row.Month - 1, row.Day, row.Hour, 0, 0); // Set minutes to 0
        date.setMinutes(row.Minute); // Set minutes based on data
        return date.toISOString();
      }),
      y: data.map(row => row.RowCount),
      type: 'line'
    };

    const layout = {
      title: `Number of Rows Written per Minute for Sending Application: ${sendingApplication}`,
      xaxis: {
        title: 'Date and Time',
        type: 'date', // Set x-axis type to date-time
        tickformat: '%Y-%m-%d %H:%M:%S' // Format x-axis tick labels
      },
      yaxis: {
        title: 'Number of Rows',
      },
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graph</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css">
        <script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body>
        <div class="mdl-card mdl-shadow--2dp" style="width: 800px; margin: auto; margin-top: 50px;">
          <div class="mdl-card__title">
            <h2 class="mdl-card__title-text">${layout.title}</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <div id="graph"></div>
          </div>
        </div>
        <script>
          var plotlyData = ${JSON.stringify(plotlyData)};
          var layout = ${JSON.stringify(layout)};
          Plotly.newPlot('graph', [plotlyData], layout);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/sendingFacility', async (req, res) => {
  const sendingFacility = req.query.sendingFacility;

  if (!sendingFacility) {
    return res.status(400).send('SendingFacility parameter is required');
  }

  try {
    const data = await getFacilityData(sendingFacility);

    // Process data for x-axis (date and time with minutes)
    const plotlyData = {
      x: data.map(row => {
        const date = new Date(row.Year, row.Month - 1, row.Day, row.Hour, 0, 0); // Set minutes to 0
        date.setMinutes(row.Minute); // Set minutes based on data
        return date.toISOString();
      }),
      y: data.map(row => row.RowCount),
      type: 'line'
    };

    const layout = {
      title: `Number of Rows Written per Minute for Sending Facility: ${sendingFacility}`,
      xaxis: {
        title: 'Date and Time',
        type: 'date', // Set x-axis type to date-time
        tickformat: '%Y-%m-%d %H:%M:%S' // Format x-axis tick labels
      },
      yaxis: {
        title: 'Number of Rows',
      },
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graph</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css">
        <script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body>
        <div class="mdl-card mdl-shadow--2dp" style="width: 800px; margin: auto; margin-top: 50px;">
          <div class="mdl-card__title">
            <h2 class="mdl-card__title-text">${layout.title}</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <div id="graph"></div>
          </div>
        </div>
        <script>
          var plotlyData = ${JSON.stringify(plotlyData)};
          var layout = ${JSON.stringify(layout)};
          Plotly.newPlot('graph', [plotlyData], layout);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/sendingMessageType', async (req, res) => {
  console.log("/sendingMessageType");
  const sendingMessageType = req.query.sendingMessageType;

  if (!sendingMessageType) {
    return res.status(400).send('messageType parameter is required');
  }

  try {
    const data = await getMessageTypeData(sendingMessageType);

    // Process data for x-axis (date and time with minutes)
    const plotlyData = {
      x: data.map(row => {
        const date = new Date(row.Year, row.Month - 1, row.Day, row.Hour, 0, 0); // Set minutes to 0
        date.setMinutes(row.Minute); // Set minutes based on data
        return date.toISOString();
      }),
      y: data.map(row => row.RowCount),
      type: 'line'
    };

    const layout = {
      title: `Number of Rows Written per Minute for Sending Facility: ${sendingMessageType}`,
      xaxis: {
        title: 'Date and Time',
        type: 'date', // Set x-axis type to date-time
        tickformat: '%Y-%m-%d %H:%M:%S' // Format x-axis tick labels
      },
      yaxis: {
        title: 'Number of Rows',
      },
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graph</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css">
        <script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body>
        <div class="mdl-card mdl-shadow--2dp" style="width: 800px; margin: auto; margin-top: 50px;">
          <div class="mdl-card__title">
            <h2 class="mdl-card__title-text">${layout.title}</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <div id="graph"></div>
          </div>
        </div>
        <script>
          var plotlyData = ${JSON.stringify(plotlyData)};
          var layout = ${JSON.stringify(layout)};
          Plotly.newPlot('graph', [plotlyData], layout);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});