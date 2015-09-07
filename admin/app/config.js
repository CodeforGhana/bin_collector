define(function () {
    toastr.options.timeOut = 2000;
    toastr.options.positionClass = 'toast-bottom-right';


    // var apiUrl = "http://binflufinder-dev.c4asolution.com/api/v1/";
var apiUrl = "../api/v1/";
    
    var companiesService = apiUrl + 'companies';
    var alertService = apiUrl + 'alerts';

    var userService = apiUrl + 'users';
    
    var uploadService=apiUrl+'upload/upload/files';

    
    var appTitle = 'Admin';

    var activate = function () {
        console.log('activate');
    };



    //var startModule = 'login';

    return {
        appTitle: appTitle,
        debugEnabled: ko.observable(true),
        activate: activate,
        apiUrl: apiUrl,
        companiesService: companiesService,
        alertService: alertService,
        userService: userService,
        uploadService:uploadService
        
    };

    //#region Sub

    //#endregion


});