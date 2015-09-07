define(['durandal/system', 'services/binDatacontext', 'durandal/app', 'viewmodels/shell', 'plugins/router', 'services/logger','models/binModels'],
    function (system,datacontext,app,shell,router,logger,models) {

        var phone = ko.observable('');
        var password = ko.observable();
        var name = ko.observable();

        var cancel = function () {

        };

        var callLogin = function () {
            app.trigger('busy', true);
            datacontext.Login(phone, password, onOk, onFail);

        };

        var onOk = function (result) {
            app.trigger('busy', false);
            if (result.error === false) {
                phone('');
                password('');
                name('');

                router.reset();
                router.deactivate();
                app.setRoot('viewmodels/shell');
                shell.isLoggedIn(true);
                shell.currentUser=new models.UserModel();

                shell.currentUser.name=result.name;
                shell.currentUser.apikey=result.apikey;
                shell.currentUser.phone=result.phone;
                shell.currentUser.createdat=result.createdat;
                window.apikey = result.apikey;
                app.trigger('onLogin', true);
                app.trigger('busy', false);
            } else {
                //console.log("Something went wrong, please contact administrator");
                logError("Access denied, please contact Administrator", null, true);
            }
        };
        var onFail = function (data) {
            console.log('wrong credentials');
            logError("Wrong credentials! Please contact Administrator or try again", null, true);
        };
        var ok = function () {
            //app.setRoot('viewmodels/shell');
            //shell.isLoggedIn(true);
            //app.trigger('onLogin', true);
            //app.trigger('busy', false);
            //router.navigate('home');
            
            callLogin();
            //return true;
        };

        var onRegister = function (data) {
            alert(data);
        };

        var onRegisterFail = function (data) {
            alert(data);
        };

        var register = function () {
            app.trigger('busy', true);
            datacontext.RegisterUser(name, phone, password, onRegister, onRegisterFail);
        };

        function log(msg, data, showToast) {
            logger.log(msg, data, system.getModuleId(shell), showToast);
        }
        function logError(msg, data, showToast) {
            logger.logError(msg, data, system.getModuleId(shell), showToast);
        }
        var vm = {
            phone: phone,
            password: password,
            cancel: cancel,
            ok: ok,
            title: 'Login',
            register: register
        };

        return vm;
    });
