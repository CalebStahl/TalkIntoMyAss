using System;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using WatchMyAssClient.Models;
using WatchMyAssClient.Views;
using Windows.Storage;
using Windows.UI.Xaml.Controls;

namespace WatchMyAssClient.ViewModels
{
    public class RegisterViewModel : ViewModelBase
    {
        public string Username { get; set; }
        public string Password { get; set; }

        private StorageFile _file;
        public StorageFile File {
            get { return _file; }
            set
            {
                _file = value;
                RaisePropertyChanged("File");
                RegisterCommand.RaiseCanExecuteChanged();
            }
        }

        private RelayCommand<Page> _registerCommand;
        public RelayCommand<Page> RegisterCommand => _registerCommand ??
            (_registerCommand = new RelayCommand<Page>(async (page) =>
            {
                var userData = new ModelLocator().User;
                if(await userData.Register(Username, Password, File))
                    page.Frame.Navigate(typeof(Login), null);
                else
                    page.Frame.Navigate(typeof(Register),null);
            }, (page) => { return File != null; }));

        private RelayCommand _openFileCommand;
        public RelayCommand OpenFileCommand => _openFileCommand ??
            (_openFileCommand = new RelayCommand(async () =>
            {
                var picker = new Windows.Storage.Pickers.FileOpenPicker()
                {
                    ViewMode = Windows.Storage.Pickers.PickerViewMode.List
                };
                picker.FileTypeFilter.Add(".pem");
                picker.FileTypeFilter.Add(".ppk");
                File = await picker.PickSingleFileAsync();
            }));
    }
}
