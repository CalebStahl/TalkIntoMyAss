const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const keyPath = 'C:/Users/SDS Clinical Trials/rsa-2048bit-key-pair.pem';

function encrypt(message, keyPath){
	var absolutePath = path.resolve(keyPath);
	var privateKey = fs.readFileSync(absolutePath, "utf8");
	var buffer = new Buffer(message);

	var ivKey = crypto.randomBytes(16);
	var aesKey = crypto.randomBytes(32);
	var hmacKey = crypto.randomBytes(32);

	//AES with IV
	var aes = crypto.createCipheriv('aes-256-cbc', aesKey, ivKey);
	var cipherText = aes.update(buffer, 'utf8', 'hex');
	cipherText += aes.final('hex');
	//HMAC Tag
	const hmac = crypto.createHmac('sha256', hmacKey);
	hmac.update(cipherText);

	return {
		rsaCipher : crypto.publicEncrypt(privateKey, Buffer.concat([ivKey, aesKey, hmacKey]), crypto.constants.RSA_PKCS1_OAEP_PADDING).toString('hex'),
		aesCipher : cipherText,
		hmacTag : hmac.digest('hex')
	};
}

//message format {rsaCipher, aesCipher, hmacTag}
function decrypt(message, keyPath){
	if(!"rsaCipher" in message)
		return {err : "RSA cipher-text missing."};
	if(!"aesCipher" in message)
		return {err : "AES cipher-text missing."};
	if(!"hmacTag" in message)
		return {err : "HMAC Tag missing."};

	var absolutePath = path.resolve(keyPath);
	var privateKey = fs.readFileSync(absolutePath, "utf8");

	//Get keys
	var buf = Buffer.from(message["rsaCipher"], 'hex');
	var plainText = crypto.privateDecrypt({key : privateKey, padding : crypto.constants.RSA_PKCS1_OAEP_PADDING}, buf);
	
	if(plainText.length != 80)
		return {err: "Key length is wrong."};
	var ivKey   = plainText.slice(0, 16);
	var aesKey  = plainText.slice(16, 48);
	var hmacKey = plainText.slice(48);

	//hmac authentication
	buf = Buffer.from(message["hmacTag"], 'hex');
	const hmac = crypto.createHmac('sha256', hmacKey);
	hmac.update(message["aesCipher"]);
	if(!buf.equals(hmac.digest()))
		return {err: "HMAC authentication failed."};

	//message decrypt
	buf = Buffer.from(message["aesCipher"],'hex');
	var aes = crypto.createDecipheriv('aes-256-cbc', aesKey, ivKey);
	plainText = aes.update(buf, null, 'utf8');
	plainText += aes.final('utf8');

	return {plainText : plainText};
}

var obj = encrypt("install gentoo", keyPath)
console.log(obj)
console.log(decrypt(obj, keyPath))