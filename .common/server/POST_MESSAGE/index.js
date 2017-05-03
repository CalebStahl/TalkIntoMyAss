'use strict';
console.log('Loading function');
const AWS = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const encrypted = process.env['jwt_secret'];
let decrypted;

function generateJWT(event, context, callback){
    let params =
        {
            RequestItems: {
                "Users" : {
                    Keys: [
                        { "public_identity_key": event.initiator_public_identity_key },
                        { "public_identity_key": event.recipient_public_identity_key }
                    ]
                }
            }
        };
    dynamo.batchGetItem(params, function(err, data) {
        if (err)
            return callback(err); // an error occurred
        console.log(data.Responses.Users); //verified exists
        
        let options = 
        {
            algorithm : "HS256",
            header    : "JWT",
            issuer    : "watchmyass.webcam",
            audience  : "watchmyass.webcam",
            subject   : "User Identity Key",
            maxAge    : "1d"
        }
        
        let decoded = jwt.verify(event.JWT, decrypted, options, function(err, data) {
            if(err)
                return callback(err);
            
            //TODO: actually send the message
            console.log(data, null, 2);
            return callback(null, "Message Sent")
        });
    });
}

/**
 * Provide an event that contains the following keys:
 *   - public_identity_key : user identifier
 */
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    if(decrypted) {
        generateJWT(event, context, function(err, data) {
            if(err) callback(err);
            else callback(null, data);
        })
    } else {
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer(encrypted, 'base64') }, function(err, data) {
            if (err) {
                console.log('Decrypt error:', err);
                return callback(err);
            }
            decrypted = data.Plaintext.toString('ascii'); 
            generateJWT(event, context, function(err, data) {
                if(err) callback(err);
                else callback(null, data);
            })
        });
    }
};