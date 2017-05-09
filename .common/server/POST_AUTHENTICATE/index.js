'use strict';
console.log('Loading function');
const AWS = require('aws-sdk');
const doc = require('dynamodb-doc');
const crypto = require('crypto');
const async = require('async');
const jwt = require('jsonwebtoken');
const dynamo = new doc.DynamoDB();
const CHALLENGE_LENGTH = 20;

exports.handler = (event, context, callback) => {
    console.log(event);
    if (event.username === null)
        return callback('Username missing.');
    if (event.challenge === null)
        return callback('Challenge missing.');
    if (event.response === null)
        return callback('Response missing.');

    let done = (err, res) => {
        err ? console.log(JSON.stringify(err, 2)) :
            console.log(JSON.stringify(res, 2));

        callback(null, {
            statusCode: err ? '400' : '200',
            body: err ? err.message : res,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    let responseParams =
        {
            Key:
            {
                "challenge": event.challenge
            },
            TableName: "Challenges"
        };
    let hashParams =
        {
            Key:
            {
                "username": event.username
            },
            TableName: "Users"
        }
    async.waterfall([
        (callback) => {
            dynamo.getItem(responseParams, (err, data) => {
                if (err) return callback(err);
                console.log(JSON.stringify(data, 2));
                return callback(null, new Buffer(event.challenge, "base64"));
            });
        },
        (challenge, callback) => {
            dynamo.getItem(hashParams, (err, data) => {
                if (err) return callback(err);
                console.log(JSON.stringify(data, 2));
                return callback(null, challenge, data.Item.hash)
            });
        },
    (challenge, hash, callback) => {
        const sha = crypto.createHash('sha256');
        sha.update(challenge);
        sha.update(hash);
        let response = sha.digest('base64');
        console.log(response, event.response);
        if (response !== event.response)
            return callback("Response did not match.")
        else {
            let pay =
                {
                    "username": event.username,
                };
            let options =
                {
                    algorithm: "HS256",
                    header: "JWT",
                    issuer: "watchmyass.webcam",
                    audience: "watchmyass.webcam",
                    subject: "User Identity Key",
                    expiresIn: "1d",
                    notBefore: "0"
                };
            return callback(null, jwt.sign(pay, "SECRETCHANGETHISLATER", options));
        }
    }
    ], done);
};
