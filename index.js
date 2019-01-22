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
            return nextDeparture
        });
}

app.get('/to/work', (req, res) => {
    fetchDeparture(toWorkUrl)
        .then(departure => res.type('html').status(200).send(`<p>${departure}</p>`))
        .catch(err => res.status(500).send(`Failed to fetch departure. ${err.toString()}`));
});

app.listen(port, () => console.log(`Listening on port ${port}`));