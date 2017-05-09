'use strict';
console.log('Loading function');
const AWS = require('aws-sdk');
const doc = require('dynamodb-doc');
const crypto = require('crypto');
const async = require('async');
const dynamo = new doc.DynamoDB();
const CHALLENGE_LENGTH = 20;

exports.handler = (event, context, callback) => {
    console.log(event);
    if (event.username === null)
        return callback('Username missing.');
    if (event.challenge === null)
        return callback('Challenge missing.');

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

    let serverchallenge = crypto.randomBytes(CHALLENGE_LENGTH).toString('base64');
    let challengeParams =
        {
            Item:
            {
                "challenge": event.challenge + serverchallenge,
                "username" : event.username,
                "timestamp": Date.now()
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: "Challenges",
            ConditionExpression: "attribute_not_exists(challenge)"
        };
    let saltParams =
        {
            Key:
            {
                "username": event.username
            },
            TableName: "Users"
        };
    async.parallel({
        challenge: (callback) => {
            dynamo.putItem(challengeParams, (err, data) => {
                if (err) return callback(err);
                return callback(null, challengeParams.Item.challenge);
            })
        },
        salt: (callback) => {
            dynamo.getItem(saltParams, (err, data) => {
                if (err) return callback(err);
                console.log(JSON.stringify(data, 2));
                return callback(null, data.Item.salt);
            });
        }
    }, done);
};
