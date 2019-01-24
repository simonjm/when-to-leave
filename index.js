const express = require('express');
const request = require('request-promise');
const cheerio = require('cheerio');

const port = process.env.PORT || 3000;
const app = express();

const toWorkUrl = 'https://www.metrotransit.org/nextrip/901/4/46HI';

function fetchDeparture(url) {
    const options = {
        url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
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
    fetchDeparture(toWorkUrl)
        .then(departure => res.type('html').status(200).send(`<p>${calculateLeaveTime(departure, 5)}</p>`))
        .catch(err => res.status(500).send(`Failed to fetch departure. ${err.toString()}`));
});

app.listen(port, () => console.log(`Listening on port ${port}`));