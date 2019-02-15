const express = require('express');
const request = require('request-promise');
const cheerio = require('cheerio');

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

function fetchDeparture(url) {
    const options = {
        url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
        }
    };
    return request(options)
        .then(data => {
            const $ = cheerio.load(data);
            const nextDeparture = $('.nextDepartureText .countdown').text();
            if (nextDeparture === '') {
                throw new Error('Could not find departure text');
            }
            const match = /^(\d+) Min/.exec(nextDeparture);
            if (match === null) {
                throw new Error('Regex failed to match string: ' + nextDeparture);
            }

            return parseInt(match[1], 10);
        });
}

// TODO: Trains run every 10 min during rush hour. Figure out a way to handle times when trains run slower
const trainInterval = 10;
function calculateLeaveTime(departure, delay) {
    const leaveIn = departure - delay;
    if (leaveIn >= 0) {
        return leaveIn;
    }

    return trainInterval + leaveIn;
}

app.get('/to/work', (req, res) => {
    fetchDeparture(stops['46th St'].north)
        .then(departure => res.json({ arrives: calculateLeaveTime(departure, 5) }))
        .catch(err => res.status(500).send(`Failed to fetch departure. ${err.toString()}`));
});

app.listen(port, () => console.log(`Listening on port ${port}`));