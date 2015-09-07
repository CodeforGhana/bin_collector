define(['config'],function (config) {
    var limit = 13;
    var shortText = function (limit, text) {
        return ((text && text.length > limit) ? text.substring(0, limit) + '...' : text);
    };

    

    var UserModel = function (data) {
        if (!data)
        {
            data = {};
        }

        this.name = ko.observable(data.name);
        this.phone = ko.observable(data.phone);
        this.id = ko.observable(data.id);
        this.apikey=ko.observable(data.apikey);
       
    };

var CompanyModel = function (data) {
        if (!data)
        {
            data = {};
        }

        this.name = ko.observable(data.name);
        this.status = ko.observable(data.status);
        this.id = ko.observable(data.id); 
        this.createdat = ko.observable(data.created_at);      
    };

    var RegisterModel = function (data) {
        if (!data)
        {
            data = {};
        }

        this.name = ko.observable(data.name);
        this.phone = ko.observable(data.phone);
        this.password=ko.observable(data.password);
        this.confirmPassword=ko.observable(data.confirmPassword);
        
    };

    return {
        UserModel: UserModel,
        RegisterModel:RegisterModel,
        CompanyModel:CompanyModel
    };


});