const _ = require('lodash');
const request = require('request-promise');
const { DateTime, Duration } = require('luxon');

function fetchDeparture(url) {
    const options = {
        url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Safari/605.1.15',
            'Referer': 'https://www.metrotransit.org/',
            'Origin': 'https://www.metrotransit.org'
        }
    };
    return request(options)
        .then(data => {
            let json;
            try {
                json = JSON.parse(data);
            }
            catch (e) {
                throw new Error('Could not parse json', data);
            }

            if (_.isEmpty(json.departures)) {
                throw new Error('JSON does not contain \'departures\' array');
            }
            return json.departures;
        });
}

async function getNextDeparture(url) {
    const departures = await fetchDeparture(url);
    const nextDeparture = departures[0];
    return {
        arrives: nextDeparture.departure_text,
        estimate: !nextDeparture.actual
    };
}

async function whenToLeave(url, delayMin) {
    const departures = await fetchDeparture(url);
    const arrivalTime = DateTime.local().plus(Duration.fromObject({ minutes: delayMin }));
    const target = departures
        .map(({ departure_time }) => DateTime.fromSeconds(departure_time))
        .find(time => arrivalTime < time);

    if (!target) {
        throw new Error('Could not find next departure time');
    }

    return {
        leave: Math.round(target.diff(arrivalTime).as('minutes')),
        target: target.toLocaleString(DateTime.DATETIME_SHORT),
        departures
    };
}

module.exports = { getNextDeparture, whenToLeave };