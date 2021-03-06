/* Build a simple server, make a request and check the output is OK.
 */

var assert = require('chai').assert,
    express = require('express'),
    fs = require('fs'),
    har = require('../index.js'),
    path = require('path'),
    request = require('supertest');

describe('Simple test', function () {
    var app;

    before(function () {
        app = express();

        app.use(har({
            harOutputDir: __dirname
        }));

        app.get('/', function (req, res, next) {
            return res.send(200, 'This is quite OK');
        });
    });

    // Remove *.har-files after each test
    afterEach(function (done) {
        fs.readdir(__dirname, function (err, files) {
            files
            .filter(function (filename) {
                return filename.indexOf('.har') > 10;
            })
            .forEach(function (filename) {
                fs.unlinkSync(path.join(__dirname, filename));
            });
            done(err);
        });
    });

    it('Sends requests', function (done) {
        request(app)
            .get('/')
            .set('Custom-header', 'foo/bar')
            .expect(200)
            .end(function (err, res) {
                // Wait for file to be written to disk
                setTimeout(function () {
                    var filename = fs.readdirSync(__dirname).filter(function (filename) {
                        return filename.indexOf('.har') > 10;
                    })[0];

                    // It is valid JSON
                    var json;
                    try {
                        var fullFilename = path.join(__dirname, filename),
                            data = fs.readFileSync(fullFilename);
                        json = JSON.parse(data);
                    } catch (e) {
                        assert(e, 'Could not parse JSON');
                        return done(e);
                    }

                    // Simple sanity check
                    assert.deepProperty(json, 'log.entries.0');

                    done(err);
                }, 5);
            });
    });
});
