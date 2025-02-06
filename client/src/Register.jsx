import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Hasła nie są identyczne');
      return;
    }

    try {
      await axios.post('http://localhost:5000/register', {
        email,
        password
      });
      setMessage('Użytkownik zarejestrowany pomyślnie');
      navigate('/logowanie');
    } catch (error) {
      setMessage(error.response.data.error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '400px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Rejestracja</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>Email:</label>
            <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>Hasło:</label>
            <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>Powtórz hasło:</label>
            <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button style={{ width: '100%', padding: '10px', backgroundColor: 'green', color: 'white', borderRadius: '5px', border: 'none' }} type="submit">Zarejestruj</button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>Masz już konto? <Link to="/logowanie">Zaloguj się</Link></p>
        {message && <p style={{ textAlign: 'center', color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
};

export default Register;
