<?php

/**
 * Class to handle all db operations
 * This class will have CRUD methods for database tables
 *
 * @author Ravi Tamada
 * @link URL Tutorial link
 */
class DbHandler {

    private $conn;

    function __construct() {
        require_once dirname(__FILE__) . '/DbConnect.php';
        // opening db connection
        $db = new DbConnect();
        $this->conn = $db->connect();
    }

    /* ------------- `users` table method ------------------ */

    /**
     * Creating new user
     * @param String $name User full name
     * @param String $phone User login phone id
     * @param String $password User login password
     */
    public function createUser($name, $phone, $password) {
        require_once 'PassHash.php';
        $response = array();

        // First check if user already existed in db
        if (!$this->isUserExists($phone)) {
            // Generating password hash
            $password_hash = PassHash::hash($password);

            // Generating API key
            $api_key = $this->generateApiKey();

            // insert query
            $stmt = $this->conn->prepare("INSERT INTO users(name, phone, password_hash, api_key, status) values(?, ?, ?, ?, 1)");
            $stmt->bind_param("ssss", $name, $phone, $password_hash, $api_key);

            $result = $stmt->execute();

            $stmt->close();

            // Check for successful insertion
            if ($result) {
                // User successfully inserted
                return USER_CREATED_SUCCESSFULLY;
            } else {
                // Failed to create user
                return USER_CREATE_FAILED;
            }
        } else {
            // User with same phone already existed in the db
            return USER_ALREADY_EXISTED;
        }

        return $response;
    }

