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
                        var deferred;
                        deferred = $q.defer();

                        $http({
                            url: appConfig.apiUrl + 'register',
                            method: 'POST',
                            data: $httpParamSerializerJQLike(user),
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        }).success(function (resp) {
                            /* Log the user in automatically */
                            if (!resp.error) {
                                cacheUserInfo(resp.phone, resp.apiKey, resp['name']);
                            }
                            deferred.resolve(resp);
                        }).error(function (httpResp) {
                            deferred.reject(httpResp);
                        });

                        return deferred.promise;
                    },
                    login: function (user) {
                        var deferred;
                        deferred = $q.defer();

                        if (isLoggedIn(user))
                            deferred.resolve({error: false});
                        else {
                            $http({
                                url: appConfig.apiUrl + 'login',
                                method: 'POST',
                                data: $httpParamSerializerJQLike(user),
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            }).success(function (resp) {
                                if (!resp.error) {
                                    cacheUserInfo(resp.phone, resp.apiKey, resp['name']);
                                }
                                deferred.resolve(resp);
                            }).error(function (httpResp) {
                                deferred.reject(httpResp);
                            });
                        }

                        return deferred.promise;
                    },
                    getUsername: function () {
                        if (userCache.get(cacheKeys.userName)) {
                            return userCache.get(cacheKeys.userName);
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
        .factory('binService', ['$http', '$q', 'appConfig', 'CacheFactory', 'dateDiffService', 'userService',
            function ($http, $q, appConfig, CacheFactory, dateDiffService, userService) {
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

                function cacheReport(data) {
                    var reports = [];

                    if (binCache.get(binKeys.reports)) {
                        reports = binCache.get(binKeys.reports);
                    }

                    reports.push({
                        'binPhone': data.mobileNumber,
                        'binZone': data.location,
                        'binDate': new Date()
                    });
                    binCache.put(binKeys.reports, reports);
                }

                function canSubmitReport(data) {
                    /**
                     *  A user can make reports with up to 3 different numbers.
                     *  A given phone number can only be used to make 1 report each week
                     */
                    var reports, repDate, curDate, rec;

                    reports = binCache.get(binKeys.reports);
                    curDate = new Date();

                    if (!angular.isArray(reports) || reports.length <= 0)
                        return true;

                    for (var i = 0; i < reports.length; ++i) {
                        rec = reports[i];
                        repDate = new Date(rec[binKeys.binDate]);

                        if (rec[binKeys.phone] == data.mobileNumber && dateDiffService.inDays(curDate, repDate) < 7) {
                            reportStatus = 'Sorry! Only one report allowed per mobile number';
                            return false;
                        }
                    }

                    /* 3 different phone numbers have already been used */
                    if (reports.length == 3) {
                        reportStatus = 'Sorry! Only a maximum of 3 phone numbers per mobile device';
                        return false;
                    }

                    return true;
                }

                return {
                    submitReport: function (data) {
                        var deferred;
                        deferred = $q.defer();

                        $http.post(appConfig.apiUrl + 'report', data)
                            .success(function (resp) {
                                reportStatus = 'Your report was successfully submitted';
                                deferred.resolve(resp);
                            })
                            .error(function (httpResp) {
                                reportStatus = 'Sorry! The report was not submitted. Please try again';
                                deferred.reject(httpResp);
                            });

                        return deferred.promise;
                    },
                    getReportStatus: function () {
                        return reportStatus;
                    },
                    getZones: function () {
                        var deferred, key = appConfig.apiUrl + 'zones';
                        deferred = $q.defer();

                        if (tempCache.get(key)) {
                            deferred.resolve(tempCache.get(key));
                        } else {
                            $http.get(key)
                                .success(function (response) {
                                    tempCache.put(key, response);
                                    deferred.resolve(response);
                                })
                                .error(function (resp) {
                                    deferred.reject(resp)
                                });
                        }

                        return deferred.promise;
                    },
                    getCompanies: function () {
                        var deferred, key = appConfig.apiUrl + 'companies';
                        deferred = $q.defer();

                        if (tempCache.get(key)) {
                            deferred.resolve(tempCache.get(key));
                        } else {
                            $http({
                                url: key,
                                method: 'GET',
                                headers: {'Authorization': userService.getApiKey()}
                            }).success(function (response) {
                                tempCache.put(key, response);
                                deferred.resolve(response);
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