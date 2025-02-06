import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/shop');
        setProducts(response.data);
      } catch (error) {
        console.error('Błąd pobierania danych: ', error);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    console.log(`Produkt "${product.nazwa}" został dodany do koszyka.`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: '1', backgroundColor: 'red' }}></div>
      <div style={{ flex: '4', padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {products.map(product => (
            <div key={product.id} style={{ boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '20px', backgroundColor: '#fff' }}>
              <h3>{product.nazwa}</h3>
              <img src={require(`./${product.photo1}`)} alt={product.nazwa} style={{ width: '100%', marginBottom: '10px' }} />
              <p>Cena: {product.cena}</p>
              <button onClick={() => addToCart(product)}>Dodaj do koszyka</button>
              <Link to="/koszyk">Przejdź do koszyka</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
