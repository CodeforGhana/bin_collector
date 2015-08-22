/**
 * Created by kwabenaboadu on 8/20/15.
 */
(function() {
    'use strict';

    angular.module('bin.services', [])
        .factory('dateDiffService', [
            function () {
                return {
                    inDays: function(d1, d2) {
                        var t2 = d2.getTime();
                        var t1 = d1.getTime();

                        return parseInt((t2-t1)/(24*3600*1000));
                    },
                    inWeeks: function(d1, d2) {
                        var t2 = d2.getTime();
                        var t1 = d1.getTime();

                        return parseInt((t2-t1)/(24*3600*1000*7));
                    },
                    inMonths: function(d1, d2) {
                        var d1Y = d1.getFullYear();
                        var d2Y = d2.getFullYear();
                        var d1M = d1.getMonth();
                        var d2M = d2.getMonth();

                        return (d2M+12*d2Y)-(d1M+12*d1Y);
                    },
                    inYears: function(d1, d2) {
                        return d2.getFullYear()-d1.getFullYear();
                    }
                };
            }
        ])
        .factory('binService', ['$http', '$q', 'appConfig', 'CacheFactory', 'dateDiffService',
            function($http, $q, appConfig, CacheFactory, dateDiffService) {
                var reportStatus, binCache, zoneCache, binKeys;

                (function() {
                    if (!CacheFactory.get('binCache')) {
                        binCache = CacheFactory('binCache');
                    }
                    if (!CacheFactory.get('zoneCache')) {
                        zoneCache = CacheFactory('zoneCache', {maxAge: 30 * 24 * 3600 * 1000});
                    }
                    binKeys = {'phone': 'binPhone', 'zone': 'binZone', 'binDate': 'binDate'};
                })();

                function cacheReport(data) {
                    binCache.put(binKeys.phone, data.mobileNumber);
                    binCache.put(binKeys.zone, new Date());
                    binCache.put(binKeys.binDate, data.location);
                }

                function canSubmitReport(data) {
                    /**
                     * Check local storage for last submission - phone, zone and timestamp
                     * A person cannot submit more than 1 report per zone per week
                     * A person cannot use more than 3 different phone numbers on the same phone
                     */
                    var phone, timestamp, curDate;

                    phone = binCache.get(binKeys.phone);
                    timestamp = new Date(binCache.get(binKeys.binDate));
                    curDate = new Date();

                    if (!phone)
                        return true;

                    if (phone == data.mobileNumber && dateDiffService.inDays(curDate, timestamp) < 7)
                        return false;

                    return true;
                }

                return {
                    submitReport: function(data) {
                        var deferred, status;
                        deferred = $q.defer();

                        if (canSubmitReport(data)) {
                            $http.post(appConfig.apiUrl + 'report', data)
                                .success(function(resp) {
                                    /* Cache the data that was sent */
                                    cacheReport(data);

                                    reportStatus = 'Your report was successfully submitted';
                                    deferred.resolve(resp);
                                })
                                .error(function(httpResp) {
                                    reportStatus = 'Sorry! The report was not submitted. Please try again';
                                    deferred.reject(httpResp);
                                });
                        } else {
                            status = 'Your report has already been submitted. Thank you';
                            reportStatus = status;
                            deferred.reject(status);
                        }

                        return deferred.promise;
                    },
                    getReportStatus: function() {
                        return reportStatus;
                    },
                    getPhoneNumber: function() {
                        if (binCache.get(binKeys.phone)) {
                            return binCache.get(binKeys.phone);
                        }
                        return '';
                    },
                    getZones: function() {
                        var deferred, key = appConfig.apiUrl + '/zones';
                        deferred = $q.defer();

                        if (zoneCache.get(key)) {
                            deferred.resolve(zoneCache.get(key));
                        } else {
                            $http.get(appConfig.apiUrl + '/zones')
                                .success(function(response) {
                                    zoneCache.put(key, response);
                                    deferred.resolve(response);
                                })
                                .error(function(resp) {
                                    deferred.reject(resp)
                                });
                        }

                        return deferred.promise;
                    }
                };
            }
        ]);
})();