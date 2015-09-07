define(['durandal/system', 'services/binDatacontext'],
    function (system, datacontext) {

        var email = ko.observable("selom.banybah@gmail.com");
        var password = ko.observable("admin123");

        var cancel = function () {

        };

        var callLogin = function () {
            app.trigger('busy', true);
            datacontext.Login(email, password, onOk, onFail);

        };

        var onOk = function (result) {
            app.trigger('busy', false);
            if (result.success === true) {
                shell.isLoggedIn(true);
                app.trigger('onLogin', true);
                app.trigger('busy', false);
                router.navigate('#/dashboard', { replace: true });
            } else {
                console.log("error");
            }
        };
        var onFail = function (data) {
            console.log('wrong credentials');
        };
        var ok = function () {

            return true;
        };


        var vm = {
            email: email,
            password: password,
            cancel: cancel,
            ok: ok,
            title: 'Login'
        };

        return vm;
    });
