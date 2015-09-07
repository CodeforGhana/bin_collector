define(['services/binDatacontext', 'services/logger', 'config', 'models/binModels','plugins/router','durandal/app'], function (datacontext, logger, config, models,router,app) {
    var title = 'Companies';

    var companies = ko.observableArray([]);

    var searchText = ko.observable("");

    var companyId = ko.observable(0);

    function activate() {
        getCompanies();
        logger.log(title + ' View Activated', null, title, true);
        return true;
    }

    var gotoDetails = function (selectedCompany) {
        if (selectedCompany) {
            var url = '#/company/' + selectedCompany.Id();
            router.navigate(url);
        }
    };

    var onComplete = function (result, error) {
     if (error === false) {
        logger.log(' Company Deleted', null, title, true);
        getCompanies();
    }
};

var DeleteCompany = function (selectedCompany) {
    if (selectedCompany) {
        app.showMessage('Are you sure you want to Delete the Company?', 'Delete Company', ['Yes', 'No'])
        .then(function(dialogResult){
            if(dialogResult === "Yes"){
                        return datacontext.deleteCompany(selectedCompany.Id(),onComplete)

    }
});


    }
};
var getCompanies = function () {
    app.trigger('busy', true);
    datacontext.getCompanies(function (data, error) {
        if (error === false) {
            
            //map according to model
            var mappedCompanies = $.map(data.companies,
                function (item) {
                   return new models.CompanyModel(item);
               });
            //if(mappedCompanies.length==0)companies().push(new models.CompanyModel());
            companies(mappedCompanies);
            app.trigger('busy', false);
        }
    });
};


var onRetrieve = function (data, error) {
    if (error === false) {
        app.trigger('busy', false);
            //map according to model
            var mappedCompanies = $.map(data, function (item) { return new models.CompanyModel(item); });
            companies(mappedCompanies);
        }
    };

    var loadCompanies=function(){
        app.trigger('busy', true);
        var pId = 0;
        var s0 = '_';
        if (CompanyId()) pId = CompanyId();
        if (searchText() && (s0.length > 0) ) s0 = searchText();
        return datacontext.searchCompanies(s0, onRetrieve);
    };


    var attached = function (view) {
        bindEventToList(view, '.details', gotoDetails);
        bindEventToList(view, '.delete', DeleteCompany);
    };

    var bindEventToList = function (rootSelector, selector, callback, eventName) {
        var eName = eventName || 'click';
        $(rootSelector).on(eName, selector, function () {
            var client = ko.dataFor(this);
            callback(client);
            return false;
        });
    };

//#region pagination

var pageSize = ko.observable(20);
var pageIndex = ko.observable(0);

var pagedList = ko.dependentObservable(function () {
    var size = pageSize();
    var start = pageIndex() * size;
    return companies().slice(start, start + size);
});

var maxPageIndex = ko.dependentObservable(function () {
    return Math.ceil(companies().length / pageSize()) - 1;
});
var previousPage = function () {
    if (pageIndex() > 0) {
        pageIndex(pageIndex() - 1);
    }
};
var nextPage = function () {
    if (pageIndex() < maxPageIndex()) {
        pageIndex(pageIndex() + 1);
    }
};
var allPages = ko.dependentObservable(function () {
    var pages = [];
    for (var i = 0; i <= maxPageIndex() ; i++) {
        pages.push({ pageNumber: (i + 1) });
    }
    return pages;
});
var moveToPage = function (index) {
    pageIndex(index);
};

        //#endregion

    //Run when navigating to another view
    var addNew = function () {
            var url = '#/company/0';
            router.navigate(url);
        }
    var refresh = function () {
            getCompanies();
        }

    var canActivate = function () {
        return true;
    };


    var vm = {
        activate: activate,
        title: title,
        companies: companies,
        attached: attached,
        loadCompanies:loadCompanies,
        companyId:companyId,
        addNew: addNew,
     
        refresh:refresh,
        searchText: searchText,
            //#region Pagination
            pagedList: pagedList,
            previousPage: previousPage,
            nextPage: nextPage,
            allPages: allPages,
            moveToPage: moveToPage,
            pageIndex: pageIndex,
            maxPageIndex: maxPageIndex,

            //#endregion
        };

        return vm;

    });