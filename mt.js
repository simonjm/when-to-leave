
const request = require('request-promise');
const cheerio = require('cheerio');
const { DateTime } = require('luxon');

function parseResponse(text) {
    const match = /^(\d+) Min/.exec(text);
    if (match !== null) {
        return { arrives: parseInt(match[1], 10), raw: text };
    }
    else if (/^\d+:\d+$/.test(text)) {
        const future = DateTime.fromFormat(text, 'h:mm');
        const diff = Math.ceil(future.diffNow().as('minutes'));
        return { arrives: diff, estimate: true, raw: text };
    }

    throw new Error('Regex failed to match string: ' + text);
}

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
            return parseResponse(nextDeparture);
        });
}

module.exports = { fetchDeparture };