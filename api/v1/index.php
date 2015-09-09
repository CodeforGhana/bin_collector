<?php

require_once '../include/Cors.php';
require_once '../include/mysql_crud.php';
require_once '../include/DbHandler.php';
require_once '../include/PassHash.php';
require '.././libs/Slim/Slim.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

// User id from db - Global Variable
$user_id = NULL;

/**
 * Adding Middle Layer to authenticate every request
 * Checking if the request has valid api key in the 'Authorization' header
 */
function authenticate(\Slim\Route $route)
{
    // Getting request headers
    $headers = apache_request_headers();
    $response = array();
    $app = \Slim\Slim::getInstance();

    // Verifying Authorization Header
    if (isset($headers['Bin'])) {
        $db = new DbHandler();

        // get the api key
        $api_key = $headers['Bin'];
        // validating api key
        if (!$db->isValidApiKey($api_key)) {
            // api key is not present in users table
            $response["error"] = true;
            $response["message"] = "Access Denied. Invalid Api key";
            echoRespnse(401, $response);
            $app->stop();
        } else {
            global $user_id;
            // get user primary key id
            $user_id = $db->getUserId($api_key);
        }
    } else {
        // api key is missing in header
        $response["error"] = true;
        $response["message"] = "Api key is misssing";
        echoRespnse(400, $response);
        $app->stop();
    }
}

/**
 * ----------- METHODS WITHOUT AUTHENTICATION ---------------------------------
 */
/**
 * User Registration
 * url - /register
 * method - POST
 * params - name, phone, password
 */
$app->post('/register', function () use ($app) {
    // check for required params
    $r = json_decode($app->request->getBody());
    verifyRequiredParams(array('name', 'phone', 'password'), $r);

    $response = array();
    $password = $r->password;
    $phone = $r->phone;
    $name = $r->name;

    $response = array('fields' => [$phone, $password, $name]);

    // reading post params
    // $name = $app->request->post('name');
    // $phone = $app->request->post('phone');
    // $password = $app->request->post('password');

    $db = new DbHandler();
    $res = $db->createUser($name, $phone, $password);

    if ($res == USER_CREATED_SUCCESSFULLY) {
        $user = $db->getUserByPhone($phone);
        $response["error"] = false;
        $response["message"] = "You are successfully registered";

        if (!is_null($user)) {
            $response["name"] = $user["name"];
            $response["phone"] = $user["phone"];
            $response["apiKey"] = $user["api_key"];
        }
    } else if ($res == USER_CREATE_FAILED) {
        $response["error"] = true;
        $response["message"] = "Oops! An error occurred while registering";
    } else if ($res == USER_ALREADY_EXISTED) {
        $response["error"] = true;
        $response["message"] = "Sorry, this phone already existed";
    }
    // echo json response
    echoRespnse(201, $response);
});

/**
 * User Login
 * url - /login
 * method - POST
 * params - phone, password
 */
$app->post('/login', function () use ($app) {
    // check for required params

     $r = json_decode($app->request->getBody());
    verifyRequiredParams(array('phone', 'password'),$r);
    $response = array();
    $password = $r->password;
    $phone = $r->phone;

    $response = array('fields' => [$phone, $password]);

    $db = new dbhandler();
    // check for correct phone and password
    if ($db->checkLogin($phone, $password)) {
        // get the user by phone
        $user = $db->getUserByPhone($phone);

        if ($user != null) {
            $response["error"] = false;
            $response['name'] = $user['name'];
            $response['phone'] = $user['phone'];
            $response['apiKey'] = $user['api_key'];
            $response['createdat'] = $user['created_at'];
        } else {
            // unknown error occurred
            $response['error'] = true;
            $response['message'] = "an error occurred. please try again";
        }
    } else {
        // user credentials are wrong
        $response['error'] = true;
        $response['message'] = 'login failed. incorrect credentials';
    }

    echoRespnse(200, $response);
});

/*
 * ------------------------ METHODS WITH AUTHENTICATION ------------------------
 */

/**
 * Listing all alerts of particual user
 * method GET
 * url /alerts
 */
$app->get('/alerts', 'authenticate', function () {
    global $user_id;
    $response = array();
    $db = new DbHandler();

    // fetching all user alerts
    $result = $db->getAllUseralerts($user_id);

    $response["error"] = false;
    $response["alerts"] = array();

    // looping through result and preparing alerts array
    while ($alert = $result->fetch_assoc()) {
        $tmp = array();
        $tmp["id"] = $alert["id"];
        $tmp["alert"] = $alert["alert"];
        $tmp["status"] = $alert["status"];
        $tmp["createdAt"] = $alert["created_at"];
        array_push($response["alerts"], $tmp);
    }

    echoRespnse(200, $response);
});

