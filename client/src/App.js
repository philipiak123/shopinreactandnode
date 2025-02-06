import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import ProductDetails from './ProductDetails';
import Login from './Login';
import Register from './Register';
import './Shop.css'; 
import LoginForm from './LoginForm';
import Navbar from './Navbar'; 
import Navbaroriginal from './Navbaroriginal'; 
import MyAccount from './MyAccount';
import AdminPanel from './AdminPanel';

const Shop = ({ addToCart, onSearchChange, searchTerm, loggedIn, handleLogout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [priceFrom, setPriceFrom] = useState(localStorage.getItem('priceFrom') || '');
  const [priceTo, setPriceTo] = useState(localStorage.getItem('priceTo') || '');
  const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'cena_asc');
  const [showNotification, setShowNotification] = useState(false); 

  useEffect(() => {
    fetchData();
  }, [sortBy, priceFrom, priceTo, searchTerm]);

  useEffect(() => {
    localStorage.setItem('priceFrom', priceFrom);
    localStorage.setItem('priceTo', priceTo);
    localStorage.setItem('sortBy', sortBy);
  }, [priceFrom, priceTo, sortBy]);

const fetchData = () => {
  const queryParams = `priceFrom=${priceFrom}&priceTo=${priceTo}&sortBy=${sortBy}&searchTerm=${searchTerm}`;
  
  axios
    .get(`http://localhost:5000/shop?${queryParams}`)
    .then(response => {
      // Sprawdzenie odpowiedzi z API
      console.log('Odpowiedź z API:', response.data);

      // Przekształcenie JSON-owego stringa w obiekt
      const photosString = response.data[1]?.photos || '{}'; // Pobieramy string JSON z odpowiedzi
      const photosObj = JSON.parse(photosString); // Parsujemy string na obiekt

      // Wypisanie całej tablicy photos
      const photos = photosObj.photos || [];
      console.log('Tablica zdjęć:', photos); // Wypisanie zdjęć

      if (photos.length > 0) {
        console.log('Pierwszy link w tablicy photos:', photos[0]); // Wypisanie pierwszego linku
      } else {
        console.log('Brak zdjęć w odpowiedzi.');
      }
      
      setProducts(response.data); // Zapisanie danych do stanu
    })
    .catch(error => {
      console.error('Błąd pobierania danych: ', error);
    });
};

  const handleSortChange = e => {
    setSortBy(e.target.value);
  };

  const handleProductClick = productId => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = product => {
    addToCart(product);
    setShowNotification(true); 
    setTimeout(() => {
      setShowNotification(false); 
    }, 3000);
  };

  return (
    <div>
      <Navbar loggedIn={loggedIn} handleLogout={handleLogout} onSearchChange={onSearchChange} />
      {showNotification && (
        <div className="notification">
          Produkt został dodany do koszyka!
        </div>
      )}
      <div style={{ display: 'flex', height: '100%' }}>
        <div className="filter-container">
          <div className="filter-content">
            <h2 style={{ textAlign: 'center' }}>Filtry</h2>
            <p>Cena:</p>
            <div className="price-filter">
              <label htmlFor="priceFrom">Od:</label>
              <input
                type="number"
                id="priceFrom"
                placeholder="Cena od"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="price-input"
              />
              <label htmlFor="priceTo">Do:</label>
              <input
                type="number"
                id="priceTo"
                placeholder="Cena do"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="price-input"
              />
            </div>
            <label htmlFor="sortBy">Sortowanie:</label>
            <select id="sortBy" value={sortBy} onChange={handleSortChange} className="sort-select">
              <option value="cena_asc">Cena rosnąco</option>
              <option value="cena_desc">Cena malejąco</option>
              <option value="nazwa_asc">Nazwa A-Z</option>
              <option value="nazwa_desc">Nazwa Z-A</option>
              <option value="ocena_asc">Ocena rosnąco</option>
              <option value="ocena_desc">Ocena malejąco</option>
            </select>
          </div>
        </div>
        <div style={{ flex: '4', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {products.map(product => (
              <div
                key={product.id}
                style={{ boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '20px', backgroundColor: '#fff' }}
                onClick={() => handleProductClick(product.id)}
              >
                <h3 style={{ textAlign: 'center' }}>{product.name}</h3>
<img
  src={
    Array.isArray(JSON.parse(product.photos)?.photos)
      ? JSON.parse(product.photos)?.photos[0] // Jeśli photos jest tablicą, pobieramy pierwsze zdjęcie
      : '' // Jeśli nie, przypisujemy pusty string jako domyślną wartość
  }
  alt={product.name}
  style={{ width: '100%', marginBottom: '10px' }}
/>
     <p style={{ textAlign: 'center' }}>Price: {product.cena}</p>
                <p style={{ textAlign: 'center' }}>Ocena: {product.srednia_ocena}</p>
                <button
                  className="add-to-cart-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  Dodaj do koszyka
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Koszyk = ({ cart, setCart, increaseQuantity, decreaseQuantity, removeFromCart, loggedIn, userData }) => {
  const [totalPrice, setTotalPrice] = useState(calculateTotalPrice(cart));
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setTotalPrice(calculateTotalPrice(cart));
  }, [cart]);

  function calculateTotalPrice(cart) {
    return cart.reduce((total, product) => total + product.cena * product.quantity, 0).toFixed(2);
  }

  function handleChangeQuantity(product, newQuantity) {
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      const updatedProduct = { ...product, quantity: newQuantity };
      const updatedCart = cart.map(item => 
        item.id === product.id ? updatedProduct : item
      );
      setCart(updatedCart);
    }
  }

  const handleOrder = () => {
    if (loggedIn) {
      const orderDetails = {
        userId: userData.id,
        cart
      };

      axios.post('http://localhost:5000/order', orderDetails)
        .then(response => {
          console.log('Zamówienie złożone:', response.data);
          setCart([]); 
        })
        .catch(error => {
          console.error('Błąd składania zamówienia:', error);
        });
    } else {
      setShowPopup(true);
    }
  };

  return (
    <div className="cart-container">
      <h2 className="koszyk">Koszyk</h2>
      {cart.length === 0 ? (
        <p className="empty-cart-message">Koszyk jest pusty</p>
      ) : (
        <div>
          <div className="table-container">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Ilość</th>
                  <th>Cena jednostkowa</th>
                  <th>Cena łączna</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value, 10);
                          handleChangeQuantity(item, newQuantity);
                        }}
                        className="quantity-input"
                      />
                    </td>
                    <td>{item.cena.toFixed(2)} zł</td>
                    <td>{(item.cena * item.quantity).toFixed(2)} zł</td>
                    <td>
                      <button onClick={() => removeFromCart(item)} className="action-button">Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="total-price">Suma: {totalPrice} zł</p>
          <button onClick={handleOrder} className="order-button">Złóż zamówienie</button>
        </div>
      )}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>Musisz być zalogowany, aby złożyć zamówienie</p>
            <button onClick={() => setShowPopup(false)}>Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AppContent = ({ cart, setCart, loggedIn, handleLogout, handleLogin, userData, searchTerm, setSearchTerm, isAdmin }) => {
  const location = useLocation();
  const showOriginalNavbar = location.pathname !== '/';

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
      setCart([...cart]);
    } else {
      setCart([...cart, { ...product, quantity: product.quantity || 1 }]);
    }
  };

  const removeFromCart = (productToRemove) => {
    const updatedCart = cart.filter(item => item.id !== productToRemove.id);
    setCart(updatedCart);
  };

  const increaseQuantity = (product) => {
    product.quantity += 1;
    setCart([...cart]); 
  };

  const decreaseQuantity = (product) => {
    if (product.quantity > 1) {
      product.quantity -= 1;
      setCart([...cart]); 
    }
  };

  return (
    <>
	{showOriginalNavbar && <Navbaroriginal loggedIn={loggedIn} handleLogout={handleLogout} isAdmin={isAdmin} />}
      <div className="content">
        <Routes>
          <Route path="/logowanie" element={<LoginForm handleLogin={handleLogin} />} />
          <Route path="/rejestracja" element={<Register />} />
          <Route
            path="/"
            element={<Shop
              addToCart={addToCart}
              onSearchChange={setSearchTerm}
              searchTerm={searchTerm}
              loggedIn={loggedIn}
              handleLogout={handleLogout}
            />}
          />
          <Route
            path="/product/:id"
            element={<ProductDetails addToCart={addToCart} loggedIn={loggedIn} userData={userData} />}
          />
			console.log("isAdmin w Route:", isAdmin);
                <Route path="/admin" element={<AdminPanel />} />
          <Route
            path="/koszyk"
            element={<Koszyk
              cart={cart}
              setCart={setCart}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeFromCart={removeFromCart}
              loggedIn={loggedIn}
              userData={userData}
            />}
          />
          <Route
            path="/konto"
            element={loggedIn ? <MyAccount loggedIn={loggedIn} userData={userData} /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTerm') || '');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (userData) => {
    setUserData(userData);
    setLoggedIn(true);
    setIsAdmin(userData.isAdmin); 
  };

const handleLogout = async () => {
  try {
    // Wywołanie endpointu do wylogowania
    await axios.post('http://localhost:5000/logout', {}, {
      withCredentials: true,
    });

    // Zmiana stanu po wylogowaniu
    setLoggedIn(false);        // Ustawienie stanu zalogowanego użytkownika na false
    setUserData(null);          // Resetowanie danych użytkownika
    setIsAdmin(false);          // Ustawienie wartości isAdmin na false
  } catch (error) {
    console.error('Błąd podczas wylogowywania:', error);
  }
};


  useEffect(() => {
const checkSession = async () => {
  try {
    const response = await fetch('http://localhost:5000/user-data', {
      method: 'GET',
      credentials: 'include', // Używamy credentials: 'include'
    });

    const data = await response.json();
    
    console.log('Otrzymane dane użytkownika:', data.user);

    if (data.user && Object.keys(data.user).length > 0) {
      setUserData(data.user);
      setLoggedIn(true);
      setIsAdmin(data.user.isAdmin); 
    } else {
      setUserData(null);
      setLoggedIn(false);
      setIsAdmin(false);
    }
  } catch (error) {
    console.error('Błąd podczas sprawdzania sesji:', error);
    setUserData(null);
    setLoggedIn(false);
    setIsAdmin(false);
  }
};



    checkSession(); // Sprawdzenie sesji przy każdym załadowaniu aplikacji
  }, []); // Pusta lista zależności oznacza, że ten efekt uruchomi się tylko raz po pierwszym renderze

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('searchTerm', searchTerm);
  }, [searchTerm]);

  return (
    <Router>
      <div className="app">
        <AppContent
          cart={cart}
          setCart={setCart}
          loggedIn={loggedIn}
          handleLogout={handleLogout}
          handleLogin={handleLogin}
          userData={userData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
    </Router>
  );
};


export default App;
