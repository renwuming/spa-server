const request = require('request-promise');

const http = {};

http.get = function(url, params, headers) {
  return new Promise(function(resolve, reject) {
    const options = {
      uri: url,
      qs: params,
      headers: headers,
      json: true
    };
    request(options).then(function(res) {
      resolve(res);
    }).catch(function(e) {
      reject(e);
    });
  });
}

module.exports = http;