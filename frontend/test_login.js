import axios from 'axios';

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:8000/auth/login', {
      phone_number: '9999999999',
      password: 'Admin@123'
    });
    console.log("Login Token:", res.data.access_token);
    
    const meRes = await axios.get('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${res.data.access_token}` }
    });
    console.log("Me Response:", meRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

testLogin();
