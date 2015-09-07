// Maps the files so Durandal knows where to find these.

requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'durandal':'../lib/durandal/js',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',

        'bootstrap': '../lib/bootstrap/js/bootstrap',
        'viewmodel': '../lib/custom-libs/knockout.viewmodel'
    },
    shim: {
        'viewmodel': {
            deps: ['knockout']
        },
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
       }
    }
});
// Durandal 2.x assumes no global libraries. It will ship expecting
// Knockout and jQuery to be defined with requirejs. .NET
// templates by default will set them up as standard script
// libs and then register them with require as follows:
define('jquery', function () { return jQuery; });
define('knockout', ko);

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'plugins/router', 'services/logger'], boot);

function boot (app, viewLocator, system, router, logger) {

    // Enable debug message to show in the console
    system.debug(true);

    app.title = 'Admin';

    app.configurePlugins({
        router: true,
        dialog: true,
        widget:true,
        widget: {
            kinds: ['durandalgrid']
        }
    });

    app.start().then(function () {
        //widget.registerKind('durandalgrid');
        toastr.options.positionClass = 'toast-bottom-right';
        toastr.options.backgroundpositionClass = 'toast-bottom-right';

        // When finding a viewmodel module, replace the viewmodel string
        // with view to find it partner view.
        // [viewmodel]s/sessions --> [view]s/sessions.html
        // Defaults to viewmodels/views/views.
        // Otherwise you can pass paths for modules, views, partials
        viewLocator.useConvention();

        //Show the app by setting the root view model for our application.
        //app.setRoot('viewmodels/shell', 'entrance');
        app.setRoot('viewmodels/login');
    });
}