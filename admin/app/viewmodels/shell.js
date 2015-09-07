define(['durandal/system', 'plugins/router', 'services/logger','durandal/app','models/binModels'],
    function (system, router, logger,app,models) {


        var isLoggedIn = ko.observable(false);
        
        var currentUser=new models.UserModel();
        var registerShelters = function () {

            app.on('onLogin').then(function (success) {
                if (success === true) {
                    isLoggedIn(true);
                    boot();
                    //router.navigate('home');
                }
            });

            app.on('busy').then(function (isBusy) {
                if (isBusy === true) {
                    box1 = new ajaxLoader($(".box-1"));
                } else {
                    if (box1) box1.remove();
                }

            });

        };

        var logout = function () {
            app.setRoot('viewmodels/login');
        };


        //#region Internal Methods
        function activate() {

            return boot();
        }



        function boot() {
            registerShelters();
            log('bin Admin Loaded!', null, true);

            router.on('router:route:not-found', function (fragment) {
                logError('No Route Found', fragment, true);
            });

            var routes = [
                { route: 'login', moduleId: 'login', title: 'Login' },
                
                { route: '', moduleId: 'home', title: 'Home', nav: true},
               
            { route: 'users', moduleId: 'users', title: 'Users', nav: true },

            { route: 'companies', moduleId: 'companies', title: 'Companies', nav: true },

           
            { route: 'user/:id', moduleId: 'user', title: 'User' },
            { route: 'company/:id', moduleId: 'company', title: 'Company' }];

            router.makeRelative({ moduleId: 'viewmodels' }) // router will look here for viewmodels by convention
                .map(routes)            // Map the routes
                .buildNavigationModel() // Finds all nav routes and readies them
                .activate();        // Activate the router

            return true;

        }

        function log(msg, data, showToast) {
            logger.log(msg, data, system.getModuleId(shell), showToast);
        }

        function logError(msg, data, showToast) {
            logger.logError(msg, data, system.getModuleId(shell), showToast);
        }
        //#endregion

        var shell = {
            activate: activate,
            router: router,
            isLoggedIn: isLoggedIn,
            logout: logout,
            currentUser: currentUser            
        };

        return shell;
    });