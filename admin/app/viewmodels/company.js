define(['services/binDatacontext', 'plugins/router',
    'durandal/system', 'services/logger', 'models/binModels', 'config', 'durandal/app'],
    function (datacontext, router, system, logger, models, config,app) {

        var model = ko.observable();
        var title = "Company Details";
        var self = this;
        //Run when viewmodel is called
        var activate = function (id) {
if (id === "0") {
                title = "New Company";
                // return datacontext.createCompany(onRetrieve, true);
                return model(new models.CompanyModel());
            }
            else
                return datacontext.getCompanyById(id, onRetrieve);
        };

        var onRetrieve = function (data, error) {
            if (error === false) {
                model(new models.CompanyModel(data));
            }
        };

  var create = function () {
            return datacontext.createCompany(model, onCreate, true);
        }
      
        //Run when navigating to another view
       var cancel = function () {
           router.navigateBack();
       };

        //Run when navigating to another view
        var deactivate = function () {
            return model();
        };


       


        var vm = {
            activate: activate,
            deactivate: deactivate,
            model: model,
            cancel: cancel,
            title: title,
           
            
        };

        return vm;
    });