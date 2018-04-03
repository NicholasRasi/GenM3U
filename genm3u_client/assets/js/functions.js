$(document).ready(function () {

    // Get started!

});


var app = angular.module('myApp', ['ngAnimate']);

app.controller('myCtrl', function ($scope, $timeout, $http, $window) {

    /**
     * Default values
     */
    if (typeof(Storage) !== "undefined") {
        $scope.fileSettingsServer = localStorage.getItem("fileSettingsServer") || "http://127.0.0.1:5000/channels/";
        $scope.fileSettingsAttempts = parseInt(localStorage.getItem("fileSettingsAttempts")) || 5
    } else {
        // No Web Storage support
        $scope.fileSettingsServer = "http://127.0.0.1:5000/channels/";
        $scope.fileSettingsAttempts = 5;
    }
    $scope.fileExportOption = "all";
    $scope.actionResult = "None";
    $scope.downloadApi = $scope.fileSettingsServer + 'download/';


    $http({
        method: "GET",
        url: $scope.fileSettingsServer + 'getkey/'
    }).then(function (response) {
        if (response.data.key !== null && response.status === 200) {
            $scope.fileSettingsPublicLink = $scope.fileSettingsServer + 'link/' + response.data.key
        }
    });




    /**
     * Functions declaration
     */
    $scope.saveSettings = function () {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("fileSettingsServer", $scope.fileSettingsServer);
            localStorage.setItem("fileSettingsAttempts", $scope.fileSettingsAttempts);
            $('#file-settings').modal('hide');
        } else {
            alert("Your browser does not support Web Storage");
        }
    };

    $scope.refreshView = function () {
        $http({
            method: "GET",
            url: $scope.fileSettingsServer
        }).then(function (response) {
            $scope.channels = response.data;
        });
    };
    $scope.refreshView();

    $scope.removeChannel = function (channel, $index) {
        $http({
            method: "DELETE",
            url: $scope.fileSettingsServer + channel.ID + '/'
        }).then(function (response) {
            if (response.data.length > 0 && response.status === 200) {
                $scope.showSuccessResponse('Channel removed successfully');
                $scope.channels.splice($index, 1)
            }
            else {
                $scope.showErrorResponse('Channel not deleted');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };

    $scope.updateChannel = function (channel, callback) {
        callback = callback || false;

        $http({
            method: "PUT",
            url: $scope.fileSettingsServer + channel.ID + '/',
            data: {
                position: channel.position,
                name: channel.name,
                metadata: channel.metadata,
                url: channel.url,
                checked: channel.checked,
                last_check: channel.last_check
            }
        }).then(function (response) {
            if (response.data.length > 0 && response.status === 200) {
                if (callback) {
                    callback();
                } else {
                    $scope.showSuccessResponse('Channel updated successfully');
                    $scope.refreshView();
                }
            } else {
                $scope.showErrorResponse('Channel not updated');
                $scope.refreshView();
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
            $scope.refreshView();
        });
    };

    $scope.addChannel = function () {
        // double check that data is not empty
        if (!$scope.editAddName || $scope.editAddName === "" || !$scope.editAddUrl || $scope.editAddUrl === "") {
            $scope.showErrorResponse('Error with the input');
        } else {
            // hide the modal
            $('#edit-add').modal('hide');

            // start the http request
            $http({
                method: "POST",
                url: $scope.fileSettingsServer,
                data: {
                    position: $scope.channels.length + 1,
                    name: $scope.editAddName,
                    metadata: $scope.editAddMeta,
                    url: $scope.editAddUrl
                }
            }).then(function (response) {
                // if response is 200
                if (response.data && response.status === 200) {
                    $scope.showSuccessResponse('Channel added successfully');
                    // reset form
                    $scope.editAddName = $scope.editAddMeta = $scope.editAddUrl = "";
                    $scope.refreshView();
                } else {
                    $scope.showErrorResponse('Channel not added');
                }
            }, function error(response) {
                $scope.showErrorResponse('Error with the server');
            });
        }
    };

    $scope.checkChannel = function (channel, $index) {
        $scope.showInfoResponse('Channel ' + channel.ID + ' checking is started');
        $http({
            method: "POST",
            url: $scope.fileSettingsServer + channel.ID + '/check/',
            data: {
                attempts: $scope.fileSettingsAttempts
            }
        }).then(function (response) {
            console.log(response);
            if (response.status === 200) {
                $scope.showSuccessResponse('Channel ' + channel.ID + ' checked successfully');
                channel.checked = response.data.checked;
                channel.last_check = response.data.last_check;
            } else {
                $scope.showErrorResponse('Channel not checked');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };

    $scope.updateAndCheckChannel = function (channel) {
        $scope.updateChannel(channel, function () {
            $scope.checkChannel(channel.ID)
        })
    };

    $scope.checkAll = function () {
        $scope.showInfoResponse('Checking started with ' + $scope.fileSettingsAttempts + ' attempts. Please wait...');

        $http({
            method: "POST",
            url: $scope.fileSettingsServer + 'checkAll/',
            data: {
                attempts: $scope.fileSettingsAttempts
            }
        }).then(function (response) {
            console.log(response);
            if (response.status === 200) {
                $scope.showSuccessResponse('Channels checked successfully. Online: ' + response.data.online + ' Offline: ' + response.data.offline);
                $scope.refreshView();
            } else {
                $scope.showErrorResponse('Channel not checked');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };


    $scope.clearList = function () {
        // start the http request
        $http({
            method: "DELETE",
            url: $scope.fileSettingsServer,
            data: {
                position: $scope.channels.length + 1,
                name: $scope.editAddName,
                metadata: $scope.editAddMeta,
                url: $scope.editAddUrl
            }
        }).then(function (response) {
            // hide the modal
            $('#edit-clear').modal('hide');

            // if response is 200
            if (response.status === 200) {
                $scope.showSuccessResponse('List cleared');
                // reset form
                $scope.editAddName = $scope.editAddMeta = $scope.editAddUrl = "";
                $scope.refreshView();
            } else {
                $scope.showErrorResponse('List not cleared');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };

    $scope.importFile = function () {
        // double check that data is not empty
        var fileInput = document.getElementById('fileImport');
        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('file', file);

        // start the http request
        $http({
            url: $scope.fileSettingsServer + 'upload/',
            data: formData,
            method: "POST",
            headers: {'Content-Type': undefined},
            transformRequest: angular.identity
        }).then(function (response) {
            $('#file-import').modal('hide');

            // if response is 200
            if (response.data && response.status === 200) {
                $scope.showSuccessResponse('List imported. Success: ' + response.data.success + ". Errors: " + response.data.errors + ". Added: " + response.data.added);
                // reset form
                document.getElementById('fileImport').value = "";
                $scope.refreshView();
            } else {
                $scope.showErrorResponse('List not imported');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };

    $scope.exportFile = function () {
        // start the http request
        $http({
            method: "GET",
            url: $scope.fileSettingsServer + 'export/' + $scope.fileExportOption
        }).then(function (response) {
            // hide the modal
            $('#file-export').modal('hide');

            // if response is 200
            if (response.status === 200 && response.data.result) {
                $scope.showSuccessResponse('List exported');
                $window.open($scope.downloadApi + response.data.filename, '_blank');

                $scope.fileExportName = response.data.filename;
                $scope.fileExportReady = true;
            } else {
                $scope.showErrorResponse('List not exported');
            }
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };

    $scope.showInfoResponse = function (msg) {
        $.notify(msg,{
            className: "info",
            position:"top center"
        });
    };

    $scope.showErrorResponse = function (msg) {
        $.notify(msg,{
            className: "error",
            position:"top center"
        });
    };

    $scope.showSuccessResponse = function (msg) {
        $.notify(msg,{
            className: "success",
            position:"top center"
        });
    };

});