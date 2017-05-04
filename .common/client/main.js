const fs = require('fs');
const assert = require('assert');
const readline = require('readline-sync');
const keypair = require('keypair');
const scrypt = require('scrypt');
const crypto = require('crypto');
//const https = require('https');
const querystring = require('querystring');
const request = require('request');

const LOGOUT = false;

let privkey = null;
let pubkey = null;
let contacts = null;
/*Config File Format
{
    "identities" : [
        {
            "private" : "RSA_PRIVATE_KEY1",
            "public"  : "RSA_PUBLIC_KEY1",
            "contacts": [
                "FOREIGN_RSA_PUBLIC_KEY1",
                "FOREIGN_RSA_PUBLIC_KEY2",
                ...
            ]
        },
        {
            "private" : "RSA_PRIVATE_KEY2",
            "public"  : "RSA_PUBLIC_KEY2"
            "contacts": []
        },
        ...
    ]
}
*/
const cfg = "identity.cfg";
console.clear = function () { process.stdout.write('\u001B[2J\u001B[0;0f'); }

function LoadIdentity() {
    let buf = fs.readFileSync(cfg);
    let data = JSON.parse(buf);
    if (Array.isArray(data.identities))
        return data;
    else {
        console.log("Ignoring " + cfg + " because it is either invalid or empty.");
        return { identities: [] };
    }
}

function StoreIdentity(data) {
    assert(Array.isArray(data.identities), "identities should be an Array");

    let priv = data.identities[0].private;
    let pub = data.identities[0].public;
    assert((typeof priv === 'string') && (typeof pub === 'string'), "An identity should be a pair of strings");

    let buf = JSON.stringify(data);
    fs.writeFileSync(cfg, buf);
}

function SelectIdentity(data) {
    if (data.identities.length === 1)
        return data.identities[0];
    else {
        console.log("Identities found:");
        for (var identity in Object.keys(data.identities)) {
            console.log(identity + ": " + data.identities[identity].alias)
        }

        let ans = readline.question("Select one: ");
        return data.identities[ans];
    }
}

function CreateIdentity(data) {
    let pair = keypair({ bits: 2048 });
    pair.contacts = [];
    //updates data using the obj reference
    //technically this is a very bad side effect
    pair.alias = readline.question("What is your alias?");
    data.identities.push(pair);
    return pair;
}

function RegisterIdentity(data) {
    pair = CreateIdentity(data);
    privkey = pair.private;
    pubkey = pair.public;
    contacts = pair.contacts;
    
    password = readline.question("Input password for registration: ");
    //do register stuff...

    let salt = crypto.randomBytes(20);
    let params = scrypt.paramsSync(0.1);
    //let hash = scrypt.hashSync(password, params, 64, salt);
    let hash = scrypt.hashSync(password, { "N": 16, "r": 1, "p": 1 }, 64, salt);
    let info = {
        "identity" : pubkey,
        "hash" : hash.toString("base64"),
        "salt" : salt.toString("base64")
    };

    postBody = querystring.stringify(info);

    let options = {
        url: 'https://api.watchmyass.webcam/register',
        method: 'POST',
        header: {
            "Content-Type": "application/json",
            "Content-Length": postBody.length
        },
        body: info
    };

    let postreq = request(options, (err, res, body) => {
        console.log(JSON.stringify(err));
        console.log(JSON.stringify(res));
        console.log(JSON.stringify(body));
    }).on('response', (res) => {

        console.log(JSON.stringify(res));
    });
}

function LoginIdentity(data) {
    pair = SelectIdentity(data);
    privkey = pair.private;
    pubkey = pair.public;
    contacts = pair.contacts;

    password = readline.question("Input login password: ");

    //do login stuff...
    
    
    JWT = {}

    return JWT;
}

function AddContact(JWT) {
    console.clear();
    console.log("Add a Contact:")
    let alias = readline.question("Contact alias: ")
    let pub = readline.question("Contact public key: ")
    //also updates data using the contacts obj reference
    //technically this is a very bad side effect
    contacts.push({
        "public": pub,
        "alias": alias
    });
}

function SelectConversation(JWT) {
    console.clear();
    console.log("List of Conversations:");
    for (var i = 0; i < contacts.length; i++) {
        console.log(i + ": " + contacts[i].alias);
    }
    let ans = readline.question("Select one: ");
    //figure out the rest
}

function LoginMenu(data) {
    console.clear();
    let JWT = null;
    if (data.identities.length === 0) {
        ans = "0";
    } else {
        console.log("List of Actions: ")
        console.log("0: Register a new identity");
        console.log("1: Login with an existing identity");
        ans = readline.question("Select one: ");
    }
    switch (ans) {
        case "0":
            RegisterIdentity(data);
            JWT = LoginIdentity(data);
            break;
        case "1":
            JWT = LoginIdentity(data);
            break;
    }
    return JWT;
}

function MainMenu(JWT) {
    console.clear();
    let ans = null
    if (contacts.length === 0) {
        ans = "0";
    } else {
        console.log("List of Actions:");
        console.log("0: Add a Contact");
        console.log("1: Select a Conversation")
        console.log("2: Logout")
        ans = readline.question("Select one: ");
    }
    switch (ans) {
        case "0":
            AddContact(JWT);
            break;
        case "1":
            SelectConversation(JWT);
            break;
        case "2":
            return LOGOUT;
    }
    return true;
}

function main() {
    let data = LoadIdentity();
    while (true) {
        let JWT = LoginMenu(data);
        let result = null;
        do {
            result = MainMenu(JWT);
        } while (result !== LOGOUT);
    }
}

main();