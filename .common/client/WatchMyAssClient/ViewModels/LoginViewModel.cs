using GalaSoft.MvvmLight.Command;
using System;
using WatchMyAssClient.Models;
using WatchMyAssClient.Views;
using Windows.UI.Xaml.Controls;

namespace WatchMyAssClient.ViewModels
{
    public class LoginViewModel
    {
        public LoginViewModel() { }

        public string Username { get; set; }
        public string Password { get; set; }

        private RelayCommand<Page> _loginCommand;
        public RelayCommand<Page> LoginCommand => _loginCommand ??
            (_loginCommand = new RelayCommand<Page>(async (page) =>
            {
                var userData = new ModelLocator().User;
                if (await userData.Login(Username, Password))
                    page.Frame.Navigate(typeof(MainPage));
                else
                    page.Frame.Navigate(typeof(Login));
            }));

        private RelayCommand<Page> _registerNavigation;
        public RelayCommand<Page> RegisterNavigation => _registerNavigation ??
            (_registerNavigation = new RelayCommand<Page>((page) => {
                page.Frame.Navigate(typeof(Register), null);
            }));
    }
}
