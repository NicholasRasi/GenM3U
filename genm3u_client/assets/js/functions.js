$(document).ready(function () {

    // Get started!

});


var app = angular.module('myApp', ['ngAnimate']);

app.controller('myCtrl', function ($scope, $timeout, $http, $window) {

    /**
     * Default values
     */
    if (typeof(Storage) !== "undefined") {
        $scope.key = localStorage.getItem("key");
        $scope.server = localStorage.getItem("server") || "http://127.0.0.1:5000/channels/";
        $scope.attempts = parseInt(localStorage.getItem("attempts")) || 5
    } else {
        // No Web Storage support
        $scope.server = "http://127.0.0.1:5000/channels/";
        $scope.attempts = 5;
    }
    $scope.fileExportOption = "all";

    /**
     * Functions declaration
     */
    $scope.refreshView = function () {
        $http({
            method: "GET",
            url: $scope.server,
            headers: {
                "key": $scope.key
            }
        }).then(function (response) {
            $scope.channels = response.data;
        }, function error(response) {
            $scope.showErrorResponse('Error with the server');
        });
    };
    $scope.refreshView();

    $scope.saveSettings = function () {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("key", $scope.key);
            localStorage.setItem("server", $scope.server);
            localStorage.setItem("attempts", $scope.attempts);
            $('#file-settings').modal('hide');
            $scope.refreshView();
        } else {
            alert("Your browser does not support Web Storage");
        }
    };


    $scope.removeChannel = function (channel, $index) {
        $http({
            method: "DELETE",
            url: $scope.server + channel.ID + '/',
            headers: {
                "key": $scope.key
            }
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
            url: $scope.server + channel.ID + '/',
            headers: {
                "key": $scope.key
            },
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
                url: $scope.server,
                headers: {
                    "key": $scope.key
                },
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
            url: $scope.server + channel.ID + '/check/',
            headers: {
                "key": $scope.key
            },
            data: {
                attempts: $scope.attempts
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
        $scope.showInfoResponse('Checking started with ' + $scope.attempts + ' attempts. Please wait...');

        $http({
            method: "POST",
            url: $scope.server + 'checkAll/',
            headers: {
                "key": $scope.key
            },
            data: {
                attempts: $scope.attempts
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
            url: $scope.server,
            headers: {
                "key": $scope.key
            },
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
            url: $scope.server + 'upload/',
            data: formData,
            method: "POST",
            headers: {
                'Content-Type': undefined,
                'key': $scope.key
            },
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
            url: $scope.server + 'export/' + $scope.fileExportOption,
            headers: {
                "key": $scope.key
            }
        }).then(function (response) {
            // hide the modal
            //$('#file-export').modal('hide');

            // if response is 200
            if (response.status === 200 && response.data.result) {
                $scope.showSuccessResponse('List exported');
                $window.open($scope.server + 'download/' + $scope.key + '/' + response.data.filename, '_blank');
                $scope.servingUrl = $scope.server + 'download/' + $scope.key + '/' + response.data.filename

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