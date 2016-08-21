'use strict';
var request = require('request');
var url = require('url');
var robotto = {};
robotto._getRobotsUrl = function (urlP) {
    var receivedUrl = url.parse(urlP);
    return receivedUrl.protocol + "//" + receivedUrl.host + "/robots.txt";
};
robotto._request = request;
robotto.fetch = function (urlP, callback) {
    callback = typeof callback === 'function' ? callback : new Function();
    var robotsUrl = robotto._getRobotsUrl(urlP);
    robotto._request(robotsUrl, function (err, res, body) {
        if (err) {
            callback(err);
            return;
        }
        if (res.statusCode !== 200) {
            callback(new Error("Could not fetch robots.txt from " + urlP + ". Server response code: " + res.statusCode));
            return;
        }
        callback(null, body);
    });
};
robotto.parse = function (robotsFile) {
    var lines = robotsFile.split('\n');
    var rulesObj = {
        comments: []
    };
    var lastUserAgent;
    lines.forEach(function (line) {
        var hashIndex = line.indexOf('#');
        if (hashIndex > -1) {
            if (hashIndex === 0) {
                // entire line commentary
                rulesObj.comments.push(line.substr(hashIndex + 1).trim());
                return;
            }
            // portion line comment
            var portions = line.split('#');
            rulesObj.comments.push(portions[1].trim()); // push comment
            line = portions[0].trim(); // exclude comment from line
        }
        var userAgentIndex = line.toLowerCase().indexOf('user-agent:');
        if (userAgentIndex === 0) {
            lastUserAgent = line.split(':')[1].trim();
            rulesObj[lastUserAgent] = {
                allow: [],
                disallow: []
            };
            return;
        }
        var allowIndex = line.toLowerCase().indexOf('allow:');
        if (allowIndex === 0) {
            rulesObj[lastUserAgent].allow.push(line.split(':')[1].trim());
            return;
        }
        var disallowIndex = line.toLowerCase().indexOf('disallow:');
        if (disallowIndex === 0) {
            rulesObj[lastUserAgent].disallow.push(line.split(':')[1].trim());
            return;
        }
    });
    return rulesObj;
};
robotto.check = function (userAgent, urlParam, rulesObj) {
    delete rulesObj.comments;
    var userAgents = Object.keys(rulesObj);
    var desiredRoute = (url.parse(urlParam).pathname + '/').split('/')[1];
    var allowed = true;
    // Searches for every user agent until it gets a match
    // The 'return true' statements are used to break the .some() loop
    userAgents.some(function (agent) {
        if (agent === userAgent) {
            // Check if route is disallowed
            var disallowedRoutes = rulesObj[agent].disallow;
            disallowedRoutes.some(function (route) {
                if (desiredRoute === route.split('/')[1]) {
                    allowed = false;
                    return true;
                }
                else if (route === '/') {
                    allowed = false;
                    return true;
                }
            });
            return true;
        }
    });
    // Checks the general rules
    if (userAgents.indexOf('*') !== -1) {
        var allDisallowedRoutes = rulesObj['*'].disallow;
        allDisallowedRoutes.some(function (route) {
            if (desiredRoute === route.split('/')[1]) {
                allowed = false;
                return true;
            }
            else if (route === '/') {
                allowed = false;
                return true;
            }
        });
    }
    return allowed;
};
robotto.canCrawl = function (userAgent, urlParam, callback) {
    var _this = this;
    callback = typeof callback === 'function' ? callback : new Function();
    this.fetch(urlParam, function (err, robotsTxt) {
        if (err) {
            callback(err);
            return;
        }
        var rules = _this.parse(robotsTxt);
        var canCrawl = _this.check(userAgent, urlParam, rules);
        callback(null, canCrawl);
    });
};
module.exports = robotto;
