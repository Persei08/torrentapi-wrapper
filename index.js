'use strict';

var got = require('got'),
    session = {},
    endpoint = 'https://torrentapi.org/pubapi_v2.php';

var getToken = function () {
    return new Promise(function (resolve, reject) {
        if (session.token && (session.token_expires - Date.now() > 0)) {
            resolve(session);
        } else {
            var ttl = Date.now() + 900000, app_id = session.app_id ? '&app_id=' + session.app_id : '';
            got(endpoint + '?get_token=get_token' + app_id, {
                headers: {
                    'user-agent': session.ua
                }
            }).then(function (res) {
                session.token = JSON.parse(res.body).token;
                session.token_expires = ttl;
                resolve(session);
            }).catch(reject);
        }
    });
};

var buildQuery = function (mode, q) {
    var newq = {
        token: session.token,
        format: 'json_extended'
    };

    // mode
    if (mode === 'search') {
        newq.mode = 'search';
        if (q.query || q.string) newq.search_string = q.query || q.string;
        if (q.imdb) newq.search_imdb = 'tt' + q.imdb.toString().replace('tt', '');
        if (q.tvdb) newq.search_tvdb = '' + q.tvdb;
        if (q.tmdb || q.themoviedb) newq.search_themoviedb = '' + (q.tmdb || q.themoviedb);
    } else {
        newq.mode = 'list';
    }

    // category filtering
    var cat = q.category || q.categories;
    if (cat) {
        if (cat === 'tv' || cat === 'movies') {
            newq.category = cat;
        } else if (cat.match(/all/i) !== null || (cat.match(/movie/i) !== null && cat.match(/tv|show/i) !== null)) {
            newq.category = '14;48;17;44;45;47;42;46;18;41';
        } else if (cat.match(/xxx|porn|adult/i) !== null) {
            newq.category = '4';
        } else if (cat.match(/movie/i) !== null) {
            newq.category = '14;48;17;44;45;47;42;46';
        } else if (cat.match(/tv|show/i) !== null) {
            newq.category = '18;41';
        } else if (cat.match(/anime/i) !== null) {
            newq.category = '14;48;17;44;45;47;42;46;18;41';
        }
    }

    // limit
    if (q.limit && q.limit > 25) newq.limit = q.limit > 100 ? '100' : q.limit;

    // sorting
    if (q.sort) {
        if (q.sort.match(/seed/i)) newq.sort = 'seeders';
        if (q.sort.match(/leech/i)) newq.sort = 'leechers';
        if (q.sort.match(/last|upload/i)) newq.sort = 'last';
    }

    // minimum seed/leech
    if (q.min_seed || q.min_seeds || q.min_seeders) newq.min_seeders = q.min_seed || q.min_seeds || q.min_seeders;
    if (q.min_leech || q.min_peers || q.min_leechs || q.min_leechers) newq.min_leechers = q.min_leech || q.min_peers || q.min_leechs || q.min_leechers;

    // ranked?
    if ((q.rank === false || q.rank == 0) || (q.verified === false || q.verified == 0) || (q.ranked === false || q.ranked == 0)) newq.ranked = 0;

    // pagination - doesn't exist (yet?)
    // if (parseInt(q.page)) newq.page = parseInt(q.page);

    return newq;
};

var buildUrl = function (q) {
    var url = endpoint + '?', count = 1;
    if (session.app_id) url += 'app_id=' + session.app_id + '&';
    for (var i in q) {
        url += i + '=' + q[i];
        if (count < Object.keys(q).length) {
            url += '&';
        } else {
            return url;
        }
        count++;
    }
};

var parseResponse = function (m) {
    var obj = JSON.parse(m.body);
    if (obj['torrent_results']) {
        return obj['torrent_results'];
    } else {
        throw new Error(obj ? obj.error + ', err_code ' + obj.error_code : 'Unexpected error');
    }
};

var chainCall = function (ua, app_id, query, mode) {
    // Waiting 2 seconds because api has a 1req/2s limit.
    var waitTill = new Date(new Date().getTime() + 2 * 1000);
    console.log("Waiting 2 seconds ...");
    while(waitTill > new Date()){
        if (!query) {
            if (!ua) throw new Error('Missing User-Agent parameter');
            query = typeof ua === 'string' ? {query: ua} : ua;
            ua = false;
            if (!app_id) throw new Error('Missing app_id parameter');
        }
        session.ua = ua;
        session.app_id = app_id;
        return getToken().then(function (tokens) {
            return buildQuery(mode, query);
        }).then(buildUrl).then(function (url) {
            return got(url, {
                headers: {
                    'user-agent': session.ua
                }
            });
        }).then(parseResponse);
    }
};

module.exports = {
    search: function (ua, app_id, query) {
        return chainCall(ua, app_id, query, 'search');
    },
    list: function (ua, app_id, query) {
        return chainCall(ua, app_id, query, 'list');
    }
};