/**
 * Created by kwabenaboadu on 8/20/15.
 */
(function () {
    'use strict';

    angular.module('bin.services', [])
        .factory('dateDiffService', [
            function () {
                return {
                    inDays: function (d1, d2) {
                        var t2 = d2.getTime();
                        var t1 = d1.getTime();

                        return parseInt((t2 - t1) / (24 * 3600 * 1000));
                    },
                    inWeeks: function (d1, d2) {
                        var t2 = d2.getTime();
                        var t1 = d1.getTime();

                        return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
                    },
                    inMonths: function (d1, d2) {
                        var d1Y = d1.getFullYear();
                        var d2Y = d2.getFullYear();
                        var d1M = d1.getMonth();
                        var d2M = d2.getMonth();

                        return (d2M + 12 * d2Y) - (d1M + 12 * d1Y);
                    },
                    inYears: function (d1, d2) {
                        return d2.getFullYear() - d1.getFullYear();
                    }
                };
            }
        ])
        .factory('routeAuthService', ['$rootScope', '$state', 'userService',
            function ($rootScope, $state, userService) {
                function isAuthRoute(toState) {
                    return toState.hasOwnProperty('data') && toState.data.hasOwnProperty('authenticated') &&
                        toState.data.authenticated;
                }

                return {
                    registerRouteChangeListener: function () {
                        /* Register a route change listener */
                        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
                            if (isAuthRoute(toState) && !userService.isLoggedIn()) {
                                event.preventDefault();
                                $state.go('login');
                            }
                            return;
                        });
                    }
                }
            }
        ])
        .factory('userService', ['$http', '$q', 'appConfig', 'CacheFactory', '$httpParamSerializerJQLike',
            function ($http, $q, appConfig, CacheFactory, $httpParamSerializerJQLike) {
                var userCache, cacheKeys;
                (function () {
                    if (!CacheFactory.get('userCache')) {
                        userCache = CacheFactory('userCache');
                        cacheKeys = {'userPhone': 'phoneNumber', 'apiKey': 'userKey', 'userName': 'userName'};
                    }
                })();

                function cacheUserInfo(phone, apiKey, name) {
                    userCache.put(cacheKeys.userPhone, phone);
                    userCache.put(cacheKeys.apiKey, apiKey);
                    userCache.put(cacheKeys.userName, name);
                }

                function clearCache() {
                    
                }

                function isLoggedIn(user) {
                    return userCache.get(cacheKeys.userPhone) == user.phone && userCache.get(cacheKeys.apiKey);
                }

                return {
                    createAccount: function (user) {
                        var deferred, resp;
                        deferred = $q.defer();

                        $http({
                            url: appConfig.apiUrl + 'register', 
                            method: 'POST',
                            data: user
                            })
                            .then(function (httpResponse) {
                                console.log(httpResponse);
                                resp = httpResponse.data;
                                /* Log the user in automatically */
                                if (!resp.error) {
                                    cacheUserInfo(resp.phone, resp.apiKey, resp['name']);
                                }
                                deferred.resolve(resp);
                            }, function (httpResp) {
                                deferred.reject(httpResp);
                            });

                        return deferred.promise;
                    },
                    login: function (user) {
                        var deferred, resp;
                        deferred = $q.defer();

                        if (isLoggedIn(user))
                            deferred.resolve({error: false});
                        else {
                            $http.post(appConfig.apiUrl + 'login', user)
                                .then(function (httpResponse) {
                                    resp = httpResponse.data;
                                    console.log(httpResponse);
                                    if (!resp.error) {
                                        cacheUserInfo(resp.phone, resp.apiKey, resp['name']);
                                    }
                                    deferred.resolve(resp);
                                }, function (httpResp) {
                                    deferred.reject(httpResp);
                                });
                        }

                        return deferred.promise;
                    },
                    getUsername: function () {
                        var names;
                        if (userCache.get(cacheKeys.userName)) {
                            names = (userCache.get(cacheKeys.userName)).split(" ");
                            return angular.isArray(names) && names.length > 0 ? names[0] : "";
                        }
                        return '';
                    },
                    isLoggedIn: function () {
                        if (userCache.get(cacheKeys.apiKey))
                            return true;
                        return false;
                    },
                    logout: function () {
                        clearCache();
                    },
                    getApiKey: function () {
                        return userCache.get(cacheKeys.apiKey);
                    }
                }
            }
        ])
        .factory('binService', ['$http', '$q', 'appConfig', 'CacheFactory', 'dateDiffService',
            'userService', '$httpParamSerializerJQLike',
            function ($http, $q, appConfig, CacheFactory, dateDiffService, userService, $httpParamSerializerJQLike) {
                var reportStatus, binCache, tempCache, binKeys;

                (function () {
                    if (!CacheFactory.get('binCache')) {
                        binCache = CacheFactory('binCache');
                    }
                    if (!CacheFactory.get('tempCache')) {
                        /* Expire zones cache after 30 days */
                        tempCache = CacheFactory('tempCache', {maxAge: 30 * 24 * 3600 * 1000});
                    }
                    binKeys = {'reports': 'reports', 'phone': 'binPhone', 'zone': 'binZone', 'binDate': 'binDate'};
                })();

                return {
                    submitReport: function (data) {
                        var deferred;
                        deferred = $q.defer();

                        $http({
                            url: appConfig.apiUrl + "alerts",
                            method: 'POST',
                            data: $httpParamSerializerJQLike(data),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Bin': userService.getApiKey()
                            }
                        }).success(function (resp) {
                            if (!resp.error)
                                reportStatus = 'Your bin collection report was successfully sent. Thank you';
                            else
                                reportStatus = 'Sorry! Your report was not saved. Please try again';
                            deferred.resolve(resp);
                        }).error(function (httpResp) {
                            reportStatus = 'Sorry! The report was not submitted. Please try again';
                            deferred.reject(httpResp);
                        });

                        return deferred.promise;
                    },
                    getReportStatus: function () {
                        return reportStatus;
                    },
                    getCompanies: function () {
                        var deferred, key, results;
                        key = appConfig.apiUrl + 'companies';
                        deferred = $q.defer();
                        results = tempCache.get(key);

                        if (angular.isArray(results) && results.length > 0) {
                            deferred.resolve(results);
                        } else {
                            $http({
                                url: key,
                                method: 'GET',
                                headers: {'Bin': userService.getApiKey()}
                            }).success(function (response) {
                                tempCache.put(key, response.companies);
                                deferred.resolve(response.companies);
                            }).error(function (resp) {
                                deferred.reject(resp);
                            });
                        }

                        return deferred.promise;
                    }
                };
            }
        ]);
})();
