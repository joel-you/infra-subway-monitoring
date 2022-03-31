import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {

    stages: [
        { duration: '2m', target: 2 }, // below normal load
        { duration: '3m', target: 5 },
        { duration: '2m', target: 9 }, // normal load
        { duration: '3m', target: 11 },
        { duration: '2m', target: 11 }, // around the breaking point
        { duration: '3m', target: 23 },
        { duration: '2m', target: 33 }, // beyond the breaking point
        { duration: '10m', target: 0 }, // scale down. Recovery stage.
    ],
    thresholds: {
        http_req_duration: ['p(99)<1200'], // 99% of requests must complete below 1.5s
        'logged in successfully': ['p(99)<1200'], // 99% of requests must complete below 1.5s
    },
};

const BASE_URL = 'https://infra-subway.p-e.kr/paths/?source=2&target=3';

export default function () {
    const before = new Date().getTime();
    const T = 1.2;

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    http.get(`${BASE_URL}`, params);

    const after = new Date().getTime();
    const diff = (after - before) / 1000;
    const remainder = T - diff;
    check(remainder, { 'reached request rate': remainder > 0 });
    if (remainder > 0) {
        sleep(remainder);
    } else {
        console.warn(`Timer exhausted! The execution time of the test took longer than ${T} seconds`);
    }
}
