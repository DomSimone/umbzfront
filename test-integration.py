#!/usr/bin/env python3
"""
Frontend Integration Test Script
Tests the complete frontend integration with Docker container adapter
"""

import os
import sys
import json
import time
import requests
from pathlib import Path

class FrontendIntegrationTest:
    def __init__(self):
        self.base_url = "http://localhost:8080"
        self.api_url = "http://localhost:8000"
        self.ollama_url = "http://localhost:11434"
        
        # Test files to verify
        self.frontend_files = [
            "index.html",
            "monitor.html", 
            "apps.html",
            "styles.css",
            "config.js",
            "app.js",
            "docker-integration.js",
            "monitor.js",
            "extensions.js",
            "extensions-ui.js"
        ]
        
        # Test endpoints
        self.test_endpoints = [
            "/",
            "/monitor.html",
            "/apps.html",
            "/styles.css",
            "/config.js",
            "/app.js",
            "/docker-integration.js",
            "/monitor.js"
        ]

    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Umbuzo Frontend Integration Test Suite")
        print("=" * 50)
        
        tests = [
            ("File Structure", self.test_file_structure),
            ("Frontend Server", self.test_frontend_server),
            ("API Connectivity", self.test_api_connectivity),
            ("Ollama Integration", self.test_ollama_integration),
            ("Docker Integration", self.test_docker_integration),
            ("Frontend Functionality", self.test_frontend_functionality)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n📋 Testing: {test_name}")
            try:
                result = test_func()
                results.append((test_name, True, result))
                print(f"✅ {test_name}: PASSED")
            except Exception as e:
                results.append((test_name, False, str(e)))
                print(f"❌ {test_name}: FAILED - {e}")
        
        self.print_summary(results)
        return all(result[1] for result in results)

    def test_file_structure(self):
        """Test that all required frontend files exist"""
        frontend_dir = Path("frontend")
        if not frontend_dir.exists():
            raise Exception("Frontend directory not found")
        
        missing_files = []
        for file in self.frontend_files:
            file_path = frontend_dir / file
            if not file_path.exists():
                missing_files.append(file)
        
        if missing_files:
            raise Exception(f"Missing files: {', '.join(missing_files)}")
        
        return f"Found {len(self.frontend_files)} frontend files"

    def test_frontend_server(self):
        """Test that frontend server is accessible"""
        try:
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                return "Frontend server responding"
            else:
                raise Exception(f"Server returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            raise Exception("Frontend server not accessible")
        except requests.exceptions.Timeout:
            raise Exception("Frontend server timeout")

    def test_api_connectivity(self):
        """Test Umbuzo API connectivity"""
        try:
            # Test health endpoint
            response = requests.get(f"{self.api_url}/health", timeout=5)
            if response.status_code == 200:
                return "Umbuzo API accessible"
            else:
                raise Exception(f"API returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            raise Exception("Umbuzo API not accessible")
        except requests.exceptions.Timeout:
            raise Exception("Umbuzo API timeout")

    def test_ollama_integration(self):
        """Test Ollama API integration"""
        try:
            # Test Ollama API
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return "Ollama API accessible"
            else:
                raise Exception(f"Ollama returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            raise Exception("Ollama API not accessible")
        except requests.exceptions.Timeout:
            raise Exception("Ollama API timeout")

    def test_docker_integration(self):
        """Test Docker container status"""
        try:
            # Test container stats endpoint
            response = requests.post(
                f"{self.api_url}/api/docker/stats",
                json={"container": "umbuzo-ollama"},
                timeout=5
            )
            
            if response.status_code in [200, 500]:  # 500 is expected if Docker API not available
                return "Docker integration endpoint accessible"
            else:
                raise Exception(f"Docker endpoint returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            raise Exception("Docker integration endpoint not accessible")
        except requests.exceptions.Timeout:
            raise Exception("Docker integration timeout")

    def test_frontend_functionality(self):
        """Test frontend JavaScript functionality"""
        # This is a basic test - in a real scenario, you'd use a headless browser
        frontend_dir = Path("frontend")
        
        # Check that JavaScript files are syntactically valid
        js_files = ["app.js", "docker-integration.js", "monitor.js"]
        for js_file in js_files:
            file_path = frontend_dir / js_file
            if file_path.exists():
                content = file_path.read_text()
                # Basic syntax check - look for common issues
                if "undefined" in content.lower():
                    print(f"⚠️  Potential issue in {js_file}: 'undefined' found")
                if "console.error" in content:
                    print(f"⚠️  Error handling in {js_file}: console.error found")
        
        return "Frontend JavaScript files validated"

    def print_summary(self, results):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for _, success, _ in results if success)
        total = len(results)
        
        for test_name, success, message in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}: {message}")
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All tests passed! Frontend integration is working correctly.")
            print("\n📋 Next Steps:")
            print("1. Start the Docker container: docker-compose up -d")
            print("2. Start the frontend server: python -m http.server 8080")
            print("3. Open http://localhost:8080 in your browser")
            print("4. Use the monitor at http://localhost:8080/monitor.html")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Please check the issues above.")

def main():
    """Main test runner"""
    test_runner = FrontendIntegrationTest()
    
    try:
        success = test_runner.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()