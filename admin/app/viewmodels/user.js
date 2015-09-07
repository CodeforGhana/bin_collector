define(['services/binDatacontext', 'plugins/router',
    'durandal/system', 'services/logger', 'models/binModels', 'config', 'durandal/app'],
    function (datacontext,router, system, logger,models,config,app) {

        var model = ko.observable();
        var title = ko.observable("User Details");
        var self = this;
        var newUser = ko.observable(false);


        //Run when viewmodel is called
        var activate = function (id) {
            if (id === "0") {
                //create new Person model
                title("New User");
                //return datacontext.createPlayer(onRetrieve, true);
                newUser(true);
                return model(new models.RegisterModel());
            }
            else 
            return datacontext.getUserById(id, onRetrieve, true);

        };

        var onRetrieve = function (data, error) {
            if (error === false) {
                model(new models.UserModel(data));
            }
        };
//Run when navigating to another view
        var create = function () {
            p=model().password();
            c=model().confirmPassword()
            if(p===c)
            return datacontext.RegisterUser(model, onCreate, true);
        else logger.log('The two passwords do not match', null, title, true);
        };

        var save = function () {
            return datacontext.updateUser(model, onSave, true);
        };

        var onSave = function (data, error) {
            if (error === false) {
                logger.log('User Saved', null, title, true);
                var url = '#/users';
                router.navigate(url);
            }
            if (error === true) {
                logger.log('User Could Not Be Saved, Please Try Again', null, title, true);
            }
        };

var onCreate = function (data, error) {
            if (data.status === 1) {
               
                newUser(false);
                logger.log('User Saved', null, title, true);
                var url = '#/users';
                router.navigate(url);
            }
            else {
                logger.log('User Not Created, Please Try Again', null, title, true);
            }
        };
        //Run when navigating to another view
        var cancel = function () {
            newUser(false);
           router.navigateBack();
       };

        //Run when navigating to another view
        var deactivate = function () {
            return model();
        };

        var attached = function (view) {
            $("#datepicker").datepicker({ format: 'mm-dd-yyyy' });

        };

        var vm = {
            activate: activate,
            deactivate: deactivate,
            attached: attached,
            model: model,
            save:save,
            create:create,
            newUser:newUser,
            cancel: cancel,
            title: title
        };

        return vm;
    });
