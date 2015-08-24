/**
 * Created by kwabenaboadu on 8/20/15.
 */
(function () {
    'use strict';

    angular.module('bin.controllers', [])
        .controller('MakeReportCtrl', ['$http', 'binService', '$state',
            function ($http, binService, $state) {
                var self = this;

                /* todo: Fetch zones from server */
                self.zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];
                self.report = {mobileNumber: binService.getPhoneNumber(), location: self.zones[0]};
                self.isSubmitting = false;

                self.submit = function (makeForm) {
                    self.isSubmit = true;

                    if (makeForm.$valid) {
                        self.isSubmitting = true;

                        binService.submitReport(self.report)
                            .finally(function () {
                                self.isSubmit = false;
                                self.isSubmitting = false;

                                $state.go('report_status');
                            });
                    }
                };
            }
        ])
        .controller('ReportStatusCtrl', ['binService',
            function (binService) {
                var self = this;

                (function() {
                    self.status = binService.getReportStatus();
                })();
            }
        ]);
})();