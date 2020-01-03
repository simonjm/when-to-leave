const express = require('express');
const _ = require('lodash');
const Table = require('cli-table');
const mt = require('./mt');

const port = process.env.PORT || 3000;
const app = express();

const stops = {
    'Am. Blvd': {
        north: 'https://svc.metrotransit.org/nextripv2/901/4/AM34'
    },
    'Minnehaha': {
        north: 'https://svc.metrotransit.org/nextripv2/901/4/50HI'
    },
    '46th St': {
        north: 'https://svc.metrotransit.org/nextripv2/901/4/46HI',
        south: 'https://svc.metrotransit.org/nextripv2/901/1/46HI'
    },
    '38th St': {
        north: 'https://svc.metrotransit.org/nextripv2/901/4/38HI'
    },
    'Nicollet Mall': {
        south: 'https://svc.metrotransit.org/nextripv2/901/1/5SNI'
    },
    'Hennepin': {
        south: 'https://svc.metrotransit.org/nextripv2/901/1/WAR2'
    },
    'Target Field': {
        south: 'https://svc.metrotransit.org/nextripv2/901/1/TF12'
    },
};

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
        return obj.arrives;
    };

    for (const result of results) {
        const [[name, data]] = Object.entries(result);
        table.push([name, parseObj(data.north), parseObj(data.south)]);
    }
    return table.toString();
}

app.get('/to/work', async (req, res) => {
    try {
        const delayMin = req.query.delay && parseInt(req.query.delay, 10) || 20;
        const result = await mt.whenToLeave(stops['46th St'].north, delayMin);
        res.json(result);
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
                results[stop][dir] = await mt.getNextDeparture(url);
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