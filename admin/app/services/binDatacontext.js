define([
    'durandal/system',
    'durandal/app',
    'config',
    'services/logger', 'viewmodels/shell'],
    function (system, app, config, logger,shell) {

        var dynamicSort=function (property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        }

//region upload
var uploadFile=function(file,folder,onRetrieve){
    var url = config.uploadService+"/"+folder;
    var frmData=new FormData();
    frmData.append("fileToUpload",file);
    frmData.append("folder",folder);
    return $.ajax({
        url: url,
        type:"POST",
        contentType: false,
        data: frmData,
        processData:false,
        cache:false,
        timeout:600000,
        success: function (data) {
            onRetrieve(data, false);
        },
        error: function (data) {
            onRetrieve(data, true);
        }
    });
};

//region Companies
var getCompanies = function (onRetrieve) {
    var url = config.companiesService;
    return $.ajax({
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            //data.results.sort(dynamicSort("name"));
            onRetrieve(data, false);
        },
        error: function (data) {
            onRetrieve(data, true);
        }
    });
};

var getCompanyById = function (id, onRetrieve) {
    var url = config.companiesService + '/' + id;
    return $.ajax({
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            onRetrieve(data, false);
        },
        error: function (data) {
            onRetrieve(data, true);
        }
    });
};

var deleteCompany = function (id, onComplete) {
    var url = config.companiesService;
            //console.log(token);
            $.ajax({
                url: url+'/'+id,
                type: 'DELETE',
                contentType: 'application/json',
                dataType: 'json',
                success: function (result) {
                    onComplete(result, false);
                },
                error: function (result) {
                    onComplete(result, true);
                }
            });

        };

var createCompany = function (data, onComplete) {
            var url = config.companiesService;
            var company = {
                "name": ""
            };
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(company),
                success: function (result) {
                    onComplete(result, false);
                },
                error: function (result) {
                    onComplete(result, true);
                }
            });

        };
        //#endregion
        

        //#region Users
        var getUsers = function (onRetrieve) {
            var url = config.userService;
            return $.ajax({
                url: url,
                contentType: 'application/json',
                dataType: 'json',
                success: function (data) {
                    onRetrieve(data.results, false);
                },
                error: function (data) {
                    onRetrieve(data, true);
                }
            });
        };

        var searchUsers = function (searchText,onRetrieve) {
            var url = config.userService+"/search/"+searchText;
            return $.ajax({
                url: url,
                contentType: 'application/json',
                dataType: 'json',
                success: function (data) {
                    onRetrieve(data, false);
                },
                error: function (data) {
                    onRetrieve(data, true);
                }
            });
        };

        var updateUser = function (data, onComplete) {
            var url = config.userService;

            var user = {
             email : data().email(),
             _id: data().id()
         };
            //console.log(token);
            $.ajax({
                url: url + '/' + user._id,
                type: 'PUT',
                contentType: 'application/json',
                dataType: 'json',
                processData: false,
                data: JSON.stringify(user),
                success: function (result) {
                    onComplete(result, false);
                },
                error: function (result) {
                    onComplete(result, true);
                }
            });

        };

        var getUserById = function (id, onRetrieve) {
            var url = config.userService + '/' + id;
            return $.ajax({
                url: url,
                contentType: 'application/json',
                dataType: 'json',
                success: function (data) {
                    onRetrieve(data, false);
                },
                error: function (data) {
                    onRetrieve(data, true);
                }
            });
        };
        //#endregion


        var Login = function (username, password, successCallback, failureCallback) {

            var loginForm = '{ "phone": "'+username()+'", "password": "'+password()+'" }';
            //console.log(loginForm);
            var url = config.apiUrl+"login";
            $.ajax({
                url: url,
                data: loginForm,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
            }).then(function (result) {
                successCallback(result);
            },
            function (data) {
                failureCallback(data);
            });

        };

        var RegisterUser = function (model, successCallback, failureCallback) {

            var registerForm = '{"phone":"'+model().phone()+'", "name":"' + model().name() + '", "password":"' + model().password() + '"}';
            //console.log(loginForm);
            var url = config.apiUrl+"/register";
            $.ajax({
                url: url,
                data: registerForm,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
            }).then(function (result) {
                successCallback(result);
            },
            function (data) {
                failureCallback(data);
            });

        };


    var dataContext = {

        getCompanies:getCompanies,
        getCompanyById:getCompanyById,

        deleteCompany:deleteCompany,

      
        getUsers:getUsers,
        searchUsers:searchUsers,
        updateUser:updateUser,
        getUserById:getUserById,

        RegisterUser: RegisterUser,
        Login: Login,

        uploadFile:uploadFile,
        dynamicSort:dynamicSort,
        createCompany:createCompany

    };
    return dataContext;
});