'use strict';
console.log('Loading function');
const AWS = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

exports.handler = (event, context, callback) => {
    console.log(event, null, 2);
    if(event.identity === null)
        return callback('Identity missing.');
    if(event.hash === null)
        return callback('Hash missing.');
        
    let params =
        {
            Item : 
            {   
                "identity_key": event.identity,
                "hash": event.hash
            }, 
            ReturnConsumedCapacity : "TOTAL", 
            TableName : "Users",
            ConditionExpression : "attribute_not_exists(identity_key)"
        };

    dynamo.putItem(params, function(err, data) {
        if(err) return callback(err, err.stack);
        return callback(null, "Identity Registered.")
    });
};