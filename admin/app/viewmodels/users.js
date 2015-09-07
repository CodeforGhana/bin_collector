define(['services/binDatacontext', 'plugins/router',
    'durandal/system', 'services/logger', 'models/binModels', 'config','durandal/app'], function (datacontext,router,system,logger,models,config,app) {

        var title = 'Users Directory';
        var users = ko.observableArray([]);
        var searchText = ko.observable("");
        var userId = ko.observable(0);
        
var getUsers = function () {
        datacontext.getUsers(function (data, error) {
            if (error === false) {
                //map according to model
                var mappedUsers = $.map(data, function (item) { return new models.UserModel(item); });
                users(mappedUsers);
            }
        });
    };
        //#region Internal Methods
        function activate() {
            getUsers();
            logger.log(title + ' View Activated', null, title, true);

            return true;
        }
        var onRetrieve = function (data, error) {
           if (error === false) {
            //map according to model
            var mappedUsers = $.map(data, function (item) { return new models.UserModel(item); });
            users(mappedUsers);
        }
    };
    var loadUsers=function(){
        app.trigger('busy', true);
        var uId = 0;
        var s0 = '_';
        if (userId()) uId = userId();
        if (searchText() && (s0.length > 0) ) s0 = searchText();
        return datacontext.searchUsers(s0, onRetrieve);

    };
    var gotoDetails = function (selectedUser) {
        if (selectedUser) {
            var url = '#/user/' + selectedUser.id();
            router.navigate(url);
        }
    };
var addNew = function () {
            var url = '#/user/0';
            router.navigate(url);
        }

    var attached = function (view) {
        bindEventToList(view, '.details', gotoDetails);
    };

    var bindEventToList = function (rootSelector, selector, callback, eventName) {
        var eName = eventName || 'click';
        $(rootSelector).on(eName, selector, function () {
            var client = ko.dataFor(this);
            callback(client);
            return false;
        });
    };
        //#endregion

//#region pagination

var pageSize = ko.observable(20);
var pageIndex = ko.observable(0);

var pagedList = ko.dependentObservable(function () {
    var size = pageSize();
    var start = pageIndex() * size;
    return users().slice(start, start + size);
});

var maxPageIndex = ko.dependentObservable(function () {
    return Math.ceil(users().length / pageSize()) - 1;
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


        var vm = {
            activate: activate,
            attached: attached,
            title: title,
            users: users,
            loadUsers:loadUsers,
            searchText: searchText,
            //#region Pagination
            pagedList: pagedList,
            previousPage: previousPage,
            nextPage: nextPage,
            allPages: allPages,
            moveToPage: moveToPage,
            pageIndex: pageIndex,
            maxPageIndex: maxPageIndex,
addNew:addNew
            //#endregion
        };

        return vm;


    });