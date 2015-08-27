/**
 * Created by kwabenaboadu on 8/20/15.
 */
(function () {
    'use strict';

    angular.module('bin.controllers', [])
        .controller('LoginCtrl', ['$http', '$scope', '$ionicModal', 'appConfig', '$state',
            'userService',
            function ($http, $scope, $ionicModal, appConfig, $state, userService) {
                var self = this;

                (function () {
                    /* Register signup modal */
                    $ionicModal.fromTemplateUrl('templates/signup-modal.html', {
                        scope: $scope,
                        animation: 'slide-in-up'
                    }).then(function (modal) {
                        self.signupModal = modal;
                    });
                })();

                self.openLoginModal = function () {
                    self.isLoginModal = true;
                    self.signupModal.show();
                };

                self.closeModal = function () {
                    self.user = {};
                    self.isLoginModal = self.isSignupModal = false;
                    self.httpStatus = '';
                    self.isSubmit = self.isSubmitting = false;
                    self.signupModal.hide();
                };

                self.openSignupModal = function () {
                    self.isSignupModal = true;
                    self.signupModal.show();
                };

                self.submit = function (theForm) {
                    self.isSubmit = true;

                    if (theForm.$valid) {
                        self.isSubmitting = true;
                        self.httpStatus = '';

                        if (self.isLoginModal)
                            login();
                        else if (self.isSignupModal)
                            signup();
                    }
                };

                function signup() {
                    userService.createAccount(self.user)
                        .then(function (resp) {
                            if (!resp.error) {
                                self.closeModal();
                                $state.go('menu.report');
                            } else
                                self.httpStatus = resp.message;
                        }, function () {
                            self.httpStatus = 'Network error. Check your data settings and try again';
                        })
                        .finally(function () {
                            self.isSubmitting = false;
                        });
                }

                function login() {
                    userService.login(self.user)
                        .then(function (resp) {
                            if (!resp.error) {
                                self.closeModal();
                                $state.go('menu.report')
                            } else
                                self.httpStatus = resp.message;
                        }, function () {
                            self.httpStatus = 'Network error. Check your data settings and try again';
                        })
                        .finally(function() {
                            self.isSubmitting = false;
                        });
                }
            }
        ])
        .controller('MenuCtrl', ['$http', '$state', 'userService', function($http, $state, userService) {
            var self = this;

            self.logout = function() {
                /* todo: log the user out */
                userService.logout();
                $state.go('login');
            };
        }])
        .controller('MakeReportCtrl', ['$http', 'binService', '$state', 'userService',
            function ($http, binService, $state, userService) {
                var self = this;

                (function () {
                    binService.getCompanies().then(function (results) {
                        self.companies = results;
                        self.report = {mobileNumber: userService.getUsername(), company: self.companies[0]};
                    });

                    self.isSubmitting = false;
                })();

                self.submit = function (makeForm) {
                    self.isSubmit = true;

                    if (makeForm.$valid) {
                        self.isSubmitting = true;

                        binService.submitReport(self.report)
                            .finally(function () {
                                self.isSubmit = false;
                                self.isSubmitting = false;

                                $state.go('menu.status');
                            });
                    }
                };
            }
        ])
        .controller('ReportStatusCtrl', ['binService',
            function (binService) {
                var self = this;

                (function () {
                    self.status = binService.getReportStatus();
                })();
            }
        ]);
})();