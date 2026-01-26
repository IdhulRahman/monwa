import requests
import sys
import json
from datetime import datetime

class WhatsAppAPITester:
    def __init__(self, base_url="https://wa-dashboard-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_accounts = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and endpoint == 'accounts' and 'id' in response_data:
                        self.created_accounts.append(response_data['id'])
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_accounts_empty(self):
        """Test getting accounts when none exist"""
        success, response = self.run_test("Get Accounts (Empty)", "GET", "accounts", 200)
        if success and isinstance(response, list) and len(response) == 0:
            print("   ✅ Empty accounts list returned correctly")
            return True
        elif success and isinstance(response, list):
            print(f"   ⚠️  Found {len(response)} existing accounts")
            return True
        return False

    def test_create_account(self, name="Test Account", webhook_url=None):
        """Test creating a new account"""
        data = {"name": name}
        if webhook_url:
            data["webhook_url"] = webhook_url
            
        success, response = self.run_test("Create Account", "POST", "accounts", 200, data)
        if success and 'id' in response:
            print(f"   ✅ Account created with ID: {response['id']}")
            print(f"   ✅ Status: {response.get('status')}")
            print(f"   ✅ QR Code present: {'qr_code' in response and response['qr_code'] is not None}")
            return response['id']
        return None

    def test_get_accounts_with_data(self):
        """Test getting accounts when data exists"""
        success, response = self.run_test("Get Accounts (With Data)", "GET", "accounts", 200)
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   ✅ Found {len(response)} accounts")
            return True
        return False

    def test_get_single_account(self, account_id):
        """Test getting a specific account"""
        success, response = self.run_test(f"Get Account {account_id}", "GET", f"accounts/{account_id}", 200)
        if success and response.get('id') == account_id:
            print(f"   ✅ Account details retrieved correctly")
            return True
        return False

    def test_update_webhook(self, account_id, webhook_url="https://example.com/webhook"):
        """Test updating webhook URL"""
        data = {"webhook_url": webhook_url}
        success, response = self.run_test(f"Update Webhook {account_id}", "PUT", f"accounts/{account_id}/webhook", 200, data)
        if success and response.get('webhook_url') == webhook_url:
            print(f"   ✅ Webhook updated successfully")
            return True
        return False

    def test_simulate_connect(self, account_id):
        """Test simulating account connection"""
        success, response = self.run_test(f"Simulate Connect {account_id}", "POST", f"accounts/{account_id}/connect", 200)
        if success and 'message' in response:
            print(f"   ✅ Connection simulated successfully")
            return True
        return False

    def test_get_snapshot(self, account_id):
        """Test getting snapshot for connected account"""
        success, response = self.run_test(f"Get Snapshot {account_id}", "GET", f"accounts/{account_id}/snapshot", 200)
        if success and 'snapshot' in response and 'timestamp' in response:
            print(f"   ✅ Snapshot retrieved successfully")
            return True
        return False

    def test_delete_account(self, account_id):
        """Test deleting an account"""
        success, response = self.run_test(f"Delete Account {account_id}", "DELETE", f"accounts/{account_id}", 200)
        if success and 'message' in response:
            print(f"   ✅ Account deleted successfully")
            if account_id in self.created_accounts:
                self.created_accounts.remove(account_id)
            return True
        return False

    def test_get_nonexistent_account(self):
        """Test getting a non-existent account"""
        fake_id = "non-existent-id"
        success, response = self.run_test("Get Non-existent Account", "GET", f"accounts/{fake_id}", 404)
        return success

    def cleanup(self):
        """Clean up created test accounts"""
        print(f"\n🧹 Cleaning up {len(self.created_accounts)} test accounts...")
        for account_id in self.created_accounts.copy():
            self.test_delete_account(account_id)

def main():
    print("🚀 Starting WhatsApp Monitoring API Tests")
    print("=" * 50)
    
    tester = WhatsAppAPITester()
    
    try:
        # Test basic connectivity
        if not tester.test_root_endpoint()[0]:
            print("❌ API not accessible, stopping tests")
            return 1

        # Test account operations
        tester.test_get_accounts_empty()
        
        # Create test account
        account_id = tester.test_create_account("Test Account 1", "https://example.com/webhook1")
        if not account_id:
            print("❌ Failed to create account, stopping tests")
            return 1

        # Test account retrieval
        tester.test_get_accounts_with_data()
        tester.test_get_single_account(account_id)
        
        # Test webhook update
        tester.test_update_webhook(account_id, "https://updated-webhook.com")
        
        # Test connection simulation
        tester.test_simulate_connect(account_id)
        
        # Test snapshot after connection
        tester.test_get_snapshot(account_id)
        
        # Test error cases
        tester.test_get_nonexistent_account()
        
        # Create another account for additional testing
        account_id2 = tester.test_create_account("Test Account 2")
        
        # Test deletion
        if account_id2:
            tester.test_delete_account(account_id2)
        
        # Print results
        print(f"\n📊 Test Results:")
        print(f"   Tests Run: {tester.tests_run}")
        print(f"   Tests Passed: {tester.tests_passed}")
        print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        if tester.tests_passed == tester.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1
            
    except Exception as e:
        print(f"💥 Test suite failed with error: {str(e)}")
        return 1
    finally:
        tester.cleanup()

if __name__ == "__main__":
    sys.exit(main())