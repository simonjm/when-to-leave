const _ = require('lodash');
const request = require('request-promise');
const { DateTime, Duration } = require('luxon');

function fetchDeparture(url) {
    const options = {
        url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
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

            if (_.isEmpty(json.Departures)) {
                throw new Error('JSON does not contain \'Departures\' array');
            }
            return json.Departures;
        });
}

async function getNextDeparture(url) {
    const departures = await fetchDeparture(url);
    const nextDeparture = departures[0];
    return {
        arrives: nextDeparture.DepartureText,
        estimate: !nextDeparture.Actual
    };
}

const walkingTime = Duration.fromObject({ minutes: 20 });

async function whenToLeave(url) {
    const departures = await fetchDeparture(url);
    const arrivalTime = DateTime.local().plus(walkingTime);
    const target = departures
        .map(({ DepartureTime }) => DateTime.fromISO(DepartureTime))
        .find(time => arrivalTime < time);

    if (!target) {
        throw new Error('Could not find next departure time');
    }

    return {
        leave: Math.round(target.diff(arrivalTime).as('minutes')),
        target: target.toString(),
        departures
    };
}

module.exports = { getNextDeparture, whenToLeave };