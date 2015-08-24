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
        .factory('userService', ['$http', '$q', 'appConfig', 'CacheFactory',
            function ($http, $q, appConfig, CacheFactory) {
                var userCache, cacheKeys;
                (function () {
                    if (!CacheFactory.get('userCache')) {
                        userCache = CacheFactory('userCache');
                        cacheKeys = {'phone': 'phoneNumber'};
                    }
                })();
                return {
                    createAccount: function (phone, pin) {
                        var deferred;
                        deferred = $q.defer();

                        $http.post(appConfig.apiUrl + '/signup', {'phoneNumber': phone, 'pin': pin})
                            .success(function (resp) {
                                /* Log the user in automatically */
                                if (resp.wasSuccessful)
                                    userCache.put(cacheKeys.phone, phone);
                                deferred.resolve(resp);
                            })
                            .error(function (httpResp) {
                                deferred.reject(httpResp);
                            });

                        return deferred.promise;
                    },
                    login: function (phone, pin) {
                        var deferred;
                        deferred = $q.defer();

                        if (userCache.get(cacheKeys.phone) == phone)
                            deferred.resolve('Login Successful');
                        else {
                            $http.post(appConfig.apiUrl + '/login', {'phoneNumber': phone, 'pin': pin})
                                .success(function (resp) {
                                    if (resp.wasSuccessful)
                                        userCache.put(cacheKeys.phone, phone);
                                    deferred.resolve(resp);
                                })
                                .error(function (httpResp) {
                                    deferred.reject(httpResp);
                                });
                        }

                        return deferred.promise;
                    },
                    getUsername: function() {
                        if (userCache.get(cacheKeys.phone)) {
                            return userCache.get(cacheKeys.phone);
                        }
                        return '';
                    }
                }
            }
        ])
        .factory('binService', ['$http', '$q', 'appConfig', 'CacheFactory', 'dateDiffService',
            function ($http, $q, appConfig, CacheFactory, dateDiffService) {
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
                        var deferred, key = appConfig.apiUrl + '/zones';
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
                    getCompanies: function() {
                        var deferred, key = appConfig.apiUrl + '/companies';
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
                    }
                };
            }
        ]);
})();