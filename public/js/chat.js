ChatController = function($scope, $location, $anchorScroll) {
    $scope.messages = [];
    $scope.users = [];
    $scope.me = {};
    $scope.newmessage = "";
    $scope.socket = null;

    $scope.init = function(){
        $scope.socket = io.connect("127.0.0.1:1223");

        // for now the server will assign a nickname
        $scope.me.nickname = "";
        $scope.socket.emit("user:join", $scope.me);

        // we received a new list of users online from the server
        $scope.socket.on("server:updateusers", function(users) {
            $scope.$apply(function() {
                $scope.users = users;
            });
        });

        // we received a new message from the server
        $scope.socket.on("server:send", function(message) {
            $scope.add(message);
        });

        // the connection disconnected
        $scope.socket.on("disconnect", function() {
            $scope.add({
                nickname: "***ERROR***",
                content: "The server is not available",
                date: new Date()
            });
        });
    }

    $scope.add = function(message) {
        message.date = moment(message.date).format('LLL');
        $scope.$apply(function() {
            $scope.messages.push(message);
        });

        $location.hash('latest');
        $anchorScroll();
    }

    $scope.send = function() {

        if($scope.newmessage.length > 0){
            $scope.socket.emit("user:send", $scope.newmessage);     
            $scope.newmessage = "";
        }
    }

    $scope.enter = function(event) {
        // If the key was enter
        if(event.which === 13) {
            $scope.send();
            event.preventDefault();
        }
    }

    $scope.init();
}