<?php
// Test the actual API endpoint that the frontend is calling
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/teams/7/members';

// Simulate the API routing
require_once 'api/index.php';
