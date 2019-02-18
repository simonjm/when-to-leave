const express = require('express');
const _ = require('lodash');
const mt = require('./mt');

const port = process.env.PORT || 3000;
const app = express();

const stops = {
    'Minnehaha': {
        north: 'https://www.metrotransit.org/nextrip/901/4/50HI'
    },
    '46th St': {
        north: 'https://www.metrotransit.org/nextrip/901/4/46HI'
    },
    '38th St': {
        north: 'https://www.metrotransit.org/nextrip/901/4/38HI'
    },
    'Nicollet Mall': {
        south: 'https://www.metrotransit.org/nextrip/901/1/5SNI'
    },
    'Hennepin': {
        south: 'https://www.metrotransit.org/nextrip/901/1/WAR2'
    },
    'Target Field': {
        south: 'https://www.metrotransit.org/nextrip/901/1/TF12'
    },
};

// TODO: Trains run every 10 min during rush hour. Figure out a way to handle times when trains run slower
const trainInterval = 10;
function calculateLeaveTime(departure, delay) {
    const leaveIn = departure - delay;
    if (leaveIn >= 0) {
        return leaveIn;
    }

    return trainInterval + leaveIn;
}

app.get('/to/work', async (req, res) => {
    try {
        const response = await mt.fetchDeparture(stops['46th St'].north);
        response.arrives = calculateLeaveTime(response.arrives, 5);
        res.json(response);
    }
    catch (err) {
        res.json(500, { error: err.toString() });
    }
});

app.get('/all', async (req, res) => {
    const promises = Object.entries(stops).map(async ([stop, directions]) => {
        const results = {};
        results[stop] = {};
        for (const [dir, url] of Object.entries(directions)) {
            try {
                results[stop][dir] = await mt.fetchDeparture(url);
            }
            catch (e) {
                results[stop][dir] = { error: e.toString() };
            }
        }
        return results;
    });

    const results = await Promise.all(promises);
    res.json(_.merge({}, ...results));
});

app.listen(port, () => console.log(`Listening on port ${port}`));