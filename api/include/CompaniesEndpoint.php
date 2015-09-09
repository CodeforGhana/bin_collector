<?php

/**
 * Listing all companies
 * method GET
 * url /companies          
 */
$app->get('/companies', 'authenticate', function() {
    global $user_id;
    $response = array();
    $db = new Database();
    $db->connect();
    $db->select('companies');
    // fetching all user blackouts
    $result = $db->getResult();

    $response["error"] = false;
    $response["companies"] = $result;

    echoRespnse(200, $response);
});

/**
 * Listing single company
 * method GET
 * url /companies/:id
 * Will return 404 if the company doesn't exist
 */
$app->get('/companies/:id', 'authenticate', function($company_id) {
    global $user_id;
    $response = array();
    $db = new DbHandler();

            // fetch company
    $result = $db->getCompany($company_id);

    if ($result != NULL) {
        $response["error"] = false;
        $response["id"] = $result["id"];
        $response["name"] = $result["name"];
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
 * Creating new company in db
 * method POST
 * params - name
 * url - /companies/
 */
$app->post('/companies', 'authenticate', function() use ($app) {
            // check for required params
    verifyRequiredParams(array('name'));

    $response = array();
    $name = $app->request->post('name');

    global $user_id;
    $db = new DbHandler();

            // creating new company
    $company_id = $db->createCompany($name);

    if ($company_id != NULL) {
        $response["error"] = false;
        $response["message"] = "company created successfully";
        $response["company_id"] = $company_id;
        echoRespnse(201, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "Failed to create company. Please try again";
        echoRespnse(200, $response);
    }            
});

/**
 * Updating existing company
 * method PUT
 * params company, status
 * url - /companies/:id
 */
$app->put('/companies/:id', 'authenticate', function($company_id) use($app) {
            // check for required params
    verifyRequiredParams(array('name', 'status'));

    global $user_id;            
    $name = $app->request->put('name');
    $status = $app->request->put('status');

    $db = new DbHandler();
    $response = array();

            // updating company
    $result = $db->updateCompany($company_id, $name, $status);
    if ($result) {
                // company updated successfully
        $response["error"] = false;
        $response["message"] = "company updated successfully";
    } else {
                // company failed to update
        $response["error"] = true;
        $response["message"] = "company failed to update. Please try again!";
    }
    echoRespnse(200, $response);
});

?>