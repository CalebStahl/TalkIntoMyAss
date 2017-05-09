using GalaSoft.MvvmLight.Ioc;
using Microsoft.Practices.ServiceLocation;

namespace WatchMyAssClient.ViewModels
{
    public class ViewModelLocator
    {/// <summary>
     /// Initializes a new instance of the ViewModelLocator class.
     /// </summary>
        static ViewModelLocator()
        {
            ServiceLocator.SetLocatorProvider(() => SimpleIoc.Default);

            ////if (ViewModelBase.IsInDesignModeStatic)
            ////{
            ////    // Create design time view services and models
            ////    SimpleIoc.Default.Register<IDataService, DesignDataService>();
            ////}
            ////else
            ////{
            ////    // Create run time view services and models
            ////    SimpleIoc.Default.Register<IDataService, DataService>();
            ////}
            
        }

        public MainViewModel Main
        {
            get
            {
                SimpleIoc.Default.Unregister<MainViewModel>();
                SimpleIoc.Default.Register<MainViewModel>();
                return ServiceLocator.Current.GetInstance<MainViewModel>();
            }
        }

        public RegisterViewModel Register
        {
            get
            {
                SimpleIoc.Default.Unregister<RegisterViewModel>();
                SimpleIoc.Default.Register<RegisterViewModel>();
                return ServiceLocator.Current.GetInstance<RegisterViewModel>();
            }
        }
    public LoginViewModel Login
        {
            get
            {
                SimpleIoc.Default.Unregister<LoginViewModel>();
                SimpleIoc.Default.Register<LoginViewModel>();
                return ServiceLocator.Current.GetInstance<LoginViewModel>();
            }
        }

        public static void Cleanup()
        {
            // TODO Clear the ViewModels
        }
    }
}
