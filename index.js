const express = require('express');
const _ = require('lodash');
const Table = require('cli-table');
const mt = require('./mt');

const port = process.env.PORT || 3000;
const app = express();

const stops = {
    'Am. Blvd': {
        north: 'https://www.metrotransit.org/nextrip/901/4/AM34'
    },
    'Minnehaha': {
        north: 'https://www.metrotransit.org/nextrip/901/4/50HI'
    },
    '46th St': {
        north: 'https://www.metrotransit.org/NexTripBadge.aspx?route=901&direction=4&stop=46HI',
        south: 'https://www.metrotransit.org/nextrip/901/1/46HI'
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

function prettyPrint(results) {
    const table = new Table({
        head: ['Stop', 'North', 'South'],
        colors: false,
        colAligns: ['left', 'middle', 'middle'],
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
                , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
                , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
                , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 0 }
    });

    const parseObj = (obj) => {
        if (_.isEmpty(obj)) {
            return '';
        }
        if (obj.estimate) {
            return obj.raw;
        }
        return obj.arrives === 1 ? '1 min' : `${obj.arrives} mins`;
    };

    for (const result of results) {
        const [[name, data]] = Object.entries(result);
        table.push([name, parseObj(data.north), parseObj(data.south)]);
    }
    return table.toString();
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
    if (req.query.pretty) {
        res.type('text/plain').send(prettyPrint(results));
    }
    else {
        res.json(_.merge({}, ...results));
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));