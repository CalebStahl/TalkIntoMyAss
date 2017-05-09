using GalaSoft.MvvmLight.Ioc;
using Microsoft.Practices.ServiceLocation;
using System.Net.Http;

namespace WatchMyAssClient.Models
{
    public class ModelLocator
    {/// <summary>
     /// Initializes a new instance of the ModelLocator class.
     /// </summary>
        static ModelLocator()
        {
            ServiceLocator.SetLocatorProvider(() => SimpleIoc.Default);
            SimpleIoc.Default.Register<User>();
        }

        public User User =>
            ServiceLocator.Current.GetInstance<User>();
        
        public static void Cleanup()
        {
            // TODO Clear the ViewModels
        }
    }
}