    /**
     * Checking user login
     * @param String $phone User login phone id
     * @param String $password User login password
     * @return boolean User login status success/fail
     */
    public function checkLogin($phone, $password) {
        // fetching user by phone
        $stmt = $this->conn->prepare("SELECT password_hash FROM users WHERE phone = ?");

        $stmt->bind_param("s", $phone);

        $stmt->execute();

        $stmt->bind_result($password_hash);

        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Found user with the phone
            // Now verify the password

            $stmt->fetch();

            $stmt->close();

            if (PassHash::check_password($password_hash, $password)) {
                // User password is correct
                return TRUE;
            } else {
                // user password is incorrect
                return FALSE;
            }
        } else {
            $stmt->close();

            // user not existed with the phone
            return FALSE;
        }
    }

    /**
     * Checking for duplicate user by phone address
     * @param String $phone phone to check in db
     * @return boolean
     */
    private function isUserExists($phone) {
        $stmt = $this->conn->prepare("SELECT id from users WHERE phone = ?");
        $stmt->bind_param("s", $phone);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Fetching user by phone
     * @param String $phone User phone id
     */
    public function getUserByPhone($phone) {
        $stmt = $this->conn->prepare("SELECT name, phone, api_key, status, created_at FROM users WHERE phone = ?");
        $stmt->bind_param("s", $phone);
        if ($stmt->execute()) {
            // $user = $stmt->get_result()->fetch_assoc();
            $stmt->bind_result($name, $phone, $api_key, $status, $created_at);
            $stmt->fetch();
            $user = array();
            $user["name"] = $name;
            $user["phone"] = $phone;
            $user["api_key"] = $api_key;
            $user["status"] = $status;
            $user["created_at"] = $created_at;
            $stmt->close();
            return $user;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user api key
     * @param String $user_id user id primary key in user table
     */
    public function getApiKeyById($user_id) {
        $stmt = $this->conn->prepare("SELECT api_key FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        if ($stmt->execute()) {
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->bind_result($api_key);
            $stmt->close();
            return $api_key;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user id by api key
     * @param String $api_key user api key
     */
    public function getUserId($api_key) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        if ($stmt->execute()) {
            $stmt->bind_result($user_id);
            $stmt->fetch();
            // TODO
            // $user_id = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $user_id;
        } else {
            return NULL;
        }
    }

    /**
     * Validating user api key
     * If the api key is there in db, it is a valid key
     * @param String $api_key user api key
     * @return boolean
     */
    public function isValidApiKey($api_key) {
        $stmt = $this->conn->prepare("SELECT id from users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Generating random Unique MD5 String for user Api key
     */
    private function generateApiKey() {
        return md5(uniqid(rand(), true));
    }

    /* ------------- `alerts` table method ------------------ */

    /**
     * Creating new alert
     * @param String $user_id user id to whom alert belongs to
     * @param String $alert alert text
     */
    public function createalert($user_id, $alert) {
        $stmt = $this->conn->prepare("INSERT INTO alerts(alert) VALUES(?)");
        $stmt->bind_param("s", $alert);
        $result = $stmt->execute();
        $stmt->close();

        if ($result) {
            // alert row created
            // now assign the alert to user
            $new_alert_id = $this->conn->insert_id;
            $res = $this->createUseralert($user_id, $new_alert_id);
            if ($res) {
                // alert created successfully
                return $new_alert_id;
            } else {
                // alert failed to create
                return NULL;
            }
        } else {
            // alert failed to create
            return NULL;
        }
    }

    /**
     * Fetching single alert
     * @param String $alert_id id of the alert
     */
    public function getalert($alert_id, $user_id) {
        $stmt = $this->conn->prepare("SELECT t.id, t.alert, t.status, t.created_at from alerts t, user_alerts ut WHERE t.id = ? AND ut.alert_id = t.id AND ut.user_id = ?");
        $stmt->bind_param("ii", $alert_id, $user_id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($id, $alert, $status, $created_at);
            // TODO
            // $alert = $stmt->get_result()->fetch_assoc();
            $stmt->fetch();
            $res["id"] = $id;
            $res["alert"] = $alert;
            $res["status"] = $status;
            $res["created_at"] = $created_at;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching all user alerts
     * @param String $user_id id of the user
     */
    public function getAllUseralerts($user_id) {
        $stmt = $this->conn->prepare("SELECT t.* FROM alerts t, user_alerts ut WHERE t.id = ut.alert_id AND ut.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $alerts = $stmt->get_result();
        $stmt->close();
        return $alerts;
    }

    /**
     * Updating alert
     * @param String $alert_id id of the alert
     * @param String $alert alert text
     * @param String $status alert status
     */
    public function updatealert($user_id, $alert_id, $alert, $status) {
        $stmt = $this->conn->prepare("UPDATE alerts t, user_alerts ut set t.alert = ?, t.status = ? WHERE t.id = ? AND t.id = ut.alert_id AND ut.user_id = ?");
        $stmt->bind_param("siii", $alert, $status, $alert_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /**
     * Deleting a alert
     * @param String $alert_id id of the alert to delete
     */
    public function deletealert($user_id, $alert_id) {
        $stmt = $this->conn->prepare("DELETE t FROM alerts t, user_alerts ut WHERE t.id = ? AND ut.alert_id = t.id AND ut.user_id = ?");
        $stmt->bind_param("ii", $alert_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_alerts` table method ------------------ */

    /**
     * Function to assign a alert to user
     * @param String $user_id id of the user
     * @param String $alert_id id of the alert
     */
    public function createUseralert($user_id, $alert_id) {
        $stmt = $this->conn->prepare("INSERT INTO user_alerts(user_id, alert_id) values(?, ?)");
        $stmt->bind_param("ii", $user_id, $alert_id);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }


    /* ------------- `companies` table method ------------------ */


    /**
     * Fetching all companies
     */
    public function getCompanies() {
        $stmt = $this->conn->prepare("SELECT t.* FROM companies t");
        $stmt->execute();
        $companies = $stmt->get_result();
        $stmt->close();
        return $companies;
    }


    /**
     * Creating new company
     */
    public function createCompany($company) {
        $stmt = $this->conn->prepare("INSERT INTO companies(name) VALUES(?)");
        $stmt->bind_param("s", $company);
        $result = $stmt->execute();
        $stmt->close();

        if ($result) {
            // company row created
            $res = $this->conn->insert_id;
            if ($res) {
                // company created successfully
                return $res;
            } else {
                // company failed to create
                return NULL;
            }
        } else {
            // company failed to create
            return NULL;
        }
    }

    /**
     * Fetching single company
     * @param String $id id of the company
     */
    public function getCompany($id) {
        $stmt = $this->conn->prepare("SELECT t.id, t.name, t.status, t.created_at from companies t, WHERE t.id = ? ");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($company_id, $name, $status, $created_at);
            
            $stmt->fetch();
            $res["id"] = $company_id;
            $res["name"] = $name;
            $res["status"] = $status;
            $res["created_at"] = $created_at;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    
    /**
     * Updating company
     * @param String $company_id id of the alert
     * @param String $name company name
     * @param String $status company status
     */
    public function updateCompany($company_id,$name,$status) {
        $stmt = $this->conn->prepare("UPDATE companies t, set t.name = ?, t.status = ? WHERE t.id = ? ");
        $stmt->bind_param("siii", $name, $status, $company_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /**
     * Deleting a company
     * @param String $company_id id of the company to delete
     */
    public function deleteCompany($company_id) {
        $stmt = $this->conn->prepare("DELETE t FROM alerts t WHERE t.id = ? ");
        $stmt->bind_param("i", $company_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }


}

?>
