'use strict';
console.log('Loading function');
const AWS = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const encrypted = process.env['jwt_secret'];
var decrypted;

function generateJWT(event, context, callback){
    let params = {
                    Key: {
                        "public_identity_key":  event.public_identity_key
                    }, 
                    TableName: "Users"
                 };
    dynamo.getItem(params, function(err, data) {
        if (err) return callback(err);
        console.log(data);           // successful response
        
        var iat = new Date();
        var exp = iat + 1;
        var nbf = iat;
        
        var pay =
            {
                "userik":  event.public_identity_key,
                
            }
        var options = 
            {
                algorithm : "HS256",
                header    : "JWT",
                issuer    : "watchmyass.webcam",
                audience  : "watchmyass.webcam",
                subject   : "User Identity Key",
                expiresIn : "1d",
                notBefore : "0"
            }
        
        callback(null, jwt.sign(pay, decrypted, options));
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