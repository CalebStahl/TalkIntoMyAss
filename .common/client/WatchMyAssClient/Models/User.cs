using Newtonsoft.Json;
using BCrypt.Net;
using System;
using Windows.Security.Cryptography.Core;
using Windows.Security.Cryptography;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Windows.Storage;
using Windows.Storage.Streams;
using System.Text.RegularExpressions;
using Windows.Security.Credentials;

namespace WatchMyAssClient.Models
{
    public class User
    {
        private const int CHALLENGE_LENGTH = 20;
        public string username;
        public CryptographicKey rsaKey;
        public string jwt;

        //run this after logging in
        public async void ReadData()
        {
            //read config file
            StorageFolder folder = ApplicationData.Current.LocalFolder;
            StorageFile file = await folder.GetFileAsync("UserData.cfg");
            string body = await FileIO.ReadTextAsync(file);
            JObject info = JsonConvert.DeserializeObject(body) as JObject;
            //if the config file is malformed, throw it out
            //if the username doesn't match the key, don't load it.
            //TODO: support multiple usernames
            if (info == null || this.username != info.First.Value<string>())
                return;
            
            string priv = info.First.Next.Value<string>();
            var keyBuffer = CryptographicBuffer.DecodeFromBase64String(priv);
            var crypto = AsymmetricKeyAlgorithmProvider.OpenAlgorithm(AsymmetricAlgorithmNames.RsaOaepSha256);
            rsaKey = crypto.ImportKeyPair(keyBuffer, CryptographicPrivateKeyBlobType.Pkcs1RsaPrivateKey);
        }

        public async void StoreData()
        {
            //generate user data
            CryptographicBuffer.CopyToByteArray(rsaKey.Export(CryptographicPrivateKeyBlobType.Pkcs1RsaPrivateKey), out byte[] keybuf);
            string priv = Convert.ToBase64String(keybuf);
            var info = new UserInfo()
            {
                username = username,
                privkey = priv
            };
            string body = JsonConvert.SerializeObject(info);

            //store user registration information
            StorageFolder folder = ApplicationData.Current.LocalFolder;
            StorageFile file = await folder.CreateFileAsync("UserData.cfg");
            await FileIO.WriteTextAsync(file, body);
        }

        public async Task<bool> Register(string username, string password, StorageFile file)
        {
            this.username = username;

            //generate/read 2048-bit RSA key pair
            string privkey = await FileIO.ReadTextAsync(file);
            privkey = Regex.Replace(privkey, "(-+[\\w\\s]+-+)|(\n)", "");
            var keyBuffer = CryptographicBuffer.DecodeFromBase64String(privkey);
            var crypto = AsymmetricKeyAlgorithmProvider.OpenAlgorithm(AsymmetricAlgorithmNames.RsaOaepSha256);
            //rsaKey = crypto.CreateKeyPair(2048);
            rsaKey = crypto.ImportKeyPair(keyBuffer, CryptographicPrivateKeyBlobType.Pkcs1RsaPrivateKey);
            CryptographicBuffer.CopyToByteArray(rsaKey.ExportPublicKey(CryptographicPublicKeyBlobType.Pkcs1RsaPublicKey), out byte[] keybuf);
            string pubkey = Convert.ToBase64String(keybuf);

            //generate hash from password
            string salt = BCrypt.Net.BCrypt.GenerateSalt(10);
            string hash = BCrypt.Net.BCrypt.HashPassword(password, salt);

            //generate JSON POST body
            var info = new RegistrationInfo()
            {
                username = username,
                hash = hash,
                salt = salt,
                key = pubkey
            };
            string body = JsonConvert.SerializeObject(info);

            //send and handle POST_REGISTER request
            var client = new SingleHttpClientInstanceController();
            var response = await client.SendRegistrationInfo(body);
            var outbuf = await response.Content.ReadAsStringAsync();
            dynamic output = JsonConvert.DeserializeObject(outbuf);
            if(output.message == null)
            {
                return false;
            } else
            {
                //StoreData();
                return true;
            }
        }

        public async Task<bool> Login(string username, string password)
        {
            //generate post_challenge request body
            var challenge = CryptographicBuffer.GenerateRandom(CHALLENGE_LENGTH);
            CryptographicBuffer.CopyToByteArray(challenge, out byte[] chalbuf);
            var info = new ChallengeInfo()
            {
                username = username,
                challenge = Convert.ToBase64String(chalbuf)
            };
            string body = JsonConvert.SerializeObject(info);

            //send and handle POST_CHALLENGE request
            var client = new SingleHttpClientInstanceController();
            var postres = await client.PostChallenge(body);
            var outbuf = await postres.Content.ReadAsStringAsync();
            dynamic output = JsonConvert.DeserializeObject(outbuf);
            if(output.statusCode.Equals("400"))
                return false; //handle error

            //h(sc, cc, h(pass, salt))
            string salt = output.body.salt;
            string serverchallenge = output.body.challenge;
            string hash = BCrypt.Net.BCrypt.HashPassword(password, salt);                       
            var sha = HashAlgorithmProvider.OpenAlgorithm(HashAlgorithmNames.Sha256).CreateHash();
            sha.Append(CryptographicBuffer.DecodeFromBase64String(serverchallenge));
            sha.Append(CryptographicBuffer.ConvertStringToBinary(hash, BinaryStringEncoding.Utf8));
            string response = CryptographicBuffer.EncodeToBase64String(sha.GetValueAndReset());
            var info2 = new ResponseInfo()
            {
                username = username,
                challenge = serverchallenge,
                response = response
            };
            body = JsonConvert.SerializeObject(info2);

            //send and handle POST_AUTHENTICATE request
            postres = await client.PostAuthenticate(body);
            outbuf = await postres.Content.ReadAsStringAsync();
            dynamic output2 = JsonConvert.DeserializeObject(outbuf);
            if (output2.statusCode.Equals("400"))
                return false; //handle error
            this.username = username;
            jwt = (string) output2.body;
            return true;
        }

        private class RegistrationInfo
        {
            public string username;
            public string hash;
            public string salt;
            public string key;
        }
        private class ChallengeInfo
        {
            public string username;
            public string challenge;
        }
        private class ResponseInfo
        {
            public string username;
            public string challenge;
            public string response;
        }
        private class UserInfo
        {
            public string username;
            public string privkey;
        }
    }
}