/**
 * Listing single alert of particual user
 * method GET
 * url /alerts/:id
 * Will return 404 if the alert doesn't belongs to user
 */
$app->get('/alerts/:id', 'authenticate', function ($alert_id) {
    global $user_id;
    $response = array();
    $db = new DbHandler();

    // fetch alert
    $result = $db->getalert($alert_id, $user_id);

    if ($result != NULL) {
        $response["error"] = false;
        $response["id"] = $result["id"];
        $response["alert"] = $result["alert"];
        $response["status"] = $result["status"];
        $response["createdAt"] = $result["created_at"];
        echoRespnse(200, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "The requested resource doesn't exists";
        echoRespnse(404, $response);
    }
});

/**
 * Creating new alert in db
 * method POST
 * params - name
 * url - /alerts/
 */
$app->post('/alerts', 'authenticate', function () use ($app) {
    // check for required params
    verifyRequiredParams(array('companyId'));

    $response = array();
    $companyId = (int)$app->request->post('companyId');

    global $user_id;
    $db = new DbHandler();

    // creating new alert
    // todo: verify that user has not submitted a report recently before saving
    if ($companyId > 0)
        $alert_id = $db->createalert($user_id, $companyId);
    else
        $alert_id = NULL;

    if ($alert_id != NULL) {
        $response["error"] = false;
        $response["message"] = "alert created successfully";
        $response["alert_id"] = $alert_id;
        echoRespnse(201, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "Failed to create alert. Please try again";
        echoRespnse(200, $response);
    }
});

/**
 * Updating existing alert
 * method PUT
 * params alert, status
 * url - /alerts/:id
 */
$app->put('/alerts/:id', 'authenticate', function ($alert_id) use ($app) {
    // check for required params
    verifyRequiredParams(array('alert', 'status'));

    global $user_id;
    $alert = $app->request->put('alert');
    $status = $app->request->put('status');

    $db = new DbHandler();
    $response = array();

    // updating alert
    $result = $db->updatealert($user_id, $alert_id, $alert, $status);
    if ($result) {
        // alert updated successfully
        $response["error"] = false;
        $response["message"] = "alert updated successfully";
    } else {
        // alert failed to update
        $response["error"] = true;
        $response["message"] = "alert failed to update. Please try again!";
    }
    echoRespnse(200, $response);
});

/**
 * Deleting alert. Users can delete only their alerts
 * method DELETE
 * url /alerts
 */
$app->delete('/alerts/:id', 'authenticate', function ($alert_id) use ($app) {
    global $user_id;

    $db = new DbHandler();
    $response = array();
    $result = $db->deletealert($user_id, $alert_id);
    if ($result) {
        // alert deleted successfully
        $response["error"] = false;
        $response["message"] = "alert deleted succesfully";
    } else {
        // alert failed to delete
        $response["error"] = true;
        $response["message"] = "alert failed to delete. Please try again!";
    }
    echoRespnse(200, $response);
});

require_once '../include/CompaniesEndpoint.php';

/**
 * Verifying required params posted or not
 */
function verifyRequiredParams($required_fields)
{
    $error = false;
    $error_fields = "";
    $request_params = array();

    $json_params = (array)json_decode(file_get_contents("php://input"));
    if (count($_REQUEST) <= 0 && count($json_params) > 0) {
        $_REQUEST = $json_params;
    }
    $request_params = $_REQUEST;
    // Handling PUT request params
    if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
        $app = \Slim\Slim::getInstance();
        parse_str($app->request()->getBody(), $request_params);
    }
    foreach ($required_fields as $field) {
        if (!isset($request_params[$field]) || strlen(trim($request_params[$field])) <= 0) {
            $error = true;
            $error_fields .= $field . ', ';
        }
    }

    if ($error) {
        // Required field(s) are missing or empty
        // echo error json and stop the app
        $response = array();
        $app = \Slim\Slim::getInstance();
        $response["error"] = true;
        $response["message"] = 'Required field(s) ' . substr($error_fields, 0, -2) . ' is missing or empty';
        echoRespnse(400, $response);
        $app->stop();
    }
}

/**
 * Echoing json response to client
 * @param String $status_code Http response code
 * @param Int $response Json response
 */
function echoRespnse($status_code, $response)
{
    $app = \Slim\Slim::getInstance();
    // Http response code
    $app->status($status_code);

    // setting response content type to json
    $app->contentType('application/json');

    echo json_encode($response);
}

$app->run();
?>