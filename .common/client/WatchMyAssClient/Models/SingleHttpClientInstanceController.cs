using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace WatchMyAssClient.Models
{
    class SingleHttpClientInstanceController
    {
        private static readonly HttpClient client;

        static SingleHttpClientInstanceController()
        {
            client = new HttpClient();
        }

        public async Task<HttpResponseMessage> SendRegistrationInfo(string body) =>
            await SendAPICall(body, "register");

        public async Task<HttpResponseMessage> PostChallenge(string body) =>
            await SendAPICall(body, "challenge");

        public async Task<HttpResponseMessage> PostAuthenticate(string body) =>
            await SendAPICall(body, "authenticate");

        private async Task<HttpResponseMessage> SendAPICall(string body, string endpoint)
        {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, $"https://api.watchmyass.webcam/{endpoint}")
            {
                Content = new StringContent(body, Encoding.ASCII, "application/json")
            };
            return await client.SendAsync(request);
        }
    }
}
